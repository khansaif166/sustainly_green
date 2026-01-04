"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

/* ================= NAV CONFIG ================= */

const nav = [
  { name: "Dashboard", href: "/buyer/dashboard", icon: LayoutDashboard },
  { name: "My RFQs", href: "/buyer/rfqs", icon: FileText },
  { name: "Profile", href: "/buyer/profile", icon: User },
];

/* ================= LAYOUT ================= */

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-soft)] overflow-hidden">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className="
          hidden md:flex w-64 flex-col
          h-screen sticky top-0
          bg-[var(--color-bg-white)]
          shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          overflow-hidden
        "
      >
        {/* BRAND */}
        <div className="px-6 py-6 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-primary-green)]">
            Sustainly Green
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Buyer Panel
          </p>
        </div>

        {/* NAV (NO SCROLL) */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                  transition-all duration-200
                  ${
                    active
                      ? "bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-ocean-blue)] text-white shadow"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)]"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT (STUCK AT BOTTOM) */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={logout}
            className="
              w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
              text-[var(--color-text-secondary)]
              hover:bg-[var(--color-bg-soft)]
            "
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MOBILE DRAWER ================= */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? "visible" : "invisible"}`}
      >
        {/* BACKDROP */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* DRAWER */}
        <aside
          className={`absolute left-0 top-0 h-full w-72
            bg-[var(--color-bg-white)]
            shadow-2xl transition-transform duration-300
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="px-6 py-6 border-b flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-[var(--color-primary-green)]">
                Sustainly
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Buyer Panel
              </p>
            </div>
            <button onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="px-4 py-6 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
                    active
                      ? "bg-[var(--color-primary-green)] text-white"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* MOBILE TOP BAR */}
        <header
          className="
            md:hidden sticky top-0 z-40
            bg-[var(--color-bg-white)]
            border-b border-[var(--color-border)]
            px-4 py-3 flex items-center justify-between
          "
        >
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-[var(--color-text-primary)]">
            Buyer Panel
          </span>
          <span className="w-5" />
        </header>

        {/* PAGE SCROLL ONLY HERE */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
