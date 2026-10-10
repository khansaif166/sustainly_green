"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ensureCurrentProfile,
  redirectForRole,
  requestPasswordReset,
  signInWithSupabase,
  SupabaseAuthError,
} from "@/lib/supabaseAuth";

// React Icons
import { HiOutlineCheckCircle, HiBadgeCheck, HiOutlineAdjustments } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import { 
  FaLinkedin, 
  FaRecycle, 
  FaHandshake, 
  FaBox, 
  FaRegNewspaper, 
  FaClipboardCheck 
} from "react-icons/fa";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handlePasswordReset() {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setResetLoading(true);
      await requestPasswordReset(email);
      setResetSent(true);
      setError(null);
    } catch (err: unknown) {
      console.error("PASSWORD_RESET_ERROR", err);
      if (err instanceof SupabaseAuthError) {
        if (/redirect/i.test(err.message)) {
          setError(
            "Password reset redirect is not allowed in Supabase. Add this site's /reset-password URL to Supabase Auth Redirect URLs."
          );
        } else if (err.code === "over_email_send_rate_limit" || err.status === 429) {
          setError(
            "Email rate limit exceeded. Please wait a few minutes before requesting another reset email."
          );
        } else {
          setError(err.message || "Failed to send reset email.");
        }
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
      const session = await signInWithSupabase(email, password);
      const profile = await ensureCurrentProfile(session.accessToken);
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : null;
      router.push(safeNext || redirectForRole(profile));
    } catch (err: unknown) {
      if (err instanceof SupabaseAuthError) {
        if (err.code === "email_not_confirmed") {
          setError("Please verify your email before signing in.");
        } else if (err.status === 429) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else {
          setError(err.message || "Login failed. Please check your credentials.");
        }
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    // Outer background wrapper: leaves just a tiny space around the card
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 p-1 sm:p-2 lg:p-3 font-sans overflow-hidden selection:bg-[#059669] selection:text-white">
      <main className="w-full h-full flex flex-col lg:flex-row bg-white rounded-2xl lg:rounded-[2rem] overflow-hidden shadow-2xl relative">
        
        {/* ================= LEFT BRAND PANEL ================= */}
        <div className="relative w-full lg:w-[50%] flex-shrink-0 bg-[#022c22] text-white overflow-hidden">
          {/* Dynamic Gradient Background matching logo: Deep Forest -> Emerald -> Lime */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#022c22] via-[#059669] to-[#a3e635] opacity-95 z-0" />

          {/* Large Ambient Glowing Orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bg-emerald-400/30 rounded-full blur-[100px] lg:blur-[120px] z-0 pointer-events-none" />

          {/* ---- MOBILE / TABLET LAYOUT (Compact Hero) ---- */}
          <div className="relative z-10 lg:hidden flex flex-col px-6 py-8 sm:px-10 sm:py-10">
            {/* Logo wrapped in glass pill for visibility */}
            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl inline-block border border-white/20 mb-6 self-start">
              <img src="/log.webp" alt="Sustainly Green" className="h-8 sm:h-10 object-contain" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-[1.15] tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-lime-100">
              Where India's Sustainable Business Begins.
            </h1>
            <p className="text-sm sm:text-base text-green-50 font-medium tracking-wide">
              Verified suppliers. Trusted certifications. ESG support. All in one place.
            </p>
          </div>

          {/* ---- DESKTOP LAYOUT (Full Branded Panel) ---- */}
          <div className="relative z-10 hidden lg:flex flex-col h-full justify-between p-10 xl:p-12">
            {/* Top Logo (Wrapped in glass pill) */}
            <div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl inline-block border border-white/20">
                <img src="/log.webp" alt="Sustainly Green" className="h-10 object-contain" />
              </div>
            </div>

            {/* Middle Content */}
            <div className="my-auto py-8">
              {/* Badge Pill */}
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs font-semibold mb-6">
                Welcome Back 👋
              </span>
              
              <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-lime-100">
                Where India's Sustainable Business Begins.
              </h1>
              <p className="text-lg text-green-50 font-medium tracking-wide flex items-center gap-3">
                Verified suppliers  <span className="w-1.5 h-1.5 bg-lime-300 rounded-full" /> Trusted certifications{" "}
                <span className="w-1.5 h-1.5 bg-lime-300 rounded-full" /> ESG support {" "}
                <span className="w-1.5 h-1.5 bg-lime-300 rounded-full" />  All in one place
              </p>
            </div>

            {/* Bottom Step Cards (Animated with 3 Distinct Elegant Colors) */}
            <div className="grid grid-cols-3 gap-3 xl:gap-4">
              
              {/* Card 1 - Pure White (Active Step) */}
              <div className="group bg-white border border-white rounded-2xl p-4 xl:p-5 text-[#022c22] shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer relative overflow-hidden flex flex-col justify-between h-[140px]">
                <p className="text-[12px] xl:text-[14px] font-bold leading-tight relative z-10">
                  Verify & Sell <br /> Eco-Products
                </p>
                <div className="flex justify-center items-end relative w-full h-16">
                  {/* 3D Box Icon */}
                  <div className="text-[#d4a373] text-[50px] transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                    <FaBox />
                  </div>
                  {/* Verified Badge Overlay */}
                  <div className="absolute bottom-[-5px] right-2 text-[#10b981] text-3xl drop-shadow-md transform transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-125">
                    <HiBadgeCheck />
                  </div>
                </div>
              </div>
              
              {/* Card 2 - Deep Emerald */}
              <div className="group bg-[#047857] border border-[#059669] rounded-2xl p-4 xl:p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:bg-[#059669] hover:shadow-2xl cursor-pointer flex flex-col justify-between h-[140px]">
                <p className="text-[12px] xl:text-[14px] font-bold leading-tight">
                  Sustainable <br /> Directory
                </p>
                <div className="flex items-center justify-between w-full mt-auto pb-1 px-1">
                  {/* List/Directory Icon */}
                  <FaRegNewspaper className="text-emerald-200 text-[26px] transform transition-transform duration-500 group-hover:-translate-y-1" />
                  {/* Verified Badge (Lime Accent) */}
                  <HiBadgeCheck className="text-[#a3e635] text-[36px] drop-shadow-lg transform transition-transform duration-500 group-hover:scale-110" />
                  {/* Settings/Filters Icon */}
                  <HiOutlineAdjustments className="text-emerald-200 text-[28px] transform transition-transform duration-500 group-hover:rotate-90" />
                </div>
              </div>

              {/* Card 3 - Soft Lime/Mint */}
              <div className="group bg-[#d9f99d] border border-[#bef264] rounded-2xl p-4 xl:p-5 text-[#064e3b] shadow-lg transition-all duration-300 hover:-translate-y-2 hover:bg-[#bef264] hover:shadow-2xl cursor-pointer flex flex-col justify-between h-[140px]">
                <p className="text-[12px] xl:text-[14px] font-bold leading-tight">
                  Responsible <br /> Buying
                </p>
                <div className="flex items-center justify-between w-full mt-auto pb-1 px-1">
                  {/* Handshake Icon */}
                  <FaHandshake className="text-[#047857] text-[28px] transform transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                  {/* Document Check Icon */}
                  <FaClipboardCheck className="text-[#065f46] text-[26px] transform transition-transform duration-500 group-hover:-translate-y-1" />
                  {/* Recycle Icon */}
                  <FaRecycle className="text-[#047857] text-[26px] transform transition-transform duration-500 group-hover:rotate-180" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ================= RIGHT LOGIN FORM ================= */}
        <div className="w-full lg:w-[50%] flex flex-col justify-center bg-white flex-1 relative p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
          <div className="w-full max-w-[420px] mx-auto">
            
            {/* Header */}
            <div className="mb-6 lg:mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Welcome back.
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Enter your business credentials to access your dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
                  Business Email
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl
                             px-4 py-3 text-sm font-medium text-gray-900
                             focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] focus:bg-white placeholder-gray-400 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[13px] font-bold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-[12px] font-semibold text-[#059669] hover:text-[#047857] transition-colors"
                  >
                    {resetLoading ? "Sending link..." : "Forgot password?"}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl
                             px-4 py-3 text-sm font-medium text-gray-900
                             focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] focus:bg-white placeholder-gray-400 transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#059669] text-white py-3.5 text-[14px] font-bold tracking-wide
                           hover:bg-[#047857] hover:shadow-lg transition-all duration-200 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Continue"}
              </button>

              {resetSent && (
                <p className="text-xs text-center font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-lg">
                  Password reset email sent. Check your inbox.
                </p>
              )}
            </form>

            {/* Footer Links */}
            <div className="mt-5 lg:mt-6 text-center text-[13px] text-gray-500">
              New to Sustainly Green?{" "}
              <Link
                href="/register"
                className="font-bold text-[#059669] hover:underline transition-colors"
              >
                Register as a Buyer
              </Link>{" "}
              or{" "}
              <Link
                href="/register"
                className="font-bold text-[#059669] hover:underline transition-colors"
              >
                List as a Supplier.
              </Link>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-[11px] font-bold tracking-widest uppercase">
                Or
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Social Logins */}
            {/* <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm">
                <FcGoogle className="text-xl" />
                Continue with Google
              </button>
              <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm">
                <FaLinkedin className="text-xl text-[#0a66c2]" />
                Continue with LinkedIn
              </button>
            </div> */}

            {/* Legal Footer */}
            <div className="mt-6 text-center text-[10px] text-gray-400 leading-relaxed">
              By signing in, I confirm that I have read and agree to the{" "}
              <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link> and{" "}
              <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}