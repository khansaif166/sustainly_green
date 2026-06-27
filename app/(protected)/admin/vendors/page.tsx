"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Search, Filter, Trash2, Building2, AlertTriangle } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Vendor = {
  website?: string;
  uid: string;
  companyName: string;
  registrationType?: string;
  cinRegistration?: string;
  gstNumber?: string;
  yearOfIncorporation?: string;
  businessType?: string;
  primaryCategory?: string;
  country: string;
  city: string;
  businessEmail?: string;
  whatsapp?: string;
  primaryContactName?: string;
  primarySustainabilityCert?: string;
  certificateFileUrl?: string;
  shortDescription?: string;
  logoUrl?: string;
  approved: boolean;
  claimedStatus?: string;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState<"ALL" | "APPROVED" | "PENDING">("ALL");

  async function fetchVendors() {
    const session = getStoredSession();
    if (!session) { setLoading(false); return; }
    const res = await fetch("/api/admin/vendors", { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const payload = await res.json();
    if (res.ok) setVendors(payload.vendors || []);
    setLoading(false);
  }

  useEffect(() => { fetchVendors(); }, []);

  async function approveVendor(uid: string) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ approved: true }) });
    fetchVendors();
  }

  async function rejectVendor(uid: string) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ approved: false }) });
    fetchVendors();
  }

  async function deleteVendor(uid: string) {
    if (!confirm("Delete this vendor? This cannot be undone.")) return;
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/vendors/${uid}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    fetchVendors();
  }

  const filtered = useMemo(() => vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = v.companyName?.toLowerCase().includes(q) || v.businessEmail?.toLowerCase().includes(q);
    const matchStatus = status === "ALL" || (status === "APPROVED" && v.approved) || (status === "PENDING" && !v.approved);
    return matchSearch && matchStatus;
  }), [vendors, search, status]);

  const pending  = vendors.filter(v => !v.approved).length;
  const approved = vendors.filter(v => v.approved).length;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .av-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .av-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .av-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .av-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .av-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .av-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .av-hero-stats{display:flex;gap:20px}
        .av-hero-stat{text-align:right}
        .av-hero-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .av-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .av-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap}
        .av-search{position:relative;flex:1;min-width:180px}
        .av-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .av-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;transition:border .15s;background:#fff;box-sizing:border-box;color:#111}
        .av-search input:focus{border-color:#16a34a}
        .av-select{padding:9px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111;min-width:150px}
        .av-select:focus{border-color:#16a34a}

        .av-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .av-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column}
        .av-card-top{padding:16px;border-bottom:1px solid #f3f4f6}
        .av-card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:#6b7280}
        .av-card-foot{padding:12px 14px;border-top:1px solid #f3f4f6;display:flex;gap:8px;flex-wrap:wrap}
        .av-avatar{width:40px;height:40px;border-radius:13px;object-fit:cover;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#16a34a;flex-shrink:0}
        .av-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px}
        .av-cert-chip{display:inline-block;padding:3px 9px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:700;border-radius:50px;border:1px solid rgba(22,163,74,.15)}

        .av-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:7px 14px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none;text-decoration:none}
        .av-btn-outline{border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151}
        .av-btn-outline:hover{background:#f9fafb}
        .av-btn-green{background:#16a34a;color:#fff;box-shadow:0 2px 8px rgba(22,163,74,.25)}
        .av-btn-green:hover{background:#15803d}
        .av-btn-ghost{border:1.5px solid rgba(0,0,0,.08);background:#fff;color:#6b7280}
        .av-btn-ghost:hover{background:#f9fafb}
        .av-btn-danger{width:34px;height:34px;padding:0;border-radius:50%;background:#fef2f2;color:#dc2626;border:1.5px solid rgba(220,38,38,.15)}
        .av-btn-danger:hover{background:#fee2e2}

        .av-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:40px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
        .av-unclaimed{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:50px;font-size:10.5px;font-weight:700;background:#fff7ed;color:#c2410c;border:1px solid rgba(194,65,12,.15)}
      `}</style>

      <div className="av-page">

        {/* Hero */}
        <div className="av-hero">
          <div className="av-hero-inner">
            <div>
              <h1 className="av-hero-title">Vendor Approvals</h1>
              <p className="av-hero-sub">Review and approve vendor registrations</p>
            </div>
            <div className="av-hero-stats">
              <div className="av-hero-stat">
                <p className="av-hero-stat-val">{vendors.length}</p>
                <p className="av-hero-stat-label">Total</p>
              </div>
              <div className="av-hero-stat">
                <p className="av-hero-stat-val" style={{ color: "#fbbf24" }}>{pending}</p>
                <p className="av-hero-stat-label">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="av-bar">
          <div className="av-search">
            <Search size={14} color="#9ca3af" className="av-search-icon" />
            <input placeholder="Search company or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="av-select" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="ALL">All Vendors</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="av-empty">No vendors match your filters.</div>
        ) : (
          <div className="av-grid">
            {filtered.map(v => {
              const initial = v.companyName?.charAt(0)?.toUpperCase() || "?";
              return (
                <div key={v.uid} className="av-card">
                  {/* Top */}
                  <div className="av-card-top">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {v.logoUrl
                          ? <img src={v.logoUrl} alt={v.companyName} style={{ width: 40, height: 40, borderRadius: 13, objectFit: "cover", border: "1px solid rgba(0,0,0,.07)" }} />
                          : <div className="av-avatar">{initial}</div>
                        }
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 800, color: "#111", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{v.companyName}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0 }}>{v.businessType || "—"} • {v.city}</p>
                            {v.claimedStatus === "UNCLAIMED" && (
                              <span className="av-unclaimed">
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c2410c" }} />
                                Unclaimed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="av-badge" style={v.approved ? { background: "#f0fdf4", color: "#15803d" } : { background: "#fefce8", color: "#92400e" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.approved ? "#22c55e" : "#f59e0b", flexShrink: 0 }} />
                        {v.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="av-card-body">
                    <span><b style={{ color: "#374151" }}>Category:</b> {v.primaryCategory || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Est.:</b> {v.yearOfIncorporation || "—"}</span>
                    <span><b style={{ color: "#374151" }}>GST:</b> {v.gstNumber || "—"}</span>
                    <span><b style={{ color: "#374151" }}>Contact:</b> {v.whatsapp || "—"}</span>
                    {v.primarySustainabilityCert && (
                      <div style={{ marginTop: 4 }}>
                        <span className="av-cert-chip">{v.primarySustainabilityCert}</span>
                        {v.certificateFileUrl && (
                          <a href={v.certificateFileUrl} target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#3b82f6", marginLeft: 6, textDecoration: "none" }}>
                            <ExternalLink size={10} />Doc
                          </a>
                        )}
                      </div>
                    )}
                    {v.website && (
                      <a href={v.website} target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#3b82f6", textDecoration: "none" }}>
                        <ExternalLink size={11} />Website
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="av-card-foot">
                    <a href={`/admin/vendors/${v.uid}`} className="av-btn av-btn-outline" style={{ flex: "1 1 100%", justifyContent: "center", marginBottom: 4 }}>
                      View Full Profile
                    </a>
                    {!v.approved && (
                      <button onClick={() => approveVendor(v.uid)} className="av-btn av-btn-green" style={{ flex: 1 }}>
                        <CheckCircle2 size={13} />Approve
                      </button>
                    )}
                    <button onClick={() => rejectVendor(v.uid)} className="av-btn av-btn-ghost" style={{ flex: 1 }}>
                      <XCircle size={13} />Reject
                    </button>
                    <button onClick={() => deleteVendor(v.uid)} className="av-btn av-btn-danger" title="Delete vendor">
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
