"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, User, LogOut, Menu, X, BarChart3,
  ChevronRight, Leaf,
} from "lucide-react";
import { fetchCurrentProfile, getCurrentUser, getStoredSession, signOutSupabase } from "@/lib/supabaseAuth";
import SessionTimeoutNotice from "@/app/components/SessionTimeoutNotice";

const nav = [
  { name: "Dashboard", href: "/buyer/dashboard", icon: LayoutDashboard },
  { name: "My RFQs", href: "/buyer/rfqs", icon: FileText },
  { name: "Reports", href: "/buyer/reports", icon: BarChart3 },
  { name: "Profile", href: "/buyer/profile", icon: User },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function guardBuyer() {
      const user = await getCurrentUser();
      const profile = user ? await fetchCurrentProfile() : null;
      if (!profile || (profile.role !== "BUYER" && profile.role !== "ADMIN")) {
        router.replace("/login");
        return;
      }
      setUserName(profile.name || user?.email?.split("@")[0] || "Buyer");
      setUserEmail(user?.email || "");
      setCheckingAuth(false);
    }
    void guardBuyer();
  }, [router]);

  async function logout() {
    try { await signOutSupabase(); window.location.href = "/login"; }
    catch (err) { console.error("Logout failed", err); }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  const avatarLetter = (userName[0] || "B").toUpperCase();

  const Sidebar = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={16} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>Sustainly Green</p>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", margin: 0, fontWeight: 500, letterSpacing: "0.03em" }}>BUYER PANEL</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNav}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 12,
                fontSize: 13.5, fontWeight: active ? 700 : 500,
                textDecoration: "none", transition: "all .15s",
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                borderLeft: active ? "3px solid #4ade80" : "3px solid transparent",
              }}
            >
              <Icon size={16} style={{ opacity: active ? 1 : 0.6 }} />
              {item.name}
              {active && <ChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "0 12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px 10px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#166534)", color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {avatarLetter}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
          </div>
        </div>
        <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: "none", background: "rgba(248,113,113,0.1)", color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}>
          <LogOut size={14} />Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SessionTimeoutNotice />
      <style>{`
        .bl-sidebar {
          width: 220px; flex-shrink: 0;
          background: linear-gradient(170deg, #0a1a10 0%, #0d2218 55%, #0b1e14 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
        }
        @media (max-width: 767px) { .bl-sidebar { display: none; } }
        .bl-content { flex: 1; overflow-y: auto; background: #f3f5f4; }
        .bl-content input,
        .bl-content select,
        .bl-content textarea {
          border-color: #cbd5d1 !important;
          color: #10241b !important;
        }
        .bl-content input::placeholder,
        .bl-content textarea::placeholder {
          color: #6b7b71 !important;
        }
        .bl-content label {
          color: #37483d;
        }
        .bl-topbar {
          display: none; position: sticky; top: 0; z-index: 40;
          background: #fff; border-bottom: 1px solid rgba(0,0,0,0.07);
          padding: 12px 16px; align-items: center; justify-content: space-between;
        }
        @media (max-width: 767px) { .bl-topbar { display: flex; } }
        .bl-mobile-overlay { position: fixed; inset: 0; z-index: 60; display: flex; }
        .bl-mobile-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(3px); }
        .bl-mobile-drawer {
          width: 240px; height: 100%; position: relative; z-index: 1;
          background: linear-gradient(170deg, #0a1a10 0%, #0d2218 55%, #0b1e14 100%);
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* Desktop sidebar */}
        <aside className="bl-sidebar">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="bl-mobile-overlay">
            <div className="bl-mobile-backdrop" onClick={() => setMobileOpen(false)} />
            <div className="bl-mobile-drawer">
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 12px 0" }}>
                <button onClick={() => setMobileOpen(false)} style={{ border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>
              <Sidebar onNav={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Mobile top bar */}
          <header className="bl-topbar">
            <button onClick={() => setMobileOpen(true)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Buyer Panel</span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#166534)", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {avatarLetter}
            </div>
          </header>

          <div className="bl-content">
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
