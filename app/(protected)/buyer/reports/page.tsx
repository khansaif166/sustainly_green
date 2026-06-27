"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  Download, FileText, TrendingUp, Clock, CheckCircle2,
  XCircle, Inbox, AlertTriangle,
} from "lucide-react";

type RFQ = {
  id: string; requirementTitle: string; estimatedQuantity: string;
  requiredTimeline: string; deliveryCountry: string; status: string; createdAt: string;
};

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  RFQ_REQUESTED: { label: "Pending",  color: "#2563eb", dot: "#3b82f6" },
  QUOTED:        { label: "Quoted",   color: "#92400e", dot: "#f59e0b" },
  ACCEPTED:      { label: "Accepted", color: "#15803d", dot: "#22c55e" },
  REJECTED:      { label: "Rejected", color: "#b91c1c", dot: "#ef4444" },
};

const PAGE_SIZE = 10;

export default function BuyerRFQReportPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const res = await fetch("/api/buyer/rfqs", { headers: { Authorization: `Bearer ${session.accessToken}` } });
        if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load report.");
        setRfqs(payload.rfqs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load report.");
      } finally { setLoading(false); }
    }
    void load();
  }, [router]);

  const total    = rfqs.length;
  const pending  = rfqs.filter(r => r.status === "RFQ_REQUESTED").length;
  const quoted   = rfqs.filter(r => r.status === "QUOTED").length;
  const accepted = rfqs.filter(r => r.status === "ACCEPTED").length;
  const rejected = rfqs.filter(r => r.status === "REJECTED").length;

  const barData = [
    { name: "Pending",  value: pending,  fill: "#3b82f6" },
    { name: "Quoted",   value: quoted,   fill: "#f59e0b" },
    { name: "Accepted", value: accepted, fill: "#22c55e" },
    { name: "Rejected", value: rejected, fill: "#ef4444" },
  ].filter(d => d.value > 0);

  const pieData = barData;

  const totalPages = Math.ceil(rfqs.length / PAGE_SIZE);
  const paginated = rfqs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportExcel() {
    const data = rfqs.map(r => ({
      Requirement: r.requirementTitle, Quantity: r.estimatedQuantity,
      Timeline: r.requiredTimeline, Country: r.deliveryCountry,
      Status: r.status, Date: new Date(r.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RFQ Report");
    XLSX.writeFile(wb, "rfq-report.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("Sustainly Green — RFQ Report", 14, 14);
    autoTable(doc, {
      startY: 22,
      head: [["Requirement", "Qty", "Timeline", "Country", "Status", "Date"]],
      body: rfqs.map(r => [
        r.requirementTitle, r.estimatedQuantity,
        r.requiredTimeline.replaceAll("_", " "), r.deliveryCountry,
        r.status.replaceAll("_", " "), new Date(r.createdAt).toLocaleDateString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 35, 24] },
    });
    doc.save("rfq-report.pdf");
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .rpt-page { display: flex; flex-direction: column; gap: 20px; }
        .rpt-hero { background: linear-gradient(135deg, #0a1a10 0%, #0f2318 60%, #0c1e13 100%); border-radius: 20px; padding: 22px 24px; position: relative; overflow: hidden; }
        .rpt-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 400px 250px at 90% 50%, rgba(22,163,74,0.15) 0%, transparent 65%); pointer-events: none; }
        .rpt-hero-inner { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .rpt-hero-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 3px; letter-spacing: -.02em; }
        .rpt-hero-sub { font-size: 12.5px; color: rgba(255,255,255,0.4); margin: 0; }
        .rpt-export-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .rpt-btn-ghost { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.75); padding: 9px 16px; border-radius: 50px; font-size: 12.5px; font-weight: 600; border: 1px solid rgba(255,255,255,0.12); cursor: pointer; text-decoration: none; transition: background .15s; white-space: nowrap; font-family: inherit; }
        .rpt-btn-ghost:hover { background: rgba(255,255,255,0.16); }
        .rpt-btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; padding: 9px 16px; border-radius: 50px; font-size: 12.5px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; transition: background .15s; box-shadow: 0 4px 14px rgba(22,163,74,0.3); white-space: nowrap; }
        .rpt-btn-primary:hover { background: #15803d; }

        .rpt-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .rpt-kpi { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 16px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .rpt-kpi-val { font-size: 26px; font-weight: 800; margin: 0 0 3px; letter-spacing: -.03em; }
        .rpt-kpi-lbl { font-size: 11.5px; color: #9ca3af; font-weight: 600; margin: 0; }

        .rpt-charts { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
        @media (max-width: 700px) { .rpt-charts { grid-template-columns: 1fr; } }
        .rpt-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .rpt-card-title { font-size: 12.5px; font-weight: 700; color: #111; margin: 0 0 16px; }

        .rpt-table { width: 100%; border-collapse: collapse; }
        .rpt-th { font-size: 10.5px; font-weight: 800; color: #9ca3af; letter-spacing: .06em; text-transform: uppercase; padding: 0 14px 10px; text-align: left; white-space: nowrap; }
        .rpt-td { padding: 11px 14px; font-size: 13px; color: #374151; vertical-align: middle; border-top: 1px solid #f3f4f6; }
        .rpt-tr { transition: background .12s; }
        .rpt-tr:hover { background: #fafafa; }
        .rpt-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 50px; white-space: nowrap; }
        .rpt-dot { width: 5px; height: 5px; border-radius: 50%; }

        .rpt-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 4px; flex-wrap: wrap; gap: 10px; }
        .rpt-pg-info { font-size: 12px; color: #9ca3af; }
        .rpt-pg-btns { display: flex; gap: 6px; }
        .rpt-pg-btn { padding: 7px 16px; border-radius: 50px; font-size: 12.5px; font-weight: 600; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; cursor: pointer; font-family: inherit; transition: all .15s; }
        .rpt-pg-btn:hover:not(:disabled) { background: #f3f4f6; }
        .rpt-pg-btn:disabled { opacity: .4; cursor: not-allowed; }
        .rpt-pg-btn-active { background: #0f2318; border-color: #0f2318; color: #4ade80; }

        .rpt-err { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 14px; font-size: 13px; color: #991b1b; }
        .rpt-empty { text-align: center; padding: 48px 24px; color: #9ca3af; }
        .rpt-empty h3 { font-size: 15px; font-weight: 700; color: #374151; margin: 10px 0 5px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="rpt-page">
        {/* Hero */}
        <div className="rpt-hero">
          <div className="rpt-hero-inner">
            <div>
              <h1 className="rpt-hero-title">RFQ Reports</h1>
              <p className="rpt-hero-sub">Sourcing analytics and history</p>
            </div>
            <div className="rpt-export-group">
              <button onClick={exportExcel} className="rpt-btn-ghost"><Download size={13} />Excel</button>
              <button onClick={exportPDF} className="rpt-btn-primary"><FileText size={13} />Export PDF</button>
            </div>
          </div>
        </div>

        {error && <div className="rpt-err"><AlertTriangle size={15} />{error}</div>}

        {/* KPIs */}
        <div className="rpt-kpis">
          <div className="rpt-kpi">
            <p className="rpt-kpi-val" style={{ color: "#111" }}>{total}</p>
            <p className="rpt-kpi-lbl">Total RFQs</p>
          </div>
          <div className="rpt-kpi">
            <p className="rpt-kpi-val" style={{ color: "#2563eb" }}>{pending}</p>
            <p className="rpt-kpi-lbl">Pending</p>
          </div>
          <div className="rpt-kpi">
            <p className="rpt-kpi-val" style={{ color: "#d97706" }}>{quoted}</p>
            <p className="rpt-kpi-lbl">Quoted</p>
          </div>
          <div className="rpt-kpi">
            <p className="rpt-kpi-val" style={{ color: "#16a34a" }}>{accepted}</p>
            <p className="rpt-kpi-lbl">Accepted</p>
          </div>
          {rejected > 0 && (
            <div className="rpt-kpi">
              <p className="rpt-kpi-val" style={{ color: "#dc2626" }}>{rejected}</p>
              <p className="rpt-kpi-lbl">Rejected</p>
            </div>
          )}
          <div className="rpt-kpi" style={{ borderColor: "#d97706", borderWidth: 1.5 }}>
            <p className="rpt-kpi-val" style={{ color: "#d97706" }}>{total ? Math.round((quoted / total) * 100) : 0}%</p>
            <p className="rpt-kpi-lbl">Response rate</p>
          </div>
        </div>

        {/* Charts */}
        {total > 0 && (
          <div className="rpt-charts">
            <div className="rpt-card">
              <p className="rpt-card-title">Status breakdown</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barCategoryGap={36} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rpt-card">
              <p className="rpt-card-title">Distribution</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rpt-card" style={{ padding: 0 }}>
          <div style={{ padding: "18px 20px 14px" }}>
            <p className="rpt-card-title" style={{ margin: 0 }}>Full RFQ history</p>
          </div>

          {rfqs.length === 0 ? (
            <div className="rpt-empty">
              <Inbox size={32} style={{ opacity: .2, margin: "0 auto" }} />
              <h3>No RFQs found</h3>
              <p style={{ fontSize: 13, margin: 0 }}>Submit your first RFQ to start seeing reports here.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th className="rpt-th">Status</th>
                      <th className="rpt-th">Date</th>
                      <th className="rpt-th">Requirement</th>
                      <th className="rpt-th">Qty</th>
                      <th className="rpt-th">Timeline</th>
                      <th className="rpt-th">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(r => {
                      const meta = STATUS_META[r.status] || { label: r.status, color: "#6b7280", dot: "#9ca3af" };
                      return (
                        <tr key={r.id} className="rpt-tr">
                          <td className="rpt-td">
                            <span className="rpt-status" style={{ background: `${meta.dot}18`, color: meta.color }}>
                              <span className="rpt-dot" style={{ background: meta.dot }} />{meta.label}
                            </span>
                          </td>
                          <td className="rpt-td" style={{ color: "#9ca3af", whiteSpace: "nowrap" }}>
                            {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="rpt-td" style={{ fontWeight: 600, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.requirementTitle}</td>
                          <td className="rpt-td" style={{ color: "#6b7280" }}>{r.estimatedQuantity || "—"}</td>
                          <td className="rpt-td" style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{r.requiredTimeline?.replaceAll("_", " ") || "—"}</td>
                          <td className="rpt-td" style={{ color: "#6b7280" }}>{r.deliveryCountry || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="rpt-pagination">
                  <span className="rpt-pg-info">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rfqs.length)} of {rfqs.length}
                  </span>
                  <div className="rpt-pg-btns">
                    <button className="rpt-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
                      <button key={p} className={`rpt-pg-btn${p === page ? " rpt-pg-btn-active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="rpt-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
