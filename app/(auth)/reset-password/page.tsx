"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  saveSessionFromAuthHash,
  updateSupabasePassword,
  type SupabaseSession,
} from "@/lib/supabaseAuth";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingToken, setLoadingToken] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function readRecoveryToken() {
      const hash = window.location.hash;

      if (hash.includes("error=")) {
        setError("This reset link is invalid or expired. Please request a new password reset email.");
        setLoadingToken(false);
        return;
      }

      if (!hash.includes("access_token=")) {
        setError("Open the password reset link from your email to continue.");
        setLoadingToken(false);
        return;
      }

      try {
        const nextSession = await saveSessionFromAuthHash(hash);
        setSession(nextSession);
        window.history.replaceState(null, "", "/reset-password");
      } catch {
        setError("We could not verify this reset link. Please request a new password reset email.");
      } finally {
        setLoadingToken(false);
      }
    }

    readRecoveryToken();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!session?.accessToken) {
      setError("Open the password reset link from your email to continue.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await updateSupabasePassword(session.accessToken, password);
      setSuccess(true);
    } catch {
      setError("We could not update your password. Please request a new reset link and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-950">Reset password</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Create a new password for your Sustainly account.
              </p>
            </div>
          </div>

          {loadingToken ? (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm font-medium text-gray-600">
              <Loader2 className="animate-spin" size={18} />
              Checking reset link...
            </div>
          ) : success ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>Your password has been updated. You can now sign in with the new password.</span>
              </div>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Go to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base font-medium text-gray-950 outline-none transition focus:border-green-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base font-medium text-gray-950 outline-none transition focus:border-green-700"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !session}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {submitting ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
