"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Layers,
  ListTree,
  Tag,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Briefcase,
  Megaphone,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

/* ================= NAV CONFIG ================= */

const nav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Vendors", href: "/admin/vendors", icon: Building2 },
  { name: "Products", href: "/admin/products", icon: Package },

  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Sub Categories", href: "/admin/subcategories", icon: ListTree },
  { name: "Tags", href: "/admin/tags", icon: Tag },
  { name: "Careers", href: "/admin/careers", icon: Briefcase },
  { name: "Job Applications", href: "/admin/job-applications", icon: FileText },
  { name: "Ads", href: "/admin/ads", icon: Megaphone },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
];

/* ================= LAYOUT ================= */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await signOut(auth);
    router.push("/");
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-soft)] overflow-hidden">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className="
          hidden md:flex
          fixed left-0 top-0
          h-screen w-64
          bg-[var(--color-bg-white)]
          border-r border-[var(--color-border)]
          flex-col
          z-40
        "
      >
        {/* BRAND */}
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Admin Panel
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            System Management
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
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
                      ? "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)]"
                  }
                `}
              >
                <Icon
                  className={`h-4 w-4 ${
                    active
                      ? "text-[var(--color-primary-green)]"
                      : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
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
              px-4 py-2.5 rounded-xl text-sm font-medium
              text-red-600
              border border-red-100 bg-red-50/40
              hover:bg-red-50 hover:border-red-200
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
          className={`
            absolute left-0 top-0 h-full w-72
            bg-[var(--color-bg-white)]
            border-r border-[var(--color-border)]
            shadow-2xl
            transition-transform duration-300
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* HEADER */}
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">
                Admin Panel
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                System Management
              </p>
            </div>
            <button onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* NAV */}
          <nav className="px-4 py-6 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                    ${
                      active
                        ? "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]"
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
                px-4 py-2.5 rounded-xl text-sm
                text-red-600
                hover:bg-red-50
              "
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64">

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
            Admin Panel
          </span>

          <span className="w-5" />
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
