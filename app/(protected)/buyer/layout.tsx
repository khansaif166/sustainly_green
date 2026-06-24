"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { fetchCurrentProfile, getCurrentUser, signOutSupabase } from "@/lib/supabaseAuth";

/* ================= NAV CONFIG ================= */

const nav = [
  { name: "Dashboard", href: "/buyer/dashboard", icon: LayoutDashboard },
  { name: "My RFQs", href: "/buyer/rfqs", icon: FileText },
  { name: "Reports", href: "/buyer/reports", icon: BarChart3 },
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
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function guardBuyer() {
      const user = await getCurrentUser();
      const profile = user ? await fetchCurrentProfile() : null;

      if (!profile || (profile.role !== "BUYER" && profile.role !== "ADMIN")) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    void guardBuyer();
  }, [router]);

  async function logout() {
  try {
    await signOutSupabase();
    window.location.href = "/login";
  } catch (err) {
    console.error("Logout failed", err);
  }
}

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Checking access...
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-[var(--color-bg-soft)] overflow-hidden">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex w-64 flex-col bg-[var(--color-bg-white)] border-r border-[var(--color-border)]">
        {/* BRAND */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-[var(--color-primary-green)]">
            Sustainly Green
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Buyer Panel
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3
                  px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    active
                      ? "bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-ocean-blue)] text-white shadow"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)]"
                  }
                `}
              >
                <Icon
                  className={`h-4 w-4 ${
                    active
                      ? "opacity-100"
                      : "opacity-70 group-hover:opacity-100"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={logout}
            className="
              w-full flex items-center gap-3
              px-4 py-2.5 rounded-xl text-sm
              text-[var(--color-text-secondary)]
              hover:bg-[var(--color-bg-soft)]
              transition
            "
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MOBILE DRAWER ================= */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          mobileOpen ? "visible" : "invisible"
        }`}
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
          className={`absolute left-0 top-0 h-full w-72 bg-[var(--color-bg-white)]
            shadow-2xl transition-transform duration-300
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* HEADER */}
          <div className="px-6 py-5 flex justify-between items-center border-b">
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

          {/* NAV */}
          <nav className="px-4 py-4 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3
                    px-4 py-2.5 rounded-xl text-sm font-medium
                    transition
                    ${
                      active
                        ? "bg-[var(--color-primary-green)] text-white"
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

          {/* LOGOUT */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="
    w-full flex items-center gap-3
    px-4 py-2.5 rounded-xl
    text-sm font-medium

    text-red-600
    border border-red-100
    bg-red-50/40

    transition-all duration-200
    hover:bg-red-50
    hover:border-red-200

    focus:outline-none
    focus:ring-2
    focus:ring-red-200
  "
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden sticky top-0 z-40 bg-[var(--color-bg-white)] border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-[var(--color-text-primary)]">
            Buyer Panel
          </span>
          <span className="w-5" />
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
