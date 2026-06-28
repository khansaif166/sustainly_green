"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, User, Menu, MessageSquareText,
  X, BarChart3, LogOut, Leaf,
} from "lucide-react";
import { fetchCurrentProfile, getCurrentUser, signOutSupabase } from "@/lib/supabaseAuth";
import SessionTimeoutNotice from "@/app/components/SessionTimeoutNotice";

const NAV = [
  { name: "Dashboard",  href: "/vendor/dashboard",  icon: LayoutDashboard },
  { name: "Enquiries",  href: "/vendor/enquiries",   icon: MessageSquareText },
  { name: "Products",   href: "/vendor/products",    icon: Package },
  { name: "Reports",    href: "/vendor/reports",     icon: BarChart3 },
  { name: "Profile",    href: "/vendor/profile",     icon: User },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]             = useState(false);
  const [checkingAuth, setChecking] = useState(true);
  const [userName, setUserName]     = useState("Vendor");
  const [userEmail, setUserEmail]   = useState("");

  useEffect(() => {
    async function guard() {
      const user    = await getCurrentUser();
      const profile = user ? await fetchCurrentProfile() : null;
      if (!profile || (profile.role !== "VENDOR" && profile.role !== "ADMIN")) {
        router.replace("/login"); return;
      }
      setUserName(profile.name || (profile as any).company_name || "Vendor");
      setUserEmail(profile.email || "");
      setChecking(false);
    }
    void guard();
  }, [router]);

  async function logout() {
    await signOutSupabase();
    router.push("/login");
  }

  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const initials = userName.slice(0, 2).toUpperCase() || "V";

  return (
    <>
      <SessionTimeoutNotice />
      <style>{`
        .vl-sidebar{position:fixed;top:0;bottom:0;left:0;width:240px;background:linear-gradient(170deg,#0a1a10 0%,#0d2218 55%,#0b1e14 100%);z-index:50;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        @media(min-width:768px){.vl-sidebar{transform:translateX(0)}}
        .vl-sidebar.open{transform:translateX(0)}
        .vl-logo-area{padding:20px 16px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
        .vl-nav{flex:1;padding:14px 10px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
        .vl-nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;font-size:13.5px;font-weight:600;color:rgba(255,255,255,.5);text-decoration:none;transition:all .15s;border-left:3px solid transparent}
        .vl-nav-item:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.06)}
        .vl-nav-item.active{color:#fff;background:rgba(255,255,255,.12);border-left-color:#4ade80;padding-left:9px}
        .vl-divider{height:1px;background:rgba(255,255,255,.06);margin:8px 0}
        .vl-logout{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:12px;font-size:13.5px;font-weight:600;color:rgba(248,113,113,.7);border:none;background:none;cursor:pointer;font-family:inherit;transition:all .15s;text-align:left}
        .vl-logout:hover{color:#f87171;background:rgba(239,68,68,.08)}
        .vl-user{padding:14px 14px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px}
        .vl-avatar{width:34px;height:34px;border-radius:10px;background:rgba(74,222,128,.18);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#4ade80;flex-shrink:0}
        .vl-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);z-index:40}
        .vl-mobile-bar{position:fixed;top:0;left:0;right:0;height:52px;background:#fff;border-bottom:1px solid rgba(0,0,0,.08);display:flex;align-items:center;justify-content:space-between;padding:0 16px;z-index:40}
        @media(min-width:768px){.vl-mobile-bar{display:none}}
        .vl-main{margin-left:0;padding:68px 16px 32px;min-height:100vh;background:#f8faf9}
        @media(min-width:768px){.vl-main{margin-left:240px;padding:28px 28px 32px}}
        .vl-portal-tag{padding:10px 10px 6px;display:flex;align-items:center;gap:8px}
      `}</style>

      {/* Mobile top bar */}
      <div className="vl-mobile-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>Sustainly Green</span>
        </div>
        <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Menu size={20} color="#374151" />
        </button>
      </div>

      {/* Overlay */}
      {open && <div className="vl-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`vl-sidebar${open ? " open" : ""}`}>
        <div className="vl-logo-area">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Leaf size={17} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>Sustainly Green</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,.32)", margin: 0, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>Vendor Panel</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", marginLeft: 4 }}>
            <X size={17} color="rgba(255,255,255,.4)" />
          </button>
        </div>

        <nav className="vl-nav">
          {NAV.map(({ name, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`vl-nav-item${active ? " active" : ""}`}>
                <Icon size={17} />
                {name}
              </Link>
            );
          })}
          <div className="vl-divider" />
          <button className="vl-logout" onClick={logout}><LogOut size={17} />Logout</button>
        </nav>

        <div className="vl-user">
          <div className="vl-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,.32)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="vl-main">{children}</main>
    </>
  );
}
