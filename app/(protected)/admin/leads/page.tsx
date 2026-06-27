"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { CalendarDays, FileSpreadsheet, Users, Globe, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

const STATUS_META: Record<string, { bg: string; color: string; dot: string }> = {
  OPEN:          { bg: "#fefce8", color: "#92400e", dot: "#f59e0b"  },
  RFQ_REQUESTED: { bg: "#faf5ff", color: "#7e22ce", dot: "#a855f7"  },
  ACCEPTED:      { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e"  },
  REJECTED:      { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444"  },
};

export default function LeadsPage() {
  const [leads,      setLeads]      = useState<any[]>([]);
  const [filtered,   setFiltered]   = useState<any[]>([]);
  const [activeTab,  setActiveTab]  = useState("ALL");
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");

  const pageSize = 15;

  useEffect(() => { loadLeads(false); }, []);

  async function loadLeads(next = false) {
    if (loading) return;
    setLoading(true);
    try {
      const session = getStoredSession();
      if (!session) throw new Error("Please login again to load leads.");
      const offset = next ? nextOffset : 0;
      const res = await fetch(
        `/api/admin/leads?${new URLSearchParams({ limit: String(pageSize), offset: String(offset) })}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Unable to load leads.");
      const newLeads = (payload.leads || []).map(normalizeRFQ);
      setLeads(prev => {
        const merged = next ? [...prev, ...newLeads] : newLeads;
        return Array.from(new Map(merged.map((item: any) => [item.id, item])).values());
      });
      setNextOffset(payload.nextOffset || offset + newLeads.length);
      setHasMore(Boolean(payload.hasMore));
    } catch (e) {
      console.error("Leads load error:", e);
    } finally { setLoading(false); }
  }

  function normalizeRFQ(d: any) {
    const rawDate = d.rawDate ? new Date(d.rawDate) : new Date();
    return {
      id:        d.id,
      type:      d.type === "GLOBAL" ? "GLOBAL" : "DIRECT",
      // API mapLead already normalises to these keys:
      name:      d.name      || d.buyerName  || "",
      email:     d.email     || d.buyerEmail || "",
      phone:     d.phone     || d.buyerPhone || "",
      title:     d.title     || d.requirementTitle || d.message || "",
      quantity:  d.quantity  || d.estimatedQuantity || "",
      country:   d.country   || d.deliveryCountry  || "",
      vendorId:  d.vendorId  || "",
      status:    d.status,
      createdAt: d.createdAt || rawDate.toLocaleDateString(),
      rawDate,
    };
  }

  useEffect(() => {
    let data = [...leads];
    if (activeTab !== "ALL") data = data.filter(l => l.type === activeTab);
    if (dateFrom) data = data.filter(l => l.rawDate >= new Date(dateFrom));
    if (dateTo)   data = data.filter(l => l.rawDate <= new Date(dateTo));
    setFiltered(data);
  }, [activeTab, dateFrom, dateTo, leads]);

  async function updateStatus(id: string, status: string) {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "leads.xlsx");
  }

  const globalCount = leads.filter(l => l.type === "GLOBAL").length;
  const directCount = leads.filter(l => l.type === "DIRECT").length;

  return (
    <>
      <style>{`
        .ald-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .ald-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .ald-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .ald-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .ald-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .ald-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .ald-hero-stats{display:flex;gap:20px}
        .ald-hero-stat{text-align:right}
        .ald-hero-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .ald-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .ald-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between}
        .ald-tabs{display:flex;gap:4px;background:#f3f4f6;border-radius:50px;padding:3px}
        .ald-tab{padding:7px 16px;border-radius:50px;font-size:12.5px;font-weight:700;border:none;cursor:pointer;font-family:inherit;background:transparent;color:#6b7280;transition:all .15s}
        .ald-tab.on{background:#fff;color:#111;box-shadow:0 1px 4px rgba(0,0,0,.1)}
        .ald-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .ald-date{display:flex;align-items:center;gap:7px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;padding:7px 12px;font-size:13px;background:#fff}
        .ald-date input{border:none;outline:none;font-size:13px;font-family:inherit;background:transparent;color:#374151}
        .ald-export{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;font-size:12.5px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(22,163,74,.2);transition:all .15s}
        .ald-export:hover{background:#15803d}

        .ald-table-wrap{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .ald-table{width:100%;border-collapse:collapse;font-size:13px;min-width:700px}
        .ald-table th{text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#fafafa}
        .ald-table td{padding:11px 16px;border-bottom:1px solid #f9fafb;vertical-align:middle;color:#374151}
        .ald-table tr:last-child td{border-bottom:none}
        .ald-table tr:hover td{background:#fafafa}
        .ald-avatar{width:32px;height:32px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#16a34a;flex-shrink:0}
        .ald-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:50px;font-size:11px;font-weight:700}
        .ald-type-global{background:#eff6ff;color:#3b82f6}
        .ald-type-direct{background:#f0fdf4;color:#16a34a}

        .ald-act-wrap{display:flex;gap:6px;align-items:center}
        .ald-btn-accept{display:inline-flex;align-items:center;gap:3px;padding:5px 12px;border-radius:50px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:#16a34a;color:#fff;white-space:nowrap;transition:opacity .15s}
        .ald-btn-accept:hover{opacity:.85}
        .ald-btn-reject{display:inline-flex;align-items:center;gap:3px;padding:5px 12px;border-radius:50px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:#fef2f2;color:#dc2626;white-space:nowrap;transition:background .15s}
        .ald-btn-reject:hover{background:#fee2e2}

        .ald-more{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:50px;font-size:13px;font-weight:700;background:#fff;border:1.5px solid rgba(0,0,0,.1);color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
        .ald-more:hover{background:#f9fafb}
        .ald-empty{padding:40px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
        .ald-loading{padding:24px;text-align:center;font-size:13px;color:#9ca3af}
      `}</style>

      <div className="ald-page">

        {/* Hero */}
        <div className="ald-hero">
          <div className="ald-hero-inner">
            <div>
              <h1 className="ald-hero-title">Leads & RFQs</h1>
              <p className="ald-hero-sub">All customer inquiries and quote requests</p>
            </div>
            <div className="ald-hero-stats">
              <div className="ald-hero-stat">
                <p className="ald-hero-stat-val">{leads.length}</p>
                <p className="ald-hero-stat-label">Total</p>
              </div>
              <div className="ald-hero-stat">
                <p className="ald-hero-stat-val" style={{ color: "#93c5fd" }}>{globalCount}</p>
                <p className="ald-hero-stat-label">Global</p>
              </div>
              <div className="ald-hero-stat">
                <p className="ald-hero-stat-val">{directCount}</p>
                <p className="ald-hero-stat-label">Direct</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="ald-bar">
          <div className="ald-tabs">
            {["ALL", "GLOBAL", "DIRECT"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`ald-tab${activeTab === t ? " on" : ""}`}>{t}</button>
            ))}
          </div>
          <div className="ald-filters">
            <div className="ald-date">
              <CalendarDays size={14} color="#9ca3af" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
            </div>
            <div className="ald-date">
              <CalendarDays size={14} color="#9ca3af" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
            </div>
            <button onClick={exportExcel} className="ald-export">
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="ald-table-wrap" style={{ overflowX: "auto" }}>
          <table className="ald-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Requirement</th>
                <th>Qty</th>
                <th>Country</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const sm  = STATUS_META[l.status] || { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
                const initials = (l.name || "?").slice(0, 2).toUpperCase();
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div className="ald-avatar">{initials}</div>
                        <span style={{ fontWeight: 600, color: "#111" }}>{l.name || "—"}</span>
                      </div>
                    </td>
                    <td style={{ color: "#6b7280", fontSize: 12.5 }}>{l.email || "—"}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title || "—"}</td>
                    <td>{l.quantity || "—"}</td>
                    <td style={{ textTransform: "capitalize" }}>{l.country || "—"}</td>
                    <td>
                      <span className={`ald-badge ${l.type === "GLOBAL" ? "ald-type-global" : "ald-type-direct"}`}>
                        {l.type === "GLOBAL" ? <Globe size={10} /> : <Users size={10} />}
                        {l.type}
                      </span>
                    </td>
                    <td>
                      <span className="ald-badge" style={{ background: sm.bg, color: sm.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot }} />
                        {l.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11.5, color: "#9ca3af" }}>{l.createdAt}</td>
                    <td>
                      <div className="ald-act-wrap">
                        {l.status !== "ACCEPTED" && (
                          <button className="ald-btn-accept" onClick={() => updateStatus(l.id, "ACCEPTED")}>
                            <CheckCircle2 size={11} />Accept
                          </button>
                        )}
                        {l.status !== "REJECTED" && (
                          <button className="ald-btn-reject" onClick={() => updateStatus(l.id, "REJECTED")}>
                            <XCircle size={11} />Reject
                          </button>
                        )}
                        {l.status === "ACCEPTED" && (
                          <button className="ald-btn-reject" onClick={() => updateStatus(l.id, "OPEN")}>
                            Reset
                          </button>
                        )}
                        {l.status === "REJECTED" && (
                          <button className="ald-btn-accept" onClick={() => updateStatus(l.id, "OPEN")}>
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && <div className="ald-empty">No leads found.</div>}
          {loading && <div className="ald-loading">Loading leads…</div>}
        </div>

        {/* Load more */}
        {hasMore && (
          <div>
            <button onClick={() => loadLeads(true)} className="ald-more" disabled={loading}>
              {loading ? "Loading…" : <><ArrowRight size={14} /> Load More</>}
            </button>
          </div>
        )}

      </div>
    </>
  );
}
