"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Inbox, Mail, ShieldCheck } from "lucide-react";

function getInboxUrl(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || "";

  if (domain.includes("gmail")) return "https://mail.google.com";
  if (domain.includes("yahoo")) return "https://mail.yahoo.com";
  if (
    domain.includes("outlook") ||
    domain.includes("hotmail") ||
    domain.includes("live")
  ) {
    return "https://outlook.live.com";
  }

  return "";
}

export default function CheckEmailClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const role = searchParams.get("role");
  const inboxUrl = getInboxUrl(email);
  const isVendor = role === "VENDOR";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[46vw_1fr]">
        <section className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-green-950 via-emerald-800 to-green-700 px-12 text-white md:flex lg:px-16">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: "url('/images/register-bg.jpg')" }}
          />
          <Link href="/" className="absolute left-8 top-8 lg:left-12 lg:top-10">
            <img src="/log.webp" className="h-14 rounded-xl bg-white p-2" alt="Sustainly Green" />
          </Link>

          <div className="relative z-10 max-w-md">
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-green-100">
              Secure account verification
            </p>
            <h1 className="text-3xl font-bold leading-tight">
              One last step before your workspace opens.
            </h1>
            <p className="mt-4 text-sm leading-6 text-green-100">
              We verify every account email before enabling marketplace access. This keeps buyer and vendor activity cleaner from day one.
            </p>
            <div className="mt-8 space-y-4 text-sm text-green-50">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-200" />
                Safer sign-ins and recovery
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-200" />
                Verified marketplace identity
              </div>
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-green-200" />
                Confirmation link expires for security
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 md:justify-start md:px-16 lg:px-24">
          <div className="w-full max-w-md">
            <Link
              href="/register"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to registration
            </Link>

            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-7 shadow-xl shadow-gray-200/60">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <Mail className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-semibold text-gray-950">
                Check your email
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                We sent a secure confirmation link to{" "}
                <span className="font-semibold text-gray-950">
                  {email || "your email address"}
                </span>
                . Open the email and click the link to activate your account.
              </p>

              {isVendor && (
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Vendor accounts still require admin approval after email verification.
                </div>
              )}

              <div className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                {[
                  "Open your inbox",
                  "Find the Sustainly Green confirmation email",
                  "Click the confirmation link",
                  "You will be signed in automatically",
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-green-700 shadow-sm">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {inboxUrl && (
                  <a
                    href={inboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                  >
                    Open inbox
                  </a>
                )}
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  I confirmed my email
                </Link>
              </div>

              <p className="mt-6 text-xs leading-5 text-gray-500">
                No email yet? Check spam or promotions. If the address is wrong, go back and register again with the correct email.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
