"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AUTH_SESSION_CLEARED_EVENT,
  getStoredSession,
} from "@/lib/supabaseAuth";

export default function SessionTimeoutNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleSessionCleared(event: Event) {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      if (reason !== "expired") return;

      setVisible(true);
      window.setTimeout(() => setVisible(false), 8000);
    }

    function checkSessionExpiry() {
      getStoredSession();
    }

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    const interval = window.setInterval(checkSessionExpiry, 15000);
    checkSessionExpiry();

    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
      window.clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-4 z-[9999] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-amber-200 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-950">
            You have been logged out
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Your session expired for security. Please sign in again to continue.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
