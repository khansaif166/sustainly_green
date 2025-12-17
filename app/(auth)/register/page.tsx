"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, db, setLocalPersistence } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "VENDOR">("BUYER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await setLocalPersistence();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user as User;

      await updateProfile(user, { displayName: email.split("@")[0] });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role,
        createdAt: serverTimestamp(),
      });

      if (role === "VENDOR") {
        await setDoc(doc(db, "vendors", user.uid), {
          uid: user.uid,
          company: "",
          country: "",
          approved: false,
          createdAt: serverTimestamp(),
        });
      }

      router.push("/login");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Create your account
            </h1>
            <p className="text-sm text-gray-900 mt-1">
              Join Sustainly and grow sustainably
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register as
              </label>

              <div className="flex gap-2">
                {["BUYER", "VENDOR"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as any)}
                    className={`flex-1 rounded-full px-4 py-2 text-sm border transition
                      ${
                        role === r
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                  >
                    {r === "BUYER" ? "Buyer" : "Vendor"}
                  </button>
                ))}
              </div>

              {role === "VENDOR" && (
                <p className="mt-2 text-xs text-gray-900">
                  Vendors will need admin approval before listing products.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black text-white py-2 text-sm font-medium
                         hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-900">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-black hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Note */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Secure signup powered by Firebase Authentication
        </p>
      </div>
    </main>
  );
}
