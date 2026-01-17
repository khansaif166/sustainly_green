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
import { sendEmailVerification } from "firebase/auth";

// React Icons
import {
  HiBadgeCheck,
  HiGlobeAlt,
  HiShieldCheck,
  HiOfficeBuilding,
} from "react-icons/hi";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState(""); // ✅ NEW
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

      // 1️⃣ Create user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user as User;

      // 2️⃣ Set display name in Firebase Auth
      await updateProfile(user, {
        displayName: name,
      });

      // 3️⃣ Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name, // ✅ SAVE NAME
        email: user.email,
        role,
        emailVerified: false,
        createdAt: serverTimestamp(),
      });

      // 4️⃣ Vendor doc (if vendor)
      if (role === "VENDOR") {
        await setDoc(doc(db, "vendors", user.uid), {
          uid: user.uid,
          company: "",
          country: "",
          approved: false,
          createdAt: serverTimestamp(),
        });
      }

      // 5️⃣ Send email verification
      await sendEmailVerification(user);

      // 6️⃣ Redirect
      router.push("/verify-email");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed");
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
          style={{ backgroundImage: "url('/images/register-bg.jpg')" }}
        />
        <Link
        href="/"
        className="
          inline-flex items-center gap-2 mb-8
          px-5 py-2.5
          rounded-full text-sm font-medium absolute top-6 left-6
          bg-[var(--color-bg-white)]
          text-[var(--color-ocean-blue)]
          border border-[var(--color-border)]
          hover:bg-[var(--color-ocean-blue)]
          hover:text-white
          transition
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
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

      {/* ================= RIGHT FORM ================= */}
      <div className="flex items-center justify-center px-6 bg-gray-50 pt-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900">
              Create your account
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Get started in less than a minute
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Name */}
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full bg-transparent border-b-2 border-gray-300
                           py-2 text-lg font-medium text-gray-900
                           focus:outline-none focus:border-black"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
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
                placeholder="Minimum 8 characters"
                required
                className="w-full bg-transparent border-b-2 border-gray-300
                           py-2 text-lg font-medium text-gray-900
                           focus:outline-none focus:border-black"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold text-gray-600 mb-3">
                Register as
              </label>

              <div className="flex gap-3">
                {["BUYER", "VENDOR"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as any)}
                    className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold border transition
                      ${
                        role === r
                          ? "bg-black text-white border-black"
                          : "bg-transparent text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    {r === "BUYER" ? "Buyer" : "Vendor"}
                  </button>
                ))}
              </div>

              {role === "VENDOR" && (
                <p className="mt-3 text-xs text-gray-500">
                  Vendor accounts require admin approval.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 font-medium">{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black text-white py-3 text-sm font-semibold
                         hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-sm text-gray-600">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-black hover:underline"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Secure registration powered by Firebase Authentication
          </p>
        </div>
      </div>
    </main>
  );
}
