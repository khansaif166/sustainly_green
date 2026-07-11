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
// React Icons
import {
  HiShieldCheck,
  HiOfficeBuilding,
  HiBadgeCheck,
  HiGlobeAlt,
} from "react-icons/hi";

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
          setError("Password reset redirect is not allowed in Supabase. Add this site's /reset-password URL to Supabase Auth Redirect URLs.");
        } else if (err.code === "over_email_send_rate_limit" || err.status === 429) {
          setError("Email rate limit exceeded. Please wait a few minutes before requesting another reset email.");
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

      router.push(redirectForRole(profile));
    } catch (err: unknown) {
      if (err instanceof SupabaseAuthError) {
        if (err.code === "email_not_confirmed") {
          setError("Please verify your email before signing in. Check your inbox for the confirmation link.");
        } else if (err.status === 429) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else {
          setError(err.message || "Login failed. Please check your email and password.");
        }
      } else {
        setError("Login failed. Please check your email and password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* ================= LEFT BRAND PANEL ================= */}
      <div className="hidden md:flex relative flex-col justify-center px-12 bg-gradient-to-br from-green-900 to-emerald-700 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
        />

        <Link
          href="/"
          className="
          inline-flex items-center gap-2 mb-8
          px-3 py-1.5
           text-sm font-medium absolute top-6 left-10
        "
        >
          <img src="/log.webp" alt="Sustainly Green" className="h-14 rounded-xl p-2 bg-white" />
        </Link>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl font-bold leading-tight">
            Sign in to your <br /> global business workspace
          </h1>

          <p className="mt-4 text-sm text-green-100">
            Manage products, connect with verified buyers, and grow your
            business across international markets on a trusted B2B platform.
          </p>

          <ul className="mt-6 space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <HiBadgeCheck className="text-xl text-green-300" />
              Trusted buyers & verified vendors worldwide
            </li>
            <li className="flex items-center gap-3">
              <HiGlobeAlt className="text-xl text-green-300" />
              Global reach across multiple countries
            </li>
            <li className="flex items-center gap-3">
              <HiShieldCheck className="text-xl text-green-300" />
              Secure, compliant & scalable infrastructure
            </li>
            <li className="flex items-center gap-3">
              <HiOfficeBuilding className="text-xl text-green-300" />
              Built for enterprises, SMEs & manufacturers
            </li>
          </ul>

          <p className="mt-10 text-xs text-green-200">
            Sustainly · Powering global sustainable B2B trade
          </p>
        </div>
      </div>

      {/* ================= RIGHT LOGIN FORM ================= */}
      <div className="flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900">
              Welcome back
            </h2>
            <p className="text-sm text-gray-600 mt-2">Sign in to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b-2 border-gray-300
                           py-2 text-lg font-medium text-gray-900
                           focus:outline-none focus:border-black"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-b-2 border-gray-300
               py-2 text-lg font-medium text-gray-900
               focus:outline-none focus:border-black"
              />

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-xs font-medium text-gray-600 hover:text-black transition"
                >
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              {resetSent && (
                <p className="text-xs text-green-600 mt-2">
                  Password reset email sent. Check your inbox.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm font-medium text-red-600">{error}</div>
            )}



            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black text-white py-3 text-sm font-semibold
                         hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-sm text-gray-600">
            New to Sustainly?{" "}
            <Link
              href="/register"
              className="font-semibold text-black hover:underline"
            >
              Create an account
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Secure login powered by Supabase Authentication
          </p>
        </div>
      </div>
    </main>
  );
}
