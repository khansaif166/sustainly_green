"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Search, Filter, Trash2, Users, ShoppingCart } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Buyer = {
  uid: string;
  status: "submitted" | "draft";
  approved: boolean;
  companyInfo?: { companyName?: string; organisationType?: string; city?: string; country?: string; email?: string; mobile?: string; contactPerson?: string };
  businessOverview?: { buyerSegment?: string; industry?: string; annualRevenue?: string; noOfEmployees?: string; geographyOfOperation?: string };
  procurement?: { categoriesNeeded?: string[]; minCertificationRequired?: string };
};

const SEGMENTS = ["ALL", "corporate", "msme", "distributor", "retailer"];

export default function AdminBuyersPage() {
  const [buyers,        setBuyers]        = useState<Buyer[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<"ALL" | "SUBMITTED" | "DRAFT">("ALL");
  const [segmentFilter, setSegmentFilter] = useState("ALL");

  async function fetchBuyers() {
    const session = getStoredSession();
    if (!session) { setLoading(false); return; }
    const res = await fetch("/api/admin/buyers", { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const payload = await res.json();
    if (res.ok) setBuyers(payload.buyers || []);
    setLoading(false);
  }

  useEffect(() => { fetchBuyers(); }, []);

  async function approveBuyer(uid: string) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/buyers/${uid}`, { method: "PATCH", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ approved: true }) });
    fetchBuyers();
  }

  async function rejectBuyer(uid: string) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/buyers/${uid}`, { method: "PATCH", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ approved: false }) });
    fetchBuyers();
  }

  async function deleteBuyer(uid: string) {
    if (!confirm("Delete this buyer profile? This cannot be undone.")) return;
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/buyers/${uid}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    fetchBuyers();
  }

  const filtered = useMemo(() => buyers.filter(b => {
    const q    = search.toLowerCase();
    const name = b.companyInfo?.companyName?.toLowerCase() ?? "";
    const email= b.companyInfo?.email?.toLowerCase() ?? "";
    const matchSearch  = name.includes(q) || email.includes(q);
    const matchStatus  = statusFilter === "ALL" || (statusFilter === "SUBMITTED" && b.status === "submitted") || (statusFilter === "DRAFT" && b.status === "draft");
    const matchSegment = segmentFilter === "ALL" || b.businessOverview?.buyerSegment === segmentFilter;
    return matchSearch && matchStatus && matchSegment;
  }), [buyers, search, statusFilter, segmentFilter]);

  const submitted = buyers.filter(b => b.status === "submitted").length;
  const drafts    = buyers.filter(b => b.status === "draft").length;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .ab-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .ab-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .ab-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .ab-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .ab-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .ab-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .ab-hero-stats{display:flex;gap:20px}
        .ab-hero-stat{text-align:right}
        .ab-hero-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .ab-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .ab-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .ab-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 6px rgba(0,0,0,.04)}
        .ab-kpi-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ab-kpi-val{font-size:20px;font-weight:900;color:#111;margin:0;line-height:1}
        .ab-kpi-label{font-size:11.5px;color:#6b7280;margin:2px 0 0;font-weight:600}

        .ab-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap}
        .ab-search{position:relative;flex:1;min-width:180px}
        .ab-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .ab-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .ab-search input:focus{border-color:#16a34a}
        .ab-select{padding:9px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111}
        .ab-select:focus{border-color:#16a34a}

        .ab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .ab-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column}
        .ab-card-top{padding:16px;border-bottom:1px solid #f3f4f6}
        .ab-card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:#6b7280}
        .ab-card-foot{padding:12px 14px;border-top:1px solid #f3f4f6;display:flex;gap:8px;flex-wrap:wrap}
        .ab-avatar{width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#3b82f6;background:#eff6ff;flex-shrink:0}
        .ab-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:50px}
        .ab-chip{display:inline-block;padding:2px 8px;background:#f0fdf4;color:#15803d;font-size:10.5px;font-weight:600;border-radius:50px;border:1px solid rgba(22,163,74,.12)}

        .ab-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:7px 14px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none;text-decoration:none}
        .ab-btn-outline{border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151}
        .ab-btn-outline:hover{background:#f9fafb}
        .ab-btn-green{background:#16a34a;color:#fff}
        .ab-btn-green:hover{background:#15803d}
        .ab-btn-ghost{border:1.5px solid rgba(0,0,0,.08);background:#fff;color:#6b7280}
        .ab-btn-ghost:hover{background:#f9fafb}
        .ab-btn-danger{width:34px;height:34px;padding:0;border-radius:50%;background:#fef2f2;color:#dc2626;border:1.5px solid rgba(220,38,38,.15)}
        .ab-btn-danger:hover{background:#fee2e2}
        .ab-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:40px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
      `}</style>

      <div className="ab-page">

        {/* Hero */}
        <div className="ab-hero">
          <div className="ab-hero-inner">
            <div>
              <h1 className="ab-hero-title">Buyer Management</h1>
              <p className="ab-hero-sub">Review and manage buyer onboarding profiles</p>
            </div>
            <div className="ab-hero-stats">
              <div className="ab-hero-stat">
                <p className="ab-hero-stat-val">{buyers.length}</p>
                <p className="ab-hero-stat-label">Total</p>
              </div>
              <div className="ab-hero-stat">
                <p className="ab-hero-stat-val">{submitted}</p>
                <p className="ab-hero-stat-label">Submitted</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="ab-kpis">
          <div className="ab-kpi">
            <div className="ab-kpi-icon" style={{ background: "#eff6ff" }}><Users size={17} color="#3b82f6" /></div>
            <div><p className="ab-kpi-val">{buyers.length}</p><p className="ab-kpi-label">Total Buyers</p></div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon" style={{ background: "#f0fdf4" }}><CheckCircle2 size={17} color="#16a34a" /></div>
            <div><p className="ab-kpi-val">{submitted}</p><p className="ab-kpi-label">Submitted</p></div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon" style={{ background: "#fefce8" }}><ShoppingCart size={17} color="#f59e0b" /></div>
            <div><p className="ab-kpi-val">{drafts}</p><p className="ab-kpi-label">Drafts</p></div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="ab-bar">
          <div className="ab-search">
            <Search size={14} color="#9ca3af" className="ab-search-icon" />
            <input placeholder="Search company name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="ab-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="ALL">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select className="ab-select" value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)}>
            {SEGMENTS.map(s => <option key={s} value={s}>{s === "ALL" ? "All Segments" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="ab-empty">No buyer profiles match your filters.</div>
        ) : (
          <div className="ab-grid">
            {filtered.map(b => {
              const ci  = b.companyInfo ?? {};
              const bo  = b.businessOverview ?? {};
              const pro = b.procurement ?? {};
              const initial = ci.companyName?.charAt(0)?.toUpperCase() || "B";
              return (
                <div key={b.uid} className="ab-card">
                  {/* Top */}
                  <div className="ab-card-top">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="ab-avatar">{initial}</div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 800, color: "#111", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{ci.companyName || "—"}</p>
                          <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0 }}>
                            {bo.buyerSegment ? bo.buyerSegment[0].toUpperCase() + bo.buyerSegment.slice(1) : "—"} • {ci.city || ""}
                          </p>
                        </div>
                      </div>
                      <span className="ab-badge" style={b.status === "submitted" ? { background: "#f0fdf4", color: "#15803d" } : { background: "#fefce8", color: "#92400e" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: b.status === "submitted" ? "#22c55e" : "#f59e0b", flexShrink: 0 }} />
                        {b.status === "submitted" ? "Submitted" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="ab-card-body">
                    <span><b style={{ color: "#374151" }}>Industry:</b> {bo.industry || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Revenue:</b> {bo.annualRevenue || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Employees:</b> {bo.noOfEmployees || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Contact:</b> {ci.contactPerson || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Email:</b> {ci.email || "—"}</span>
                    {pro.categoriesNeeded && pro.categoriesNeeded.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {pro.categoriesNeeded.slice(0, 3).map(c => <span key={c} className="ab-chip">{c}</span>)}
                        {pro.categoriesNeeded.length > 3 && <span className="ab-chip" style={{ background: "#f3f4f6", color: "#6b7280", border: "none" }}>+{pro.categoriesNeeded.length - 3}</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ab-card-foot">
                    <a href={`/admin/buyers/${b.uid}`} className="ab-btn ab-btn-outline" style={{ flex: "1 1 100%", justifyContent: "center", marginBottom: 4 }}>
                      View Full Profile
                    </a>
                    {!b.approved && (
                      <button onClick={() => approveBuyer(b.uid)} className="ab-btn ab-btn-green" style={{ flex: 1 }}>
                        <CheckCircle2 size={13} />Approve
                      </button>
                    )}
                    <button onClick={() => rejectBuyer(b.uid)} className="ab-btn ab-btn-ghost" style={{ flex: 1 }}>
                      <XCircle size={13} />Reject
                    </button>
                    <button onClick={() => deleteBuyer(b.uid)} className="ab-btn ab-btn-danger" title="Delete buyer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
