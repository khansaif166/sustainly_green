"use client";

import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // 🔄 Auto check verification + role redirect
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      // Reload to get latest emailVerified status
      await user.reload();

      if (!user.emailVerified) {
        setChecking(false);
        return;
      }

      // ✅ Email verified — now fetch role
      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        // fallback → send to login
        router.replace("/login");
        return;
      }

      const userData = userSnap.data();

      // 🔁 ROLE BASED REDIRECT
      if (userData.role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      if (userData.role === "BUYER") {
        router.replace("/");
        return;
      }

      if (userData.role === "VENDOR") {
        // profile not completed
        if (!userData.vendorProfileComplete) {
          router.replace("/vendor/profile");
          return;
        }

        // Option 2 logic: no vendor approval needed
        router.replace("/vendor/dashboard");
        return;
      }

      // default fallback
      router.replace("/login");
    });

    return () => unsub();
  }, [router]);

  async function resend() {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    setSent(true);
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Checking verification status...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-sm border">

        <h1 className="text-2xl font-semibold text-gray-900">
          Verify your email
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          We’ve sent a verification link to your email address.  
          Please check your inbox and confirm your email to continue.
        </p>

        <button
          onClick={resend}
          className="mt-6 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Resend verification email
        </button>

        {sent && (
          <p className="mt-2 text-xs text-green-600">
            Verification email sent again.
          </p>
        )}

        <div className="mt-6 text-sm">
          <Link
            href="/login"
            className="font-semibold text-black hover:underline"
          >
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}
