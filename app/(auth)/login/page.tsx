"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, setLocalPersistence } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await setLocalPersistence();

      // 1️⃣ Login
      const cred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = cred.user;

      // 2️⃣ Get user profile from Firestore
      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }

      const userData = userSnap.data();

      // 3️⃣ ROLE BASED REDIRECT
      if (userData.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      if (userData.role === "BUYER") {
        router.push("/buyer/profile"); // or /explore
        return;
      }

      if (userData.role === "VENDOR") {
        // vendor profile not completed
        if (!userData.vendorProfileComplete) {
          router.push("/vendor/onboarding");
          return;
        }

        // check vendor approval
        const vendorSnap = await getDoc(doc(db, "vendors", user.uid));
        const vendorData = vendorSnap.data();

        if (!vendorData?.approved) {
          router.push("/vendor/pending");
          return;
        }

        // approved vendor
        router.push("/vendor/dashboard");
        return;
      }

      // fallback
      router.push("/");
    } catch (err: any) {
      console.error(err);

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

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-900 mt-1">
              Sign in to your Sustainly account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black text-white py-2 text-sm font-medium
                         hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-900">
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-black hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Secure login powered by Firebase Authentication
        </p>
      </div>
    </main>
  );
}
