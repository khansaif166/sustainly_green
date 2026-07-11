"use client";

import { useEffect } from "react";
import {
  ensureCurrentProfile,
  redirectForRole,
  saveSessionFromAuthHash,
} from "@/lib/supabaseAuth";

export default function SupabaseAuthCallback() {
  useEffect(() => {
    let cancelled = false;

    async function handleAuthHash() {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const authType = params.get("type");

      if (
        pathname.replace(/\/+$/, "") === "/reset-password" ||
        pathname.replace(/\/+$/, "") === "/verify-email" ||
        authType === "recovery" ||
        hash.includes("type=recovery")
      ) {
        return;
      }

      if (hash.includes("error=")) {
        const desc = params.get("error_description") || "email_verification_failed";
        window.location.replace(`/login?error=${encodeURIComponent(desc)}`);
        return;
      }

      if (!hash.includes("access_token=")) return;

      try {
        const session = await saveSessionFromAuthHash(window.location.hash);
        if (!session || cancelled) return;

        // Retry once with a short delay to handle read-after-write race on profile upsert
        let profile = null;
        try {
          profile = await ensureCurrentProfile(session.accessToken);
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
          if (cancelled) return;
          profile = await ensureCurrentProfile(session.accessToken);
        }

        if (cancelled) return;

        const target = redirectForRole(profile);
        window.history.replaceState(null, "", target);
        window.location.replace(target);
      } catch (error) {
        console.error("SUPABASE_AUTH_CALLBACK_ERROR", error);
        window.location.replace("/login?error=profile_setup_failed");
      }
    }

    handleAuthHash();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
