"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const nav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Vendors", href: "/admin/vendors", icon: Building2 },
  { name: "Products", href: "/admin/products", icon: Package },

  // Catalog
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Sub Categories", href: "/admin/subcategories", icon: ListTree },
  { name: "Tags", href: "/admin/tags", icon: Tag },

  // CMS / Reports
  { name: "Contents", href: "/admin/contents", icon: FileText },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-gray-50">
      {/* FIXED SIDEBAR */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Sustainly Admin
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition
                  ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}
