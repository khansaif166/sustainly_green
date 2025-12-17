"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  User,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  {
    name: "Dashboard",
    href: "/vendor/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/vendor/products"        ,
    icon: Package,
  },
  {
    name: "Profile",
    href: "/vendor/profile",
    icon: User,
  },
];

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ================= MOBILE HEADER ================= */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b px-4 py-3 md:hidden">
        <h1 className="text-sm font-semibold text-gray-900">
          Vendor Panel
        </h1>
        <button onClick={() => setOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-900">
            Sustainly Vendor
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden"
          >
            <X className="w-5 h-5" />
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                  ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
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
      <main className="flex-1 md:ml-64 pt-14 md:pt-6 px-4 md:px-6">
        {children}
      </main>
    </div>
  );
}
