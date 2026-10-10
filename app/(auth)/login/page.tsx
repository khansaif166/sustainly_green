"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ensureCurrentProfile,
  redirectForRole,
  requestPasswordReset,
  signInWithSupabase,
  SupabaseAuthError,
} from "@/lib/supabaseAuth";

import {
  AuthShell,
  PasswordInput,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "../_components/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handlePasswordReset() {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setResetLoading(true);
      await requestPasswordReset(email);
      setResetSent(true);
      setError(null);
    } catch (err: unknown) {
      console.error("PASSWORD_RESET_ERROR", err);
      if (err instanceof SupabaseAuthError) {
        if (/redirect/i.test(err.message)) {
          setError(
            "Password reset redirect is not allowed in Supabase. Add this site's /reset-password URL to Supabase Auth Redirect URLs."
          );
        } else if (err.code === "over_email_send_rate_limit" || err.status === 429) {
          setError(
            "Email rate limit exceeded. Please wait a few minutes before requesting another reset email."
          );
        } else {
          setError(err.message || "Failed to send reset email.");
        }
      } else {
        setError("Failed to send reset email.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await signInWithSupabase(email, password);
      const profile = await ensureCurrentProfile(session.accessToken);
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : null;
      router.push(safeNext || redirectForRole(profile));
    } catch (err: unknown) {
      if (err instanceof SupabaseAuthError) {
        if (err.code === "email_not_confirmed") {
          setError("Please verify your email before signing in.");
        } else if (err.status === 429) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else {
          setError(err.message || "Login failed. Please check your credentials.");
        }
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell badge="Welcome back 👋" heading="Where India's Sustainable Business Begins.">
      {/* Header */}
      <div className="mb-6 lg:mb-8 text-center lg:text-left">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome back.
        </h2>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          Sign in to your Sustainly Green account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
        {/* Email */}
        <div>
          <label className={authLabelClass}>Business Email</label>
          <input
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClass}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[13px] font-bold text-gray-700">Password</label>
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-[12px] font-semibold text-[#059669] hover:text-[#047857] transition-colors"
            >
              {resetLoading ? "Sending link..." : "Forgot password?"}
            </button>
          </div>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {resetSent && (
          <p className="text-xs text-center font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-lg">
            Password reset email sent. Check your inbox.
          </p>
        )}
      </form>

      {/* Sign-up options: each keeps its role so /register opens on the right choice */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-center text-[13px] font-semibold text-gray-500 mb-3">
          New to Sustainly Green?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/register?role=BUYER"
            className="rounded-xl border border-gray-200 px-4 py-3 text-center hover:border-[#059669] hover:bg-emerald-50/50 transition-all"
          >
            <span className="block text-[13px] font-bold text-gray-900">Register as a buyer</span>
            <span className="block text-[11px] text-gray-500 mt-0.5">Source sustainable products</span>
          </Link>
          <Link
            href="/register?role=VENDOR"
            className="rounded-xl border border-gray-200 px-4 py-3 text-center hover:border-[#059669] hover:bg-emerald-50/50 transition-all"
          >
            <span className="block text-[13px] font-bold text-gray-900">List your business</span>
            <span className="block text-[11px] text-gray-500 mt-0.5">Sell as a supplier</span>
          </Link>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="mt-6 text-center text-[11px] text-gray-400 leading-relaxed">
        By signing in, I confirm that I have read and agree to the{" "}
        <Link href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link> and{" "}
        <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
      </div>
    </AuthShell>
  );
}
