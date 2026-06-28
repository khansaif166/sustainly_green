"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, LogOut, Clock } from "lucide-react";
import {
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_SESSION_SAVED_EVENT,
  forceRefreshSession,
  getStoredSession,
  signOutSupabase,
} from "@/lib/supabaseAuth";

const WARN_BEFORE_MS    = 5  * 60 * 1000; // show modal 5 min before expiry
const REFRESH_BEFORE_MS = 10 * 60 * 1000; // silent refresh 10 min before expiry
const IDLE_TIMEOUT_MS   = 30 * 60 * 1000; // force logout after 30 min idle
const SESSION_STORAGE_KEY = "sustainly.supabase.session"; // must match supabaseAuth.ts

function fmt(secs: number) {
  const s = Math.max(0, secs);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function SessionTimeoutNotice() {
  const router = useRouter();
  const [showModal, setShowModal]   = useState(false);
  const [secondsLeft, setSeconds]   = useState(300);
  const [refreshing, setRefreshing] = useState(false);

  // All timers in a ref — closures never go stale
  const T = useRef<{
    silentRefresh?: ReturnType<typeof setTimeout>;
    warnShow?:      ReturnType<typeof setTimeout>;
    forceLogout?:   ReturnType<typeof setTimeout>;
    countdown?:     ReturnType<typeof setInterval>;
    idle?:          ReturnType<typeof setTimeout>;
  }>({});

  // Stable function refs so inner closures don't capture stale values
  const scheduleRef  = useRef<(expiresAt: number) => void>(() => {});
  const doLogoutRef  = useRef<(reason: "expired" | "idle" | "manual") => Promise<void>>(async () => {});
  const resetIdleRef = useRef<() => void>(() => {});

  // Bug 1 fix: guard so only the first doLogout call wins
  const isLoggingOut = useRef(false);

  useEffect(() => {
    function clearAll() {
      clearTimeout(T.current.silentRefresh);
      clearTimeout(T.current.warnShow);
      clearTimeout(T.current.forceLogout);
      clearInterval(T.current.countdown);
      clearTimeout(T.current.idle);
    }

    async function doLogout(_reason: "expired" | "idle" | "manual") {
      // Bug 1 fix: prevent double-logout from concurrent timer firings
      if (isLoggingOut.current) return;
      isLoggingOut.current = true;
      clearAll();
      setShowModal(false);
      try { await signOutSupabase(); } catch {}
      router.push("/login");
    }
    doLogoutRef.current = doLogout;

    function resetIdle() {
      clearTimeout(T.current.idle);
      T.current.idle = setTimeout(() => void doLogoutRef.current("idle"), IDLE_TIMEOUT_MS);
    }
    resetIdleRef.current = resetIdle;

    function startCountdown(expiresAt: number) {
      clearInterval(T.current.countdown);
      T.current.countdown = setInterval(() => {
        const remaining = Math.floor((expiresAt - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(T.current.countdown);
          void doLogoutRef.current("expired");
        } else {
          setSeconds(remaining);
        }
      }, 1000);
    }

    function schedule(expiresAt: number) {
      clearAll();
      isLoggingOut.current = false; // Bug 1 fix: reset guard when a fresh session is scheduled
      const left = expiresAt - Date.now();

      if (left <= 0) { void doLogoutRef.current("expired"); return; }

      // Already inside warning window (e.g. page loaded with <5 min left)
      if (left <= WARN_BEFORE_MS) {
        setSeconds(Math.floor(left / 1000));
        setShowModal(true);
        startCountdown(expiresAt);
        // Bug 1 fix: only forceLogout OR countdown will win — the guard handles the other
        T.current.forceLogout = setTimeout(() => void doLogoutRef.current("expired"), left);
        resetIdleRef.current();
        return;
      }

      // Silent refresh at 10-min mark
      if (left > REFRESH_BEFORE_MS) {
        T.current.silentRefresh = setTimeout(async () => {
          const next = await forceRefreshSession();
          if (next?.expiresAt) {
            // onSaved fires synchronously during forceRefreshSession → schedule() already called.
            // Nothing to do here.
          } else {
            // Bug 2 fix: refresh failed — use the stored session's actual remaining time,
            // not an arbitrary Date.now() + WARN_BEFORE_MS which ignores real expiry.
            const stored = getStoredSession();
            const fallbackExpiry = stored?.expiresAt ?? (Date.now() + WARN_BEFORE_MS);
            scheduleRef.current(fallbackExpiry);
          }
        }, left - REFRESH_BEFORE_MS);
      }

      // Show warning modal at 5-min mark
      T.current.warnShow = setTimeout(() => {
        const remaining = Math.floor((expiresAt - Date.now()) / 1000);
        setSeconds(remaining);
        setShowModal(true);
        startCountdown(expiresAt);
      }, left - WARN_BEFORE_MS);

      // Force logout at exact expiry
      // Bug 1 fix: isLoggingOut guard ensures only one of this or countdown wins
      T.current.forceLogout = setTimeout(() => void doLogoutRef.current("expired"), left);

      resetIdleRef.current();
    }
    scheduleRef.current = schedule;

    // ── Boot ──
    const session = getStoredSession();
    if (session?.expiresAt) schedule(session.expiresAt);

    // Re-schedule when a new session is saved (fired synchronously by saveSession() in supabaseAuth.ts)
    function onSaved() {
      const s = getStoredSession();
      if (s?.expiresAt) scheduleRef.current(s.expiresAt);
    }
    function onCleared() {
      clearAll();
      setShowModal(false);
    }

    // Bug 4 fix: cross-tab session sync via the storage event
    function onStorage(e: StorageEvent) {
      if (e.key !== SESSION_STORAGE_KEY) return;
      if (e.newValue) {
        try {
          const s = JSON.parse(e.newValue) as { expiresAt?: number };
          if (s.expiresAt) scheduleRef.current(s.expiresAt);
        } catch {}
      } else {
        // Session removed in another tab
        clearAll();
        setShowModal(false);
        router.push("/login");
      }
    }

    // Idle reset on any user activity
    const IDLE_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    const onActivity = () => resetIdleRef.current();

    window.addEventListener(AUTH_SESSION_SAVED_EVENT, onSaved);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, onCleared);
    window.addEventListener("storage", onStorage); // Bug 4: cross-tab
    IDLE_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      clearAll();
      window.removeEventListener(AUTH_SESSION_SAVED_EVENT, onSaved);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, onCleared);
      window.removeEventListener("storage", onStorage);
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
    };
  // router is stable (Next.js guarantees this), runs once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const next = await forceRefreshSession();
      if (next?.expiresAt) {
        // Bug 3 fix: forceRefreshSession() → saveSession() → dispatches AUTH_SESSION_SAVED_EVENT
        // synchronously, so onSaved() already called schedule(next.expiresAt) before we get here.
        // Just dismiss the modal — no second schedule() call needed.
        setShowModal(false);
        setRefreshing(false);
      } else {
        setRefreshing(false);
        void doLogoutRef.current("expired");
      }
    } catch {
      setRefreshing(false);
      void doLogoutRef.current("expired");
    }
  }

  if (!showModal) return null;

  const pct      = Math.min(100, (secondsLeft / 300) * 100);
  const barColor = secondsLeft <= 60 ? "#ef4444" : secondsLeft <= 120 ? "#f59e0b" : "#16a34a";
  const urgent   = secondsLeft <= 60;

  return (
    <>
      <style>{`
        @keyframes stn-spin { to { transform: rotate(360deg); } }
        @keyframes stn-in   { from { opacity: 0; transform: scale(.93); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)", padding: 16,
      }}>
        <div style={{
          background: "#fff", borderRadius: 24, padding: "32px 28px 28px",
          maxWidth: 400, width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          display: "flex", flexDirection: "column", gap: 22, textAlign: "center",
          animation: "stn-in .2s ease",
        }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: urgent ? "#fef2f2" : "#fffbeb",
            border: `2px solid ${urgent ? "#fecaca" : "#fde68a"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto", transition: "all .3s",
          }}>
            <Clock size={28} color={urgent ? "#dc2626" : "#d97706"} />
          </div>

          {/* Text */}
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#111", margin: "0 0 10px", letterSpacing: "-.02em" }}>
              Session Expiring Soon
            </h2>
            <p style={{ fontSize: 13.5, color: "#6b7280", margin: 0, lineHeight: 1.65 }}>
              Your session expires in{" "}
              <span style={{ fontWeight: 800, fontSize: 16, color: urgent ? "#dc2626" : "#d97706" }}>
                {fmt(secondsLeft)}
              </span>
              . Click <strong style={{ color: "#15803d" }}>Refresh Session</strong> to stay logged in.
            </p>
          </div>

          {/* Countdown progress bar */}
          <div style={{ background: "#f3f4f6", borderRadius: 50, height: 7, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 50,
              background: barColor,
              width: `${pct}%`,
              transition: "width 1s linear, background .4s",
            }} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#16a34a", color: "#fff", border: "none",
                borderRadius: 50, padding: "13px 24px",
                fontSize: 14, fontWeight: 700,
                cursor: refreshing ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "background .15s",
                boxShadow: "0 4px 16px rgba(22,163,74,.3)",
                opacity: refreshing ? 0.7 : 1,
              }}
            >
              <RefreshCw
                size={15}
                style={{ animation: refreshing ? "stn-spin .7s linear infinite" : "none" }}
              />
              {refreshing ? "Refreshing…" : "Refresh Session"}
            </button>

            <button
              onClick={() => void doLogoutRef.current("manual")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#fff", color: "#6b7280",
                border: "1.5px solid #e5e7eb", borderRadius: 50, padding: "12px 24px",
                fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all .15s",
              }}
            >
              <LogOut size={14} />Logout Now
            </button>
          </div>

          <p style={{ fontSize: 11.5, color: "#bbb", margin: 0, lineHeight: 1.6 }}>
            You'll be logged out automatically when the timer reaches 0:00.
            <br />30 minutes of inactivity also triggers logout.
          </p>
        </div>
      </div>
    </>
  );
}
