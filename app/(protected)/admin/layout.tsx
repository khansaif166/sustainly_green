"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Building2, Package, Layers, ListTree,
  Tag, FileText, BarChart3, LogOut, Menu, X, Briefcase,
  Megaphone, ShoppingCart, ShieldCheck, Newspaper, Leaf,
  BookOpen, Inbox,
} from "lucide-react";
import { fetchCurrentProfile, getCurrentUser, signOutSupabase } from "@/lib/supabaseAuth";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard",  href: "/admin",         icon: LayoutDashboard },
      { name: "Reports",    href: "/admin/reports",  icon: BarChart3       },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Users",   href: "/admin/users",   icon: Users      },
      { name: "Vendors", href: "/admin/vendors",  icon: Building2  },
      { name: "Buyers",  href: "/admin/buyers",   icon: ShoppingCart },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Leads",    href: "/admin/leads",    icon: Inbox   },
      { name: "Ads",      href: "/admin/ads",      icon: Megaphone },
    ],
  },
  {
    label: "Catalog",
    items: [
      { name: "Categories",     href: "/admin/categories",     icon: Layers   },
      { name: "Subcategories",  href: "/admin/subcategories",  icon: ListTree },
      { name: "Tags",           href: "/admin/tags",           icon: Tag      },
      { name: "Certifications", href: "/admin/certifications", icon: ShieldCheck },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Blogs",            href: "/admin/blogs",             icon: BookOpen },
      { name: "Contents",         href: "/admin/contents",          icon: FileText },
      { name: "Careers",          href: "/admin/careers",           icon: Briefcase },
      { name: "Job Applications", href: "/admin/job-applications",  icon: Newspaper },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const [open,       setOpen]       = useState(false);
  const [checking,   setChecking]   = useState(true);
  const [adminName,  setAdminName]  = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    async function guard() {
      const user    = await getCurrentUser();
      const profile = user ? await fetchCurrentProfile() : null;
      if (!profile || profile.role !== "ADMIN") { router.replace("/login"); return; }
      setAdminName(profile.name || "Admin");
      setAdminEmail(profile.email || "");
      setChecking(false);
    }
    void guard();
  }, [router]);

  async function logout() {
    await signOutSupabase();
    router.push("/");
  }

  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const initials = adminName.slice(0, 2).toUpperCase() || "AD";

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const SidebarContent = () => (
    <>
      <style>{`
        .al-logo{padding:18px 14px 14px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
        .al-nav{flex:1;padding:12px 10px;overflow-y:auto;display:flex;flex-direction:column;gap:0}
        .al-section-label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.22);padding:10px 12px 4px}
        .al-section-label:not(:first-child){margin-top:6px}
        .al-nav-item{display:flex;align-items:center;gap:9px;padding:8.5px 11px;border-radius:11px;font-size:13px;font-weight:600;color:rgba(255,255,255,.5);text-decoration:none;transition:all .15s;border-left:3px solid transparent}
        .al-nav-item:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.06)}
        .al-nav-item.active{color:#fff;background:rgba(255,255,255,.12);border-left-color:#4ade80;padding-left:8px}
        .al-divider{height:1px;background:rgba(255,255,255,.06);margin:8px 0}
        .al-logout{display:flex;align-items:center;gap:9px;width:100%;padding:9px 11px;border-radius:11px;font-size:13px;font-weight:600;color:rgba(248,113,113,.7);border:none;background:none;cursor:pointer;font-family:inherit;transition:all .15s;text-align:left}
        .al-logout:hover{color:#f87171;background:rgba(239,68,68,.08)}
        .al-user{padding:12px 14px 18px;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px}
        .al-avatar{width:32px;height:32px;border-radius:10px;background:rgba(74,222,128,.18);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#4ade80;flex-shrink:0}
      `}</style>

      {/* Logo */}
      <div className="al-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Leaf size={15} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>Sustainly Green</p>
            <p style={{ fontSize: 9.5, color: "rgba(255,255,255,.3)", margin: 0, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase" }}>Admin Panel</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <X size={16} color="rgba(255,255,255,.35)" />
        </button>
      </div>

      {/* Nav sections */}
      <nav className="al-nav">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="al-section-label">{section.label}</p>
            {section.items.map(({ name, href, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`al-nav-item${isActive(href) ? " active" : ""}`}>
                <Icon size={15} />
                {name}
              </Link>
            ))}
          </div>
        ))}

        <div className="al-divider" />
        <button className="al-logout" onClick={logout}><LogOut size={15} />Logout</button>
      </nav>

      {/* User */}
      <div className="al-user">
        <div className="al-avatar">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminName}</p>
          <p style={{ fontSize: 10.5, color: "rgba(255,255,255,.3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminEmail}</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .al-sidebar{position:fixed;top:0;bottom:0;left:0;width:220px;background:linear-gradient(170deg,#0a1a10 0%,#0d2218 55%,#0b1e14 100%);z-index:50;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        @media(min-width:768px){.al-sidebar{transform:translateX(0)}}
        .al-sidebar.open{transform:translateX(0)}
        .al-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);z-index:40}
        .al-mobile-bar{position:fixed;top:0;left:0;right:0;height:52px;background:#fff;border-bottom:1px solid rgba(0,0,0,.08);display:flex;align-items:center;justify-content:space-between;padding:0 16px;z-index:40}
        @media(min-width:768px){.al-mobile-bar{display:none}}
        .al-main{margin-left:0;padding:68px 16px 32px;min-height:100vh;background:#f8faf9}
        @media(min-width:768px){.al-main{margin-left:220px;padding:28px 28px 32px}}
      `}</style>

      {/* Mobile bar */}
      <div className="al-mobile-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>Admin Panel</span>
        </div>
        <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Menu size={20} color="#374151" />
        </button>
      </div>

      {/* Overlay */}
      {open && <div className="al-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`al-sidebar${open ? " open" : ""}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="al-main">{children}</main>
    </>
  );
}
