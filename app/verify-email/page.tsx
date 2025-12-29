"use client";

import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [sent, setSent] = useState(false);

  async function resend() {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
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
          <Link href="/login" className="font-semibold text-black hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}
