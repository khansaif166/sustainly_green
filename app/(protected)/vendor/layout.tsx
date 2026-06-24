"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  User,
  Menu,
  MessageSquareText,
  X,
  BarChart3,
  LogOut,
} from "lucide-react";
import { fetchCurrentProfile, getCurrentUser, signOutSupabase } from "@/lib/supabaseAuth";

const navItems = [
  { name: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
  { name: "Enquiries", href: "/vendor/enquiries", icon: MessageSquareText },
  { name: "Products", href: "/vendor/products", icon: Package },
  { name: "Reports", href: "/vendor/reports", icon: BarChart3 },
  { name: "Profile", href: "/vendor/profile", icon: User },
];

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function guardVendor() {
      const user = await getCurrentUser();
      const profile = user ? await fetchCurrentProfile() : null;

      if (!profile || (profile.role !== "VENDOR" && profile.role !== "ADMIN")) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    void guardVendor();
  }, [router]);

  async function logout() {
    await signOutSupabase();
    router.push("/login");
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Checking access...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-soft)]">

      {/* ================= MOBILE HEADER ================= */}
      <div className="
        fixed top-0 left-0 right-0 z-40
        flex items-center justify-between
        bg-[var(--color-bg-white)]
        border-b border-[var(--color-border)]
        px-4 py-3 md:hidden
      ">
        <Link href="/" className="shrink-0">
          <img src="/log.webp" className="md:h-12 h-10" />
        </Link>
        <button onClick={() => setOpen(true)}>
          <Menu className="w-5 h-5 text-[var(--color-text-primary)]" />
        </button>
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-[var(--color-bg-white)]
          border-r border-[var(--color-border)]
          transform transition-transform
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Sidebar Header */}
        <div className="
          flex items-center justify-between
          px-5 py-4
          border-b border-[var(--color-border)]
        ">
           <Link href="/" className="shrink-0">
          <img src="/log.webp" className="md:h-10 h-10" />
        </Link>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X className="w-5 h-5 text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3
                  px-3 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    active
                      ? "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)]"
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 ${
                    active
                      ? "text-[var(--color-primary-green)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </nav>
      </aside>

      {/* ================= OVERLAY (mobile) ================= */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="
        flex-1 md:ml-64
        pt-14 md:pt-6
        px-4 md:px-6
        text-[var(--color-text-primary)]
      ">
        {children}
      </main>
    </div>
  );
}
