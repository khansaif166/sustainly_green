"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ensureCurrentProfile,
  getStoredSession,
  redirectForRole,
  signUpWithSupabase,
  SupabaseAuthError,
} from "@/lib/supabaseAuth";

// React Icons
import {
  HiBadgeCheck,
  HiGlobeAlt,
  HiShieldCheck,
  HiOfficeBuilding,
} from "react-icons/hi";

type SignupRole = "BUYER" | "VENDOR";

const ROLE_OPTIONS: Array<{ value: SignupRole; title: string; hint: string }> = [
  { value: "BUYER", title: "I want to buy", hint: "Source sustainable products" },
  { value: "VENDOR", title: "I want to sell", hint: "List my business" },
];

const COPY: Record<SignupRole | "NONE", { heading: string; sub: string; panel: string }> = {
  VENDOR: {
    heading: "List your business",
    sub: "Create a vendor account to showcase your products to verified buyers.",
    panel: "Grow your sustainable business with verified buyers",
  },
  BUYER: {
    heading: "Create your buyer account",
    sub: "Source sustainable products from verified suppliers.",
    panel: "Source from verified sustainable suppliers",
  },
  NONE: {
    heading: "Create your account",
    sub: "Tell us how you'll use Sustainly Green.",
    panel: "Sign in to your global business workspace",
  },
};

// Every "List your business" / "Start sourcing" CTA links here with ?role=,
// so honour it. Ignoring it (and defaulting to BUYER) is how vendors were
// ending up with buyer accounts.
function parseRole(value: string | null): SignupRole | null {
  const role = value?.toUpperCase();
  return role === "BUYER" || role === "VENDOR" ? role : null;
}

// Accepts what people actually type ("+91 98765-43210", "(022) 1234 5678")
// and stores just the digits with an optional leading +. 10–15 digits covers
// Indian mobiles and international numbers with a country code.
function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

function isExistingAccountError(err: unknown) {
  return (
    err instanceof SupabaseAuthError &&
    (err.code === "user_already_exists" || /already registered/i.test(err.message))
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignupRole | null>(() => parseRole(searchParams.get("role")));
  const [error, setError] = useState<string | null>(null);
  const [existingAccount, setExistingAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const copy = COPY[role ?? "NONE"];
  // A vendor who already has a (buyer) account should sign in and switch it,
  // which /become-vendor handles; it forwards real vendors to their dashboard.
  const loginHref = role === "VENDOR" ? "/login?next=/become-vendor" : "/login";

  // Already signed in: a buyer following a vendor link gets the switch offer,
  // anyone else goes to their own workspace instead of a signup form.
  useEffect(() => {
    const session = getStoredSession();
    if (!session) return;
    let cancelled = false;
    ensureCurrentProfile(session.accessToken)
      .then((profile) => {
        if (cancelled || !profile) return;
        router.replace(
          profile.role === "BUYER" && role === "VENDOR"
            ? "/become-vendor"
            : redirectForRole(profile),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Only on arrival: choosing a role in the form shouldn't navigate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Keep ?role= in step with the selection so a refresh or a shared link
  // reopens the same choice. replace() so toggling doesn't stack history.
  function chooseRole(next: SignupRole) {
    setRole(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", next);
    router.replace(`/register?${params.toString()}`, { scroll: false });
  }

  function getRegistrationErrorMessage(err: unknown) {
    if (
      err instanceof SupabaseAuthError &&
      err.code === "email_address_invalid"
    ) {
      return "Supabase rejected this email address. Please use a valid business email, or update Supabase Auth settings if Gmail signups should be allowed.";
    }

    if (isExistingAccountError(err)) {
      return "An account with this email already exists.";
    }

    if (err instanceof Error) {
      if (err.message.toLowerCase().includes("email address")) {
        return `${err.message}. Please try a business email or check the Supabase Auth email rules.`;
      }

      return err.message;
    }

    return "Registration failed. Please try again.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExistingAccount(false);

    if (!role) {
      setError("Please choose whether you want to buy or sell.");
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError("Please enter a valid mobile number (10–15 digits, with country code if outside India).");
      return;
    }

    setLoading(true);

    try {
      const result = await signUpWithSupabase({
        name,
        email,
        password,
        role,
        phone: normalizedPhone,
      });

      if (result.status === "pending_confirmation") {
        setPassword("");
        const params = new URLSearchParams({
          email: result.email ?? email,
          role,
        });
        const requestedPath = new URLSearchParams(window.location.search).get("next");
        if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//")) {
          params.set("next", requestedPath);
        }
        router.push(`/check-email?${params.toString()}`);
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const safeNext = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : null;
      router.push(role === "VENDOR" ? "/vendor/onboarding" : safeNext || redirectForRole(null));
    } catch (err: unknown) {
      console.error(err);
      setError(getRegistrationErrorMessage(err));
      setExistingAccount(isExistingAccountError(err));
    } finally {
      setLoading(false);
    }
  }

  const leftPanel = (
    <div className="hidden md:flex relative flex-col justify-center px-12 bg-gradient-to-br from-green-900 to-emerald-700 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/images/register-bg.jpg')" }}
      />
      <Link
        href="/"
        className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 text-sm font-medium absolute top-6 left-10"
      >
        <img src="/log.webp" alt="Sustainly Green" className="h-14 rounded-xl p-2 bg-white" />
      </Link>

      <div className="relative z-10 max-w-lg">
        <h1 className="text-3xl font-bold leading-tight">{copy.panel}</h1>

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
  );

  // ── Registration form ────────────────────────────────────────────────
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {leftPanel}

      {/* ================= RIGHT FORM ================= */}
      <div className="flex items-center justify-center px-6 bg-gray-50 pt-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {copy.heading}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {copy.sub}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Role — first, so nobody signs up without noticing it */}
            <div className="pb-4">
              <label className="block text-xs uppercase tracking-wide font-semibold text-gray-600 mb-3">
                I&apos;m joining to
              </label>

              <div className="grid grid-cols-2 gap-3" role="radiogroup">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={role === option.value}
                    onClick={() => chooseRole(option.value)}
                    className={`rounded-2xl px-4 py-3 text-left border transition
                      ${
                        role === option.value
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    <span className="block text-sm font-semibold">{option.title}</span>
                    <span
                      className={`block text-xs mt-0.5 ${
                        role === option.value ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>

              {role === "VENDOR" && (
                <p className="mt-3 text-xs text-gray-500">
                  Vendor accounts require admin approval.
                </p>
              )}
            </div>

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

            {/* Mobile */}
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
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

            {/* Error */}
            {error && (
              <div className="pt-2 text-sm text-red-600 font-medium">
                {error}
                {existingAccount && (
                  <>
                    {" "}
                    <Link href={loginHref} className="underline text-black">
                      {role === "VENDOR"
                        ? "Sign in to switch it to a vendor account"
                        : "Sign in instead"}
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-black text-white py-3 text-sm font-semibold
                           hover:bg-gray-900 transition disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : role === "VENDOR"
                    ? "Create vendor account"
                    : role === "BUYER"
                      ? "Create buyer account"
                      : "Create account"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-sm text-gray-600">
            Already registered?{" "}
            <Link
              href={loginHref}
              className="font-semibold text-black hover:underline"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Secure registration powered by Supabase Authentication
          </p>
        </div>
      </div>
    </main>
  );
}
