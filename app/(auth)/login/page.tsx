"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, setLocalPersistence } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
// React Icons
import {
  HiShieldCheck,
  HiOfficeBuilding,
  HiBadgeCheck,
  HiGlobeAlt,
} from "react-icons/hi";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showResend, setShowResend] = useState(false);
  const [resent, setResent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  async function handlePasswordReset() {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError(null);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
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
      await setLocalPersistence();

      // 🔐 Login
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const user = cred.user;

      // 🔍 Fetch user profile
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }

      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        setShowResend(true);
        return;
      }

      async function resendVerification() {
        if (!auth.currentUser) return;
        await sendEmailVerification(auth.currentUser);
        setResent(true);
      }
      const userData = userSnap.data();
      if (!user.emailVerified) {
        await auth.signOut();
        setError("Please verify your email before logging in.");
        return;
      }
      // 🔁 Role based redirect
      if (userData.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      if (userData.role === "BUYER") {
        router.push("/");
        return;
      }

      if (userData.role === "VENDOR") {

  // ✅ 1️⃣ Not onboarded
  if (!userData.vendorProfileComplete) {
    router.push("/vendor/onboarding");
    return;
  }

  // ✅ 2️⃣ Get vendor approval status
  const vendorSnap = await getDoc(doc(db, "vendors", user.uid));

  if (!vendorSnap.exists()) {
    router.push("/vendor/onboarding");
    return;
  }

  const vendorData = vendorSnap.data();

  // ✅ 3️⃣ Not approved yet
  if (!vendorData.approved) {
    router.push("/vendor/dashboard");   // optional page
    return;
  }

  // ✅ 4️⃣ Approved → dashboard
  router.push("/vendor/dashboard");
  return;
}

      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("Account not found.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    setResent(true);
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
          <img src="/log.webp" className="h-14 rounded-xl p-2 bg-white" />
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

            {showResend && (
              <button
                type="button"
                onClick={resendVerification}
                className="text-sm font-medium text-black underline"
              >
                Resend verification email
              </button>
            )}

            {resent && (
              <p className="text-xs text-green-600">
                Verification email sent again. Please check spam too.
              </p>
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
            Secure login powered by Firebase Authentication
          </p>
        </div>
      </div>
    </main>
  );
}
