"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Store } from "lucide-react";
import {
  ensureCurrentProfile,
  getValidSession,
  redirectForRole,
  signOutSupabase,
} from "@/lib/supabaseAuth";
import { readApiJson } from "@/lib/clientApiResponse";

const VENDOR_SIGNUP = "/register?role=VENDOR";

/**
 * Landing spot for a signed-in BUYER who wants to sell: vendors who signed up
 * as buyers by mistake end up here from the vendor panel guard, from a vendor
 * signup link, or from "List your business" in the buyer panel.
 */
export default function BecomeVendorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const session = await getValidSession();
      if (!session) {
        router.replace(VENDOR_SIGNUP);
        return;
      }

      const profile = await ensureCurrentProfile(session.accessToken).catch(() => null);
      if (!profile) {
        router.replace(VENDOR_SIGNUP);
        return;
      }
      if (profile.role !== "BUYER") {
        router.replace(redirectForRole(profile));
        return;
      }

      setEmail(profile.email || session.user.email || "");
      setChecking(false);
    }
    void load();
  }, [router]);

  async function switchToVendor() {
    setError(null);
    setSwitching(true);
    try {
      const session = await getValidSession();
      if (!session) {
        router.replace(VENDOR_SIGNUP);
        return;
      }
      const response = await fetch("/api/account/become-vendor", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const payload = await readApiJson<{ redirectTo: string }>(
        response,
        "Unable to switch this account to a vendor account.",
      );
      router.replace(payload.redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to switch this account to a vendor account.");
      setSwitching(false);
    }
  }

  async function useDifferentEmail() {
    await signOutSupabase();
    router.replace(VENDOR_SIGNUP);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/buyer/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to buyer dashboard
        </Link>

        <div className="rounded-[1.75rem] border border-gray-100 bg-white p-7 shadow-xl shadow-gray-200/60">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <Store className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-950">List your business</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            You&apos;re signed in as{" "}
            <span className="font-semibold text-gray-950">{email}</span>, which is a{" "}
            <span className="font-semibold text-gray-950">buyer</span> account. To sell on
            Sustainly Green you need a vendor account.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Switching turns this account into a vendor account. You&apos;ll complete vendor
            onboarding, and your listing goes live after admin approval. The buyer panel
            won&apos;t be available on this account afterwards.
          </div>

          {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

          <button
            type="button"
            onClick={switchToVendor}
            disabled={switching}
            className="mt-6 w-full rounded-full bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
          >
            {switching ? "Switching..." : "Switch to a vendor account"}
          </button>

          <button
            type="button"
            onClick={useDifferentEmail}
            disabled={switching}
            className="mt-3 w-full rounded-full border border-gray-300 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:opacity-60"
          >
            Register the business with a different email
          </button>
        </div>
      </div>
    </main>
  );
}
