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
      if (!window.location.hash.includes("access_token=")) return;

      try {
        const session = await saveSessionFromAuthHash(window.location.hash);
        if (!session || cancelled) return;

        const profile = await ensureCurrentProfile(session.accessToken);
        if (cancelled) return;

        const target = redirectForRole(profile);
        window.history.replaceState(null, "", target);
        window.location.replace(target);
      } catch (error) {
        console.error("SUPABASE_AUTH_CALLBACK_ERROR", error);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    handleAuthHash();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
