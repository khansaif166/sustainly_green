"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  Users, Building2, Package, ClipboardList, Clock, CheckCircle2,
  AlertTriangle, TrendingUp, ArrowRight,
} from "lucide-react";
const AdminCharts = dynamic(() => import("./_components/AdminCharts"), {
  ssr: false,
  loading: () => <div className="ad-card" style={{ height: 296 }} />,
});

type OverviewCounts = {
  users: number;
  vendors: number;
  pendingVendors: number;
  approvedVendors: number;
  products: number;
  pendingProducts: number;
  approvedProducts: number;
  rfqs: number;
};

type RecentRfq = {
  id: string;
  requirementTitle?: string;
  buyerName?: string;
  estimatedQuantity?: string;
  deliveryCountry?: string;
  requiredTimeline?: string;
  status?: string;
};

type RecentProduct = {
  id: string;
  title: string;
  listingType?: string;
  price?: number | string;
  status?: string;
};

const EMPTY_COUNTS: OverviewCounts = {
  users: 0,
  vendors: 0,
  pendingVendors: 0,
  approvedVendors: 0,
  products: 0,
  pendingProducts: 0,
  approvedProducts: 0,
  rfqs: 0,
};

export default function AdminDashboard() {
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [counts,         setCounts]         = useState<OverviewCounts>(EMPTY_COUNTS);
  const [recentRFQs,     setRecentRFQs]     = useState<RecentRfq[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { setError("Please log in again."); setLoading(false); return; }
      try {
        const res     = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load.");
        setCounts({ ...EMPTY_COUNTS, ...(payload.counts || {}) });
        setRecentRFQs(payload.recentRFQs || []);
        setRecentProducts(payload.recentProducts || []);
        setProductsByCategory(payload.productsByCategory || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const barData = [
    { name: "Users",    count: counts.users },
    { name: "Vendors",  count: counts.vendors },
    { name: "Products", count: counts.products },
    { name: "RFQs",     count: counts.rfqs },
  ];

  const RFQ_STATUS: Record<string, { bg: string; color: string }> = {
    ACCEPTED: { bg: "#f0fdf4", color: "#15803d" },
    REJECTED: { bg: "#fef2f2", color: "#991b1b" },
    OPEN:     { bg: "#fefce8", color: "#92400e" },
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .ad-page{display:flex;flex-direction:column;gap:20px;padding-bottom:40px}

        /* Hero */
        .ad-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:24px 28px;position:relative;overflow:hidden}
        .ad-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 420px 260px at 88% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .ad-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .ad-hero-title{font-size:22px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .ad-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0 0 18px}
        .ad-hero-stats{display:flex;gap:24px}
        .ad-hero-stat-val{font-size:30px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .ad-hero-stat-label{font-size:11px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
        .ad-hero-link{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;background:#16a34a;color:#fff;font-size:12.5px;font-weight:700;text-decoration:none;transition:background .15s}
        .ad-hero-link:hover{background:#15803d}

        /* KPI grid */
        .ad-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
        .ad-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:16px 18px;display:flex;align-items:flex-start;justify-content:space-between;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .ad-kpi-val{font-size:26px;font-weight:900;color:#111;letter-spacing:-.03em;line-height:1;margin:0 0 3px}
        .ad-kpi-label{font-size:11.5px;font-weight:600;color:#6b7280;margin:0}
        .ad-kpi-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}

        /* Alerts */
        .ad-alerts{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
        .ad-alert{border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px}
        .ad-alert-val{font-size:22px;font-weight:900;line-height:1;margin:0 0 2px}
        .ad-alert-label{font-size:12px;font-weight:600;margin:0}

        /* Charts */
        .ad-charts{display:grid;grid-template-columns:3fr 2fr;gap:16px}
        @media(max-width:800px){.ad-charts{grid-template-columns:1fr}}
        .ad-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .ad-card-head{padding:16px 20px 12px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between}
        .ad-card-title{font-size:13.5px;font-weight:800;color:#111;margin:0}
        .ad-card-sub{font-size:11.5px;color:#9ca3af;margin:0}
        .ad-card-body{padding:16px 20px}

        /* Table */
        .ad-table{width:100%;border-collapse:collapse;font-size:12.5px}
        .ad-table th{text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:8px 12px;border-bottom:1px solid #f3f4f6}
        .ad-table td{padding:10px 12px;border-bottom:1px solid #f9fafb;vertical-align:middle;color:#374151}
        .ad-table tr:last-child td{border-bottom:none}
        .ad-table tr:hover td{background:#fafafa}
        .ad-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700}
        .ad-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

        /* Error */
        .ad-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}
      `}</style>

      <div className="ad-page">

        {error && <div className="ad-err">{error}</div>}

        {/* Hero */}
        <div className="ad-hero">
          <div className="ad-hero-inner">
            <div>
              <h1 className="ad-hero-title">Admin Dashboard</h1>
              <p className="ad-hero-sub">Real-time system overview &amp; analytics</p>
              <Link href="/" className="ad-hero-link"><ArrowRight size={13} />Back to Home</Link>
            </div>
            <div className="ad-hero-stats">
              <div style={{ textAlign: "right" }}>
                <p className="ad-hero-stat-val">{counts.users}</p>
                <p className="ad-hero-stat-label">Total Users</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="ad-hero-stat-val">{counts.rfqs}</p>
                <p className="ad-hero-stat-label">Total RFQs</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="ad-kpi-grid">
          {[
            { label: "Users",     val: counts.users,    icon: Users,       bg: "#eff6ff", color: "#3b82f6" },
            { label: "Vendors",   val: counts.vendors,  icon: Building2,   bg: "#f0fdf4", color: "#16a34a" },
            { label: "Products",  val: counts.products, icon: Package,     bg: "#faf5ff", color: "#9333ea" },
            { label: "RFQs",      val: counts.rfqs,     icon: ClipboardList, bg: "#fefce8", color: "#f59e0b" },
          ].map(({ label, val, icon: Icon, bg, color }) => (
            <div key={label} className="ad-kpi">
              <div>
                <p className="ad-kpi-val">{val}</p>
                <p className="ad-kpi-label">{label}</p>
              </div>
              <div className="ad-kpi-icon" style={{ background: bg }}><Icon size={17} color={color} /></div>
            </div>
          ))}
        </div>

        {/* Alert cards */}
        <div className="ad-alerts">
          <div className="ad-alert" style={{ background: "#fefce8", border: "1px solid rgba(245,158,11,.15)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
            <div>
              <p className="ad-alert-val" style={{ color: "#92400e" }}>{counts.pendingVendors}</p>
              <p className="ad-alert-label" style={{ color: "#92400e" }}>Vendors Pending</p>
            </div>
          </div>
          <div className="ad-alert" style={{ background: "#f0fdf4", border: "1px solid rgba(22,163,74,.12)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckCircle2 size={18} color="#16a34a" />
            </div>
            <div>
              <p className="ad-alert-val" style={{ color: "#15803d" }}>{counts.approvedVendors}</p>
              <p className="ad-alert-label" style={{ color: "#15803d" }}>Vendors Approved</p>
            </div>
          </div>
          <div className="ad-alert" style={{ background: "#fefce8", border: "1px solid rgba(245,158,11,.15)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div>
              <p className="ad-alert-val" style={{ color: "#92400e" }}>{counts.pendingProducts}</p>
              <p className="ad-alert-label" style={{ color: "#92400e" }}>Products Pending</p>
            </div>
          </div>
          <div className="ad-alert" style={{ background: "#f0fdf4", border: "1px solid rgba(22,163,74,.12)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={18} color="#16a34a" />
            </div>
            <div>
              <p className="ad-alert-val" style={{ color: "#15803d" }}>{counts.approvedProducts}</p>
              <p className="ad-alert-label" style={{ color: "#15803d" }}>Products Approved</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <AdminCharts barData={barData} productsByCategory={productsByCategory} />

        {/* Recent RFQs */}
        <div className="ad-card">
          <div className="ad-card-head">
            <p className="ad-card-title">Recent RFQs</p>
            <Link href="/admin/leads" style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="ad-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Buyer</th>
                  <th>Qty</th>
                  <th>Country</th>
                  <th>Timeline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRFQs.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "24px 12px" }}>No RFQs found</td></tr>
                )}
                {recentRFQs.map(r => {
                  const sk = r.status || "OPEN";
                  const sm = RFQ_STATUS[sk] || { bg: "#f3f4f6", color: "#6b7280" };
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: "#111", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.requirementTitle || "RFQ"}</td>
                      <td style={{ color: "#6b7280" }}>{r.buyerName || "—"}</td>
                      <td>{r.estimatedQuantity || "—"}</td>
                      <td>{r.deliveryCountry || "—"}</td>
                      <td>{r.requiredTimeline || "—"}</td>
                      <td>
                        <span className="ad-badge" style={{ background: sm.bg, color: sm.color }}>
                          <span className="ad-dot" style={{ background: sm.color }} />{sk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Products */}
        <div className="ad-card">
          <div className="ad-card-head">
            <p className="ad-card-title">Recent Products</p>
            <Link href="/admin/products" style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="ad-table" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "#9ca3af", padding: "24px 12px" }}>No products found</td></tr>
                )}
                {recentProducts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: "#111" }}>{p.title}</td>
                    <td style={{ color: "#6b7280" }}>{p.listingType || "—"}</td>
                    <td>₹{p.price || 0}</td>
                    <td>
                      <span className="ad-badge" style={p.status === "APPROVED" ? { background: "#f0fdf4", color: "#15803d" } : { background: "#f3f4f6", color: "#6b7280" }}>
                        <span className="ad-dot" style={{ background: p.status === "APPROVED" ? "#22c55e" : "#d1d5db" }} />
                        {p.status || "PENDING"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
