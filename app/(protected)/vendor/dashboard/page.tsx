"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Package, FileText, CheckCircle2, TrendingUp, PlusCircle,
  MessageSquareText, BarChart3, Clock, AlertTriangle, Inbox,
} from "lucide-react";
import { getValidSession, fetchCurrentProfile } from "@/lib/supabaseAuth";

type RFQ = {
  id: string;
  status: string;
  buyerEmail?: string;
  requirementTitle?: string;
  createdAt?: string;
  vendorResponse?: { price?: number; currency?: string };
};

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  RFQ_REQUESTED: { label: "Pending",  bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  QUOTED:        { label: "Quoted",   bg: "#fefce8", color: "#92400e", dot: "#f59e0b" },
  ACCEPTED:      { label: "Accepted", bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  REJECTED:      { label: "Rejected", bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const [rfqs, setRfqs]                   = useState<RFQ[]>([]);
  const [loading, setLoading]             = useState(true);
  const [needsOnboarding, setNeeds]       = useState(false);
  const [error, setError]                 = useState("");
  const [vendorName, setVendorName]       = useState("Vendor");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const session = await getValidSession();
      if (!session) { if (mounted) router.push("/login"); return; }
      try {
        const profile = await fetchCurrentProfile();
        if (mounted && profile) setVendorName((profile as any).name || (profile as any).company_name || "Vendor");
        const res = await fetch("/api/vendor/dashboard", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.status === 401 || res.status === 403) { if (mounted) router.push("/login"); return; }
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load dashboard.");
        if (mounted) { setNeeds(Boolean(payload.needsOnboarding)); setRfqs(payload.rfqs || []); }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [router]);

  const total    = rfqs.length;
  const quoted   = rfqs.filter(r => r.status === "QUOTED").length;
  const accepted = rfqs.filter(r => r.status === "ACCEPTED").length;
  const pending  = rfqs.filter(r => r.status === "RFQ_REQUESTED").length;
  const revenue  = rfqs.filter(r => r.status === "ACCEPTED").reduce((s, r) => s + (r.vendorResponse?.price || 0), 0);
  const responseRate = total ? Math.round(((total - pending) / total) * 100) : 0;

  const trendData = Array.from({ length: 6 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun"][i],
    rfqs: Math.round(rfqs.length * ((i + 1) / 6)),
    deals: Math.round(accepted * ((i + 1) / 6)),
  }));

  const statusData = [
    { name: "Pending",  value: pending },
    { name: "Quoted",   value: quoted },
    { name: "Accepted", value: accepted },
    { name: "Rejected", value: rfqs.filter(r => r.status === "REJECTED").length },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .vd-page{display:flex;flex-direction:column;gap:20px;padding-bottom:32px}
        .vd-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:28px;position:relative;overflow:hidden}
        .vd-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 420px 300px at 88% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .vd-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .vd-hero-greeting{font-size:13px;font-weight:600;color:rgba(255,255,255,.4);margin:0 0 4px}
        .vd-hero-title{font-size:24px;font-weight:900;color:#fff;margin:0 0 6px;letter-spacing:-.025em}
        .vd-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0 0 18px}
        .vd-hero-ctas{display:flex;gap:8px;flex-wrap:wrap}
        .vd-btn-primary{display:inline-flex;align-items:center;gap:7px;background:#16a34a;color:#fff;padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;text-decoration:none;transition:background .15s;box-shadow:0 4px 14px rgba(22,163,74,.35)}
        .vd-btn-primary:hover{background:#15803d}
        .vd-btn-ghost{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.78);padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;text-decoration:none;border:1.5px solid rgba(255,255,255,.12);transition:all .15s}
        .vd-btn-ghost:hover{background:rgba(255,255,255,.14);color:#fff}
        .vd-hero-stat{text-align:right}
        .vd-hero-stat-val{font-size:32px;font-weight:900;color:#4ade80;letter-spacing:-.03em;margin:0;line-height:1}
        .vd-hero-stat-label{font-size:11px;color:rgba(255,255,255,.32);margin:4px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .vd-onboard{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;background:#fffbeb;border:1.5px solid #fde68a;border-radius:16px;padding:16px 20px}
        .vd-onboard-cta{display:inline-flex;align-items:center;gap:6px;background:#d97706;color:#fff;padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;align-self:center;transition:background .15s}
        .vd-onboard-cta:hover{background:#b45309}

        .vd-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
        .vd-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:10px}
        .vd-kpi-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center}
        .vd-kpi-val{font-size:26px;font-weight:900;color:#111;letter-spacing:-.03em;margin:0;line-height:1.1}
        .vd-kpi-label{font-size:11.5px;font-weight:600;color:#9ca3af;margin:2px 0 0}

        .vd-quick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:12px}
        .vd-quick{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:18px;text-decoration:none;display:flex;flex-direction:column;gap:12px;transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .vd-quick:hover{box-shadow:0 6px 22px rgba(0,0,0,.09);transform:translateY(-2px)}
        .vd-quick-icon{width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center}
        .vd-quick-name{font-size:13.5px;font-weight:700;color:#111;margin:0}
        .vd-quick-desc{font-size:11.5px;color:#9ca3af;margin:2px 0 0}

        .vd-charts{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        @media(max-width:640px){.vd-charts{grid-template-columns:1fr}}
        .vd-chart-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .vd-chart-title{font-size:11.5px;font-weight:800;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;margin:0 0 16px}

        .vd-table-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .vd-table-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .vd-table-title{font-size:11.5px;font-weight:800;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;margin:0}
        .vd-table-link{font-size:12px;font-weight:700;color:#16a34a;text-decoration:none}
        .vd-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid #f9fafb}
        .vd-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .vd-pill{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px}
        .vd-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:32px;text-align:center}
        .vd-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}

        .vd-tips{background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border:1.5px solid #bbf7d0;border-radius:18px;padding:20px}
        .vd-tip{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid rgba(0,0,0,.04)}
        .vd-tip:first-of-type{border-top:none}
      `}</style>

      <div className="vd-page">

        {needsOnboarding && (
          <div className="vd-onboard">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertTriangle size={17} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>Complete your vendor profile</p>
                <p style={{ fontSize: 12.5, color: "#a16207", margin: 0 }}>Finish onboarding to appear in search results and start receiving RFQs.</p>
              </div>
            </div>
            <Link href="/vendor/onboarding" className="vd-onboard-cta">Complete Now</Link>
          </div>
        )}

        {error && <div className="vd-err">{error}</div>}

        {/* Hero */}
        <div className="vd-hero">
          <div className="vd-hero-inner">
            <div>
              <p className="vd-hero-greeting">{greeting}, {vendorName.split(" ")[0]} 👋</p>
              <h1 className="vd-hero-title">Vendor Dashboard</h1>
              <p className="vd-hero-sub">Track enquiries, quotes &amp; performance</p>
              <div className="vd-hero-ctas">
                <Link href="/vendor/products/new" className="vd-btn-primary"><PlusCircle size={14} />Add Product</Link>
                <Link href="/vendor/enquiries" className="vd-btn-ghost"><MessageSquareText size={14} />Enquiries</Link>
              </div>
            </div>
            <div className="vd-hero-stat">
              <p className="vd-hero-stat-val">{responseRate}%</p>
              <p className="vd-hero-stat-label">Response Rate</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="vd-kpi-grid">
          {[
            { label: "RFQs Received", value: total,    icon: FileText,      bg: "#eff6ff", color: "#3b82f6" },
            { label: "Quotes Sent",   value: quoted,   icon: TrendingUp,    bg: "#fefce8", color: "#f59e0b" },
            { label: "Deals Won",     value: accepted, icon: CheckCircle2,  bg: "#f0fdf4", color: "#16a34a" },
            { label: "Pending RFQs", value: pending,   icon: Clock,         bg: "#faf5ff", color: "#9333ea" },
            { label: "Revenue (₹)",  value: `₹${revenue.toLocaleString("en-IN")}`, icon: TrendingUp, bg: "#fff7ed", color: "#ea580c" },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="vd-kpi">
              <div className="vd-kpi-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
              <div>
                <p className="vd-kpi-val">{value}</p>
                <p className="vd-kpi-label">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="vd-quick-grid">
          {[
            { name: "Add Product",   desc: "List a new product",        href: "/vendor/products/new", icon: PlusCircle,       bg: "#f0fdf4", color: "#16a34a" },
            { name: "My Products",   desc: "Manage your listings",      href: "/vendor/products",     icon: Package,          bg: "#eff6ff", color: "#3b82f6" },
            { name: "Enquiries",     desc: `${pending} pending RFQs`,   href: "/vendor/enquiries",    icon: MessageSquareText,bg: "#fefce8", color: "#f59e0b" },
            { name: "Reports",       desc: "Analytics & exports",       href: "/vendor/reports",      icon: BarChart3,        bg: "#faf5ff", color: "#9333ea" },
          ].map(({ name, desc, href, icon: Icon, bg, color }) => (
            <Link key={href} href={href} className="vd-quick">
              <div className="vd-quick-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
              <div>
                <p className="vd-quick-name">{name}</p>
                <p className="vd-quick-desc">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts */}
        <div className="vd-charts">
          <div className="vd-chart-card">
            <p className="vd-chart-title">RFQ &amp; Deals Trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #f3f4f6", fontSize: 12 }} />
                <Line type="monotone" dataKey="rfqs"  stroke="#3b82f6" strokeWidth={2.5} dot={false} name="RFQs" />
                <Line type="monotone" dataKey="deals" stroke="#16a34a" strokeWidth={2.5} dot={false} name="Deals" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="vd-chart-card">
            <p className="vd-chart-title">Status Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #f3f4f6", fontSize: 12 }} />
                <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={44} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Enquiries */}
        <div className="vd-table-card">
          <div className="vd-table-hdr">
            <p className="vd-table-title">Recent Enquiries</p>
            <Link href="/vendor/enquiries" className="vd-table-link">View all →</Link>
          </div>
          {rfqs.length === 0 ? (
            <div className="vd-empty">
              <Inbox size={32} color="#e5e7eb" />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", margin: 0 }}>No enquiries yet</p>
              <p style={{ fontSize: 12, color: "#d1d5db", margin: 0 }}>Complete onboarding to start receiving RFQs</p>
            </div>
          ) : rfqs.slice(0, 6).map(r => {
            const m = STATUS_META[r.status] || { label: r.status, bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
            return (
              <div key={r.id} className="vd-row">
                <div className="vd-dot" style={{ background: m.dot }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.requirementTitle || r.buyerEmail || "RFQ"}
                  </p>
                  {r.createdAt && (
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
                <span className="vd-pill" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                {r.vendorResponse?.price && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", whiteSpace: "nowrap" }}>
                    {r.vendorResponse.currency} {r.vendorResponse.price.toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Performance tips */}
        <div className="vd-tips">
          <p style={{ fontSize: 11.5, fontWeight: 800, color: "#15803d", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 10px" }}>Performance tips</p>
          {[
            "Respond within 24 hours for higher ranking in search results",
            "Add sustainability certifications to increase buyer trust",
            "Upload product images to improve click-through rates by 3×",
            "Keep pricing competitive to win more deals",
          ].map((tip, i) => (
            <div key={i} className="vd-tip">
              <div style={{ width: 18, height: 18, borderRadius: 6, background: "rgba(22,163,74,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <CheckCircle2 size={11} color="#16a34a" />
              </div>
              <p style={{ fontSize: 12.5, color: "#166534", margin: 0, lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
