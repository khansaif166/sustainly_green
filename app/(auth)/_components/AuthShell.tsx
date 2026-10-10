"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiBadgeCheck,
  HiEye,
  HiEyeOff,
  HiOutlineAdjustments,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import {
  FaBox,
  FaClipboardCheck,
  FaHandshake,
  FaRecycle,
  FaRegNewspaper,
} from "react-icons/fa";

// Shared by /login and /register so the two pages can't drift apart.

export const authLabelClass = "block text-[13px] font-bold text-gray-700 mb-1.5";

export const authInputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 " +
  "focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] focus:bg-white " +
  "placeholder-gray-400 transition-all";

export const authButtonClass =
  "w-full rounded-xl bg-[#059669] text-white py-3.5 text-[14px] font-bold tracking-wide " +
  "hover:bg-[#047857] hover:shadow-lg transition-all duration-200 disabled:opacity-60";

const HIGHLIGHTS = ["Verified suppliers", "Trusted certifications", "ESG support", "All in one place"];

export function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className={`${authInputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-700"
      >
        {visible ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
      </button>
    </div>
  );
}

export function AuthShell({
  badge,
  heading,
  children,
}: {
  badge: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    // Full-bleed: no outer frame or rounded card, the two panels fill the viewport.
    <div className="h-dvh w-full font-sans overflow-hidden selection:bg-[#059669] selection:text-white">
      <main className="w-full h-full flex flex-col lg:flex-row bg-white overflow-hidden relative">
        {/* ================= LEFT BRAND PANEL ================= */}
        <div className="relative w-full lg:w-[50%] flex-shrink-0 bg-[#022c22] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#022c22] via-[#059669] to-[#a3e635] opacity-95 z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bg-emerald-400/30 rounded-full blur-[100px] lg:blur-[120px] z-0 pointer-events-none" />

          {/* Mobile / tablet: compact hero */}
          <div className="relative z-10 lg:hidden flex flex-col px-6 py-6 sm:px-10 sm:py-8">
            <Link href="/" className="bg-white rounded-xl px-3 py-2 inline-block mb-5 self-start shadow-sm">
              <img src="/log.webp" alt="Sustainly Green" className="h-7 sm:h-8 object-contain" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-[1.15] tracking-tight text-white">
              {heading}
            </h1>
          </div>

          {/* Desktop: full branded panel */}
          <div className="relative z-10 hidden lg:flex flex-col h-full justify-between p-10 xl:p-12">
            <div>
              <Link href="/" className="bg-white rounded-2xl px-4 py-2.5 inline-block shadow-lg shadow-black/10">
                <img src="/log.webp" alt="Sustainly Green" className="h-9 object-contain" />
              </Link>
            </div>

            <div className="my-auto py-8">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs font-semibold mb-6">
                {badge}
              </span>
              <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-lime-100">
                {heading}
              </h1>
              <ul className="flex flex-wrap gap-2">
                {HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-1.5 text-sm font-medium text-green-50"
                  >
                    <HiOutlineCheckCircle className="text-lime-300 text-base" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3 xl:gap-4">
              <div className="group bg-white border border-white rounded-2xl p-4 xl:p-5 text-[#022c22] shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden flex flex-col justify-between h-[140px]">
                <p className="text-[12px] xl:text-[14px] font-bold leading-tight relative z-10">
                  Verify & Sell <br /> Eco-Products
                </p>
                <div className="flex justify-center items-end relative w-full h-16">
                  <div className="text-[#d4a373] text-[50px] transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                    <FaBox />
                  </div>
                  <div className="absolute bottom-[-5px] right-2 text-[#10b981] text-3xl drop-shadow-md transform transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-125">
                    <HiBadgeCheck />
                  </div>
                </div>
              </div>

              <div className="group bg-[#047857] border border-[#059669] rounded-2xl p-4 xl:p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:bg-[#059669] hover:shadow-2xl flex flex-col justify-between h-[140px]">
                <p className="text-[12px] xl:text-[14px] font-bold leading-tight">
                  Sustainable <br /> Directory
                </p>
                <div className="flex items-center justify-between w-full mt-auto pb-1 px-1">
                  <FaRegNewspaper className="text-emerald-200 text-[26px] transform transition-transform duration-500 group-hover:-translate-y-1" />
                  <HiBadgeCheck className="text-[#a3e635] text-[36px] drop-shadow-lg transform transition-transform duration-500 group-hover:scale-110" />
                  <HiOutlineAdjustments className="text-emerald-200 text-[28px] transform transition-transform duration-500 group-hover:rotate-90" />
                </div>
              </div>

              <div className="group bg-[#d9f99d] border border-[#bef264] rounded-2xl p-4 xl:p-5 text-[#064e3b] shadow-lg transition-all duration-300 hover:-translate-y-2 hover:bg-[#bef264] hover:shadow-2xl flex flex-col justify-between h-[140px]">
                <p className="text-[12px] xl:text-[14px] font-bold leading-tight">
                  Responsible <br /> Buying
                </p>
                <div className="flex items-center justify-between w-full mt-auto pb-1 px-1">
                  <FaHandshake className="text-[#047857] text-[28px] transform transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                  <FaClipboardCheck className="text-[#065f46] text-[26px] transform transition-transform duration-500 group-hover:-translate-y-1" />
                  <FaRecycle className="text-[#047857] text-[26px] transform transition-transform duration-500 group-hover:rotate-180" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM ================= */}
        <div className="w-full lg:w-[50%] flex flex-col bg-white flex-1 relative p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
          {/* my-auto centres the form when it fits and lets it scroll from the top when it doesn't */}
          <div className="w-full max-w-[420px] mx-auto my-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
