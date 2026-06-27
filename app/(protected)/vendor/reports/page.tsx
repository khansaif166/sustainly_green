"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Package, BarChart3, CheckCircle2, MessageSquare,
  Clock, TrendingUp, FileDown, Eye,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Product = { id: string; title: string; approved: boolean; active?: boolean; views?: number };
type Enquiry = { status: string };

const DONUT_COLORS = ["#f59e0b", "#3b82f6", "#16a34a", "#ef4444"];

export default function VendorReportsPage() {
  const router = useRouter();
  const [products,   setProducts]   = useState<Product[]>([]);
  const [enquiries,  setEnquiries]  = useState<Enquiry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const headers = { Authorization: `Bearer ${session.accessToken}` };
        const [pr, er] = await Promise.all([
          fetch("/api/vendor/products", { headers }),
          fetch("/api/vendor/rfqs",     { headers }),
        ]);
        const [pp, ep] = await Promise.all([pr.json(), er.json()]);
        if (!pr.ok) throw new Error(pp?.error?.message || "Failed to load products.");
        if (!er.ok) throw new Error(ep?.error?.message || "Failed to load enquiries.");
        setProducts(pp.products  || []);
        setEnquiries(ep.rfqs     || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reports.");
      } finally { setLoading(false); }
    }
    load();
  }, [router]);

  const totalProducts   = products.length;
  const activeProducts  = products.filter(p => p.approved).length;
  const inactiveProducts= totalProducts - activeProducts;
  const totalEnquiries  = enquiries.length;
  const responded       = enquiries.filter(e => e.status !== "RFQ_REQUESTED").length;
  const pending         = totalEnquiries - responded;
  const accepted        = enquiries.filter(e => e.status === "ACCEPTED").length;
  const rejected        = enquiries.filter(e => e.status === "REJECTED").length;
  const responseRate    = totalEnquiries ? Math.round((responded / totalEnquiries) * 100) : 0;

  const mostViewed = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const barData = [
    { name: "Active",   value: activeProducts },
    { name: "Inactive", value: inactiveProducts },
    { name: "Responded",value: responded },
    { name: "Pending",  value: pending },
  ];

  const donutData = [
    { name: "Pending",  value: pending },
    { name: "Quoted",   value: enquiries.filter(e => e.status === "QUOTED").length },
    { name: "Accepted", value: accepted },
    { name: "Rejected", value: rejected },
  ].filter(d => d.value > 0);

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map((p, i) => ({
      "S.No": i + 1, "Product Name": p.title, Approved: p.approved ? "Yes" : "No", Views: p.views || 0,
    }))), "Products");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(enquiries.map((e, i) => ({
      "S.No": i + 1, Status: e.status,
    }))), "Enquiries");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `Vendor_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Vendor Report", 14, 20);
    doc.setFontSize(12); doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [["#", "Product Name", "Status", "Views"]],
      body: mostViewed.map((p, i) => [i + 1, p.title, p.approved ? "Approved" : "Pending", p.views || 0]),
      theme: "grid",
      headStyles: { fillColor: [16, 163, 74] },
    });
    doc.save("vendor-report.pdf");
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .vr-page{display:flex;flex-direction:column;gap:20px;padding-bottom:32px}
        .vr-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:24px 28px;position:relative;overflow:hidden}
        .vr-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 250px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .vr-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .vr-hero-title{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.025em}
        .vr-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0 0 16px}
        .vr-export-btns{display:flex;gap:8px;flex-wrap:wrap}
        .vr-export-xl{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.8);padding:9px 18px;border-radius:50px;font-size:12.5px;font-weight:700;border:1.5px solid rgba(255,255,255,.12);cursor:pointer;font-family:inherit;transition:all .15s}
        .vr-export-xl:hover{background:rgba(255,255,255,.14)}
        .vr-export-pdf{display:inline-flex;align-items:center;gap:7px;background:#16a34a;color:#fff;padding:9px 18px;border-radius:50px;font-size:12.5px;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:background .15s;box-shadow:0 4px 14px rgba(22,163,74,.3)}
        .vr-export-pdf:hover{background:#15803d}
        .vr-hero-rate{text-align:right}
        .vr-hero-rate-val{font-size:32px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .vr-hero-rate-label{font-size:11px;color:rgba(255,255,255,.32);margin:4px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .vr-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
        .vr-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:10px}
        .vr-kpi-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center}
        .vr-kpi-val{font-size:26px;font-weight:900;color:#111;letter-spacing:-.03em;margin:0;line-height:1.1}
        .vr-kpi-label{font-size:11.5px;font-weight:600;color:#9ca3af;margin:2px 0 0}

        .vr-charts{display:grid;grid-template-columns:3fr 2fr;gap:14px}
        @media(max-width:680px){.vr-charts{grid-template-columns:1fr}}
        .vr-chart-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .vr-chart-title{font-size:11.5px;font-weight:800;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;margin:0 0 16px}

        .vr-table-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .vr-table-title{font-size:11.5px;font-weight:800;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;margin:0 0 16px}
        .vr-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid #f9fafb}
        .vr-row:first-of-type{border-top:none}
        .vr-rank{width:22px;height:22px;border-radius:8px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#16a34a;flex-shrink:0}

        .vr-progress-section{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        @media(max-width:640px){.vr-progress-section{grid-template-columns:1fr}}
        .vr-prog-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .vr-prog-title{font-size:11.5px;font-weight:800;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;margin:0 0 16px}
        .vr-prog-item{margin-bottom:14px}
        .vr-prog-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12.5px;font-weight:600;color:#374151}
        .vr-prog-track{height:8px;border-radius:50px;background:#f3f4f6;overflow:hidden}
        .vr-prog-fill{height:100%;border-radius:50px;transition:width .5s}

        .vr-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}

        /* Donut legend */
        .vr-legend{display:flex;flex-direction:column;gap:8px;justify-content:center}
        .vr-legend-item{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#374151;font-weight:600}
        .vr-legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
      `}</style>

      <div className="vr-page">
        {error && <div className="vr-err">{error}</div>}

        {/* Hero */}
        <div className="vr-hero">
          <div className="vr-hero-inner">
            <div>
              <h1 className="vr-hero-title">Vendor Reports</h1>
              <p className="vr-hero-sub">Live product &amp; enquiry analytics</p>
              <div className="vr-export-btns">
                <button className="vr-export-xl" onClick={exportExcel}><FileDown size={14} />Export Excel</button>
                <button className="vr-export-pdf" onClick={exportPDF}><FileDown size={14} />Export PDF</button>
              </div>
            </div>
            <div className="vr-hero-rate">
              <p className="vr-hero-rate-val">{responseRate}%</p>
              <p className="vr-hero-rate-label">Response Rate</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="vr-kpi-grid">
          {[
            { label: "Total Products",   value: totalProducts,  icon: Package,     bg: "#eff6ff", color: "#3b82f6" },
            { label: "Approved",         value: activeProducts, icon: CheckCircle2,bg: "#f0fdf4", color: "#16a34a" },
            { label: "Total Enquiries",  value: totalEnquiries, icon: MessageSquare,bg:"#fefce8", color: "#f59e0b" },
            { label: "Responded",        value: responded,      icon: TrendingUp,  bg: "#faf5ff", color: "#9333ea" },
            { label: "Pending RFQs",     value: pending,        icon: Clock,       bg: "#fff7ed", color: "#ea580c" },
            { label: "Deals Won",        value: accepted,       icon: BarChart3,   bg: "#f0fdf4", color: "#16a34a" },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="vr-kpi">
              <div className="vr-kpi-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
              <div>
                <p className="vr-kpi-val">{value}</p>
                <p className="vr-kpi-label">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="vr-charts">
          <div className="vr-chart-card">
            <p className="vr-chart-title">Products &amp; Enquiries Overview</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #f3f4f6", fontSize: 12 }} />
                <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={44} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="vr-chart-card">
            <p className="vr-chart-title">Enquiry Status</p>
            {donutData.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="vr-legend">
                  {donutData.map((d, i) => (
                    <div key={d.name} className="vr-legend-item">
                      <div className="vr-legend-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span>{d.name}</span>
                      <span style={{ marginLeft: "auto", color: "#9ca3af" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#d1d5db" }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>No enquiry data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress bars */}
        <div className="vr-progress-section">
          <div className="vr-prog-card">
            <p className="vr-prog-title">Product Status</p>
            {[
              { label: "Approved",  value: activeProducts, total: totalProducts, color: "#16a34a" },
              { label: "Pending",   value: inactiveProducts,total: totalProducts, color: "#f59e0b" },
            ].map(({ label, value, total, color }) => {
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label} className="vr-prog-item">
                  <div className="vr-prog-header"><span>{label}</span><span style={{ color }}>{value} <span style={{ color: "#9ca3af", fontWeight: 500 }}>/ {total}</span></span></div>
                  <div className="vr-prog-track"><div className="vr-prog-fill" style={{ width: `${pct}%`, background: color }} /></div>
                </div>
              );
            })}
          </div>

          <div className="vr-prog-card">
            <p className="vr-prog-title">Enquiry Response</p>
            {[
              { label: "Responded", value: responded, total: totalEnquiries, color: "#3b82f6" },
              { label: "Pending",   value: pending,   total: totalEnquiries, color: "#f59e0b" },
              { label: "Won",       value: accepted,  total: totalEnquiries, color: "#16a34a" },
            ].map(({ label, value, total, color }) => {
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label} className="vr-prog-item">
                  <div className="vr-prog-header"><span>{label}</span><span style={{ color }}>{value} <span style={{ color: "#9ca3af", fontWeight: 500 }}>/ {total}</span></span></div>
                  <div className="vr-prog-track"><div className="vr-prog-fill" style={{ width: `${pct}%`, background: color }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most viewed */}
        <div className="vr-table-card">
          <p className="vr-table-title">Most Viewed Products</p>
          {mostViewed.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No product view data yet.</p>
          ) : mostViewed.map((p, i) => (
            <div key={p.id} className="vr-row">
              <div className="vr-rank">#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "#111", margin: 0 }}>{p.title}</p>
                <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0 }}>{p.approved ? "Approved" : "Pending review"}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Eye size={13} color="#9ca3af" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{p.views || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
