"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ensureCurrentProfile,
  redirectForRole,
  saveSessionFromAuthHash,
} from "@/lib/supabaseAuth";

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleVerification() {
      const hash = window.location.hash;

      if (hash.includes("error=")) {
        router.replace("/login?error=email_verification_failed");
        return;
      }

      if (!hash.includes("access_token=")) {
        router.replace("/login");
        return;
      }

      try {
        const session = await saveSessionFromAuthHash(hash);
        if (!session) {
          router.replace("/login?error=verification_failed");
          return;
        }

        let profile = null;
        try {
          profile = await ensureCurrentProfile(session.accessToken);
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
          profile = await ensureCurrentProfile(session.accessToken);
        }

        router.replace(redirectForRole(profile));
      } catch {
        router.replace("/login?error=verification_failed");
      }
    }

    handleVerification();
  }, [router]);

  return null;
}
