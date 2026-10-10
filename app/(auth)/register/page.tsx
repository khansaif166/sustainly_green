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

import { HiCheckCircle } from "react-icons/hi";
import {
  AuthShell,
  PasswordInput,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "../_components/AuthShell";

type SignupRole = "BUYER" | "VENDOR";

const ROLE_OPTIONS: Array<{ value: SignupRole; title: string; hint: string }> = [
  { value: "BUYER", title: "I want to buy", hint: "Source sustainable products" },
  { value: "VENDOR", title: "I want to sell", hint: "List my business" },
];

const COPY: Record<
  SignupRole | "NONE",
  { heading: string; sub: string; badge: string; panel: string }
> = {
  VENDOR: {
    heading: "List your business",
    sub: "Create a vendor account to showcase your products to verified buyers.",
    badge: "For suppliers 🌱",
    panel: "Grow your sustainable business with verified buyers.",
  },
  BUYER: {
    heading: "Create your buyer account",
    sub: "Source sustainable products from verified suppliers.",
    badge: "For buyers 🌱",
    panel: "Source from India's verified sustainable suppliers.",
  },
  NONE: {
    heading: "Create your account",
    sub: "Tell us how you'll use Sustainly Green.",
    badge: "Join Sustainly Green 🌱",
    panel: "Where India's Sustainable Business Begins.",
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

  // ── Registration form ────────────────────────────────────────────────
  return (
    <AuthShell badge={copy.badge} heading={copy.panel}>
      {/* Header */}
      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {copy.heading}
        </h2>
        <p className="text-sm text-gray-500 mt-2 font-medium">{copy.sub}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role — first, so nobody signs up without noticing it */}
        <div>
          <label className={authLabelClass}>I&apos;m joining to</label>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseRole(option.value)}
                  // Outline via ring, not border: globals.css sets
                  // `button { border: none }`, which overrides border utilities.
                  className={`relative rounded-xl px-4 py-3 text-left transition-all
                    ${
                      selected
                        ? "bg-emerald-50 ring-2 ring-[#059669]"
                        : "bg-white ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {selected && (
                    <HiCheckCircle className="absolute top-2.5 right-2.5 text-lg text-[#059669]" />
                  )}
                  <span className="block text-[13px] font-bold text-gray-900">{option.title}</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">{option.hint}</span>
                </button>
              );
            })}
          </div>
          {role === "VENDOR" && (
            <p className="mt-2 text-xs text-gray-500">Vendor accounts require admin approval.</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className={authLabelClass}>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            autoComplete="name"
            required
            className={authInputClass}
          />
        </div>

        {/* Email + Mobile side by side on wide screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={authLabelClass}>Business Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
              className={authInputClass}
            />
          </div>
          <div>
            <label className={authLabelClass}>Mobile Number</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className={authInputClass}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className={authLabelClass}>Password</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
            {existingAccount && (
              <>
                {" "}
                <Link href={loginHref} className="underline text-gray-900">
                  {role === "VENDOR"
                    ? "Sign in to switch it to a vendor account"
                    : "Sign in instead"}
                </Link>
              </>
            )}
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading
            ? "Creating account..."
            : role === "VENDOR"
              ? "Create vendor account"
              : role === "BUYER"
                ? "Create buyer account"
                : "Create account"}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center text-[13px] text-gray-500">
        Already have an account?{" "}
        <Link href={loginHref} className="font-bold text-[#059669] hover:underline">
          Sign in
        </Link>
      </div>

      <div className="mt-4 text-center text-[11px] text-gray-400 leading-relaxed">
        By creating an account, I agree to the{" "}
        <Link href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link> and{" "}
        <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
      </div>
    </AuthShell>
  );
}
