"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Package, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Row = { id: string; [key: string]: any };

const RFQ_PAGE_SIZE = 6;

export default function AdminReportsPage() {
  const [users,          setUsers]          = useState<Row[]>([]);
  const [vendors,        setVendors]        = useState<Row[]>([]);
  const [products,       setProducts]       = useState<Row[]>([]);
  const [rfqs,           setRfqs]           = useState<Row[]>([]);
  const [nextRfqOffset,  setNextRfqOffset]  = useState(0);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => { loadAll(); loadRFQs(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const session = getStoredSession();
      if (!session) throw new Error("Please login again.");
      const res = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Unable to load reports.");
      setUsers(payload.users || []);
      setVendors(payload.vendors || []);
      setProducts(payload.products || []);
    } finally { setLoading(false); }
  }

  async function loadRFQs(next = false) {
    const session = getStoredSession();
    if (!session) { setRfqs([]); return; }
    const offset = next ? nextRfqOffset : 0;
    const res = await fetch(`/api/admin/leads?${new URLSearchParams({ limit: String(RFQ_PAGE_SIZE), offset: String(offset) })}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const payload = await res.json();
    setRfqs(next ? (prev: Row[]) => [...prev, ...(payload.leads || [])] : payload.leads || []);
    setNextRfqOffset(payload.nextOffset || offset + (payload.leads || []).length);
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const approvedVendors  = vendors.filter(v => v.approved).length;
  const approvedProducts = products.filter(p => p.status === "APPROVED").length;

  return (
    <>
      <style>{`
        .arp-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .arp-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .arp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .arp-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .arp-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .arp-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .arp-hero-stats{display:flex;gap:20px}
        .arp-hero-stat{text-align:right}
        .arp-hero-stat-val{font-size:22px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .arp-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .arp-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
        .arp-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 2px 6px rgba(0,0,0,.04)}
        .arp-kpi-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .arp-kpi-val{font-size:20px;font-weight:900;color:#111;margin:0;line-height:1}
        .arp-kpi-label{font-size:11px;color:#6b7280;margin:2px 0 0;font-weight:600}

        .arp-block{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:14px}
        .arp-block-head{display:flex;align-items:center;gap:12px}
        .arp-block-icon{width:38px;height:38px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .arp-block-title{font-size:14px;font-weight:800;color:#111;margin:0}
        .arp-block-sub{font-size:12px;color:#9ca3af;margin:2px 0 0}

        .arp-table-wrap{border:1px solid rgba(0,0,0,.07);border-radius:14px;overflow:hidden;max-height:280px;overflow-y:auto}
        .arp-table{width:100%;border-collapse:collapse;font-size:13px}
        .arp-table th{position:sticky;top:0;text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:10px 14px;border-bottom:1px solid #f3f4f6;background:#fafafa}
        .arp-table td{padding:10px 14px;border-bottom:1px solid #f9fafb;vertical-align:middle;color:#374151}
        .arp-table tr:last-child td{border-bottom:none}
        .arp-table tr:hover td{background:#fafafa}

        .arp-pagination{display:flex;align-items:center;justify-content:flex-end;gap:8px}
        .arp-page-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid rgba(0,0,0,.1);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
        .arp-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .arp-page-btn:not(:disabled):hover{background:#f0fdf4;border-color:#16a34a}

        .arp-status-ok{font-size:11.5px;font-weight:700;color:#15803d}
        .arp-status-pending{font-size:11.5px;font-weight:700;color:#92400e}
      `}</style>

      <div className="arp-page">

        {/* Hero */}
        <div className="arp-hero">
          <div className="arp-hero-inner">
            <div>
              <h1 className="arp-hero-title">Reports</h1>
              <p className="arp-hero-sub">Real-time analytics and operational insights</p>
            </div>
            <div className="arp-hero-stats">
              <div className="arp-hero-stat">
                <p className="arp-hero-stat-val">{users.length}</p>
                <p className="arp-hero-stat-label">Users</p>
              </div>
              <div className="arp-hero-stat">
                <p className="arp-hero-stat-val">{vendors.length}</p>
                <p className="arp-hero-stat-label">Vendors</p>
              </div>
              <div className="arp-hero-stat">
                <p className="arp-hero-stat-val">{rfqs.length}</p>
                <p className="arp-hero-stat-label">RFQs</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="arp-kpis">
          <div className="arp-kpi">
            <div><p className="arp-kpi-val">{users.length}</p><p className="arp-kpi-label">Total Users</p></div>
            <div className="arp-kpi-icon"><Users size={16} color="#16a34a" /></div>
          </div>
          <div className="arp-kpi">
            <div><p className="arp-kpi-val">{approvedVendors}</p><p className="arp-kpi-label">Approved Vendors</p></div>
            <div className="arp-kpi-icon" style={{ background: "#eff6ff" }}><UserCheck size={16} color="#3b82f6" /></div>
          </div>
          <div className="arp-kpi">
            <div><p className="arp-kpi-val">{approvedProducts}</p><p className="arp-kpi-label">Approved Products</p></div>
            <div className="arp-kpi-icon" style={{ background: "#fefce8" }}><Package size={16} color="#ca8a04" /></div>
          </div>
          <div className="arp-kpi">
            <div><p className="arp-kpi-val">{rfqs.length}</p><p className="arp-kpi-label">Total RFQs</p></div>
            <div className="arp-kpi-icon" style={{ background: "#faf5ff" }}><ClipboardList size={16} color="#9333ea" /></div>
          </div>
        </div>

        {/* Users report */}
        <ReportBlock icon={<Users size={16} color="#16a34a" />} title="Users" subtitle="All registered users">
          <PaginatedTable
            headers={["Email", "Role"]}
            rows={users.map(u => [u.email, u.role])}
          />
        </ReportBlock>

        {/* Vendors report */}
        <ReportBlock icon={<UserCheck size={16} color="#16a34a" />} title="Vendors" subtitle="Vendor approval tracking">
          <PaginatedTable
            headers={["Company", "Status"]}
            rows={vendors.map(v => [v.company || v.companyName || "—", v.approved ? "Approved" : "Pending"])}
            statusCol={1}
          />
        </ReportBlock>

        {/* Products report */}
        <ReportBlock icon={<Package size={16} color="#16a34a" />} title="Products" subtitle="Listing & approval reports">
          <PaginatedTable
            headers={["Title", "Status"]}
            rows={products.map(p => [p.title, p.status])}
            statusCol={1}
          />
        </ReportBlock>

        {/* RFQs report */}
        <ReportBlock icon={<ClipboardList size={16} color="#16a34a" />} title="RFQs" subtitle="Buyer enquiries & pipeline">
          <div className="arp-table-wrap">
            <table className="arp-table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Buyer</th>
                  <th>Qty</th>
                  <th>Country</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "20px 14px" }}>No RFQs found</td></tr>
                )}
                {rfqs.map(r => (
                  <tr key={r.id}>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.requirementTitle || r.title || "—"}</td>
                    <td>{r.buyerName || r.name || "—"}</td>
                    <td>{r.estimatedQuantity || r.quantity || "—"}</td>
                    <td>{r.deliveryCountry || r.country || "—"}</td>
                    <td><span style={{ fontSize: 11.5, fontWeight: 700, color: r.status === "ACCEPTED" ? "#15803d" : "#92400e" }}>{r.status || "OPEN"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="arp-pagination">
            <button onClick={() => loadRFQs(true)} style={{ padding: "7px 16px", borderRadius: 50, border: "1.5px solid rgba(0,0,0,.1)", background: "#fff", fontSize: 12.5, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
              Load More →
            </button>
          </div>
        </ReportBlock>

      </div>
    </>
  );
}

function ReportBlock({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.07)", borderRadius: 20, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>{title}</p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PaginatedTable({ headers, rows, statusCol }: { headers: string[]; rows: string[][]; statusCol?: number }) {
  const [page, setPage] = useState(1);
  const PAGE = 6;
  const total    = Math.ceil(rows.length / PAGE);
  const paginated = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ position: "sticky", top: 0, textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em", padding: "10px 14px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={headers.length} style={{ textAlign: "center", color: "#9ca3af", padding: "20px 14px" }}>No records found</td></tr>
            )}
            {paginated.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "10px 14px", color: "#374151" }}>
                    {statusCol === j
                      ? <span style={{ fontSize: 11.5, fontWeight: 700, color: cell === "APPROVED" || cell === "Approved" ? "#15803d" : "#92400e" }}>{cell}</span>
                      : cell
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(0,0,0,.1)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .4 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Page {page} of {total}</span>
          <button disabled={page === total} onClick={() => setPage(p => p + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(0,0,0,.1)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === total ? "not-allowed" : "pointer", opacity: page === total ? .4 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
