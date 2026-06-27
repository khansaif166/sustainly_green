"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from "recharts";
import Link from "next/link";
import {
  ClipboardList, AlertTriangle, Plus, Search, TrendingUp,
  Clock, CheckCircle2, FileText, ArrowRight, Inbox,
  Percent,
} from "lucide-react";
import { getValidSession } from "@/lib/supabaseAuth";

type RFQ = {
  estimatedQuantity: string;
  requiredTimeline: string;
  deliveryCountry: string;
  id: string;
  requirementTitle: string;
  status: string;
  createdAt: string;
};

type BuyerDashboardResponse = {
  ok: boolean;
  needsOnboarding: boolean;
  rfqs: RFQ[];
};

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  RFQ_REQUESTED: { label: "Pending", bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  QUOTED:        { label: "Quoted",  bg: "#fefce8", color: "#92400e", dot: "#f59e0b" },
  ACCEPTED:      { label: "Accepted",bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      const session = await getValidSession();
      if (!session) { if (isMounted) router.push("/login"); return; }
      try {
        const res = await fetch("/api/buyer/dashboard", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.status === 401 || res.status === 403) { if (isMounted) router.push("/login"); return; }
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load buyer dashboard.");
        if (isMounted) {
          const data = payload as BuyerDashboardResponse;
          setNeedsOnboarding(data.needsOnboarding);
          setRfqs(data.rfqs || []);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Unable to load buyer dashboard.");
      } finally { if (isMounted) setLoading(false); }
    }
    void loadDashboard();
    return () => { isMounted = false; };
  }, [router]);

  const total    = rfqs.length;
  const pending  = rfqs.filter(r => r.status === "RFQ_REQUESTED").length;
  const quoted   = rfqs.filter(r => r.status === "QUOTED").length;
  const accepted = rfqs.filter(r => r.status === "ACCEPTED").length;
  const responseRate = total ? Math.round((quoted / total) * 100) : 0;

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    rfqs.forEach(r => {
      const d = new Date(r.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ month: k, rfqs: v }));
  }, [rfqs]);

  const statusData = [
    { name: "Pending",  value: pending,  fill: "#3b82f6" },
    { name: "Quoted",   value: quoted,   fill: "#f59e0b" },
    { name: "Accepted", value: accepted, fill: "#22c55e" },
  ];

  const recentRfqs = [...rfqs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-9 h-9 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div style={{ maxWidth: 420, background: "#fff", border: "1px solid #fee2e2", borderRadius: 20, padding: 28, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <p style={{ fontWeight: 700, color: "#b91c1c", margin: "0 0 8px" }}>Dashboard could not load</p>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>{error}</p>
        <Link href="/" style={{ display: "inline-flex", padding: "10px 22px", background: "#111", color: "#fff", borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Back to Home</Link>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .bd-page { display: flex; flex-direction: column; gap: 24px; }

        /* greeting */
        .bd-greeting {
          background: linear-gradient(135deg, #0a1a10 0%, #0f2318 60%, #0c1e13 100%);
          border-radius: 22px; padding: 28px 28px 24px;
          position: relative; overflow: hidden;
        }
        .bd-greeting::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 500px 300px at 90% 50%, rgba(22,163,74,0.16) 0%, transparent 65%);
          pointer-events: none;
        }
        .bd-greeting-inner { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .bd-greeting-title { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 4px; letter-spacing: -.02em; }
        .bd-greeting-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; font-weight: 500; }
        .bd-greeting-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .bd-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          background: #16a34a; color: #fff; padding: 10px 18px;
          border-radius: 50px; font-size: 13px; font-weight: 700;
          border: none; cursor: pointer; text-decoration: none; font-family: inherit;
          transition: background .15s, transform .12s; box-shadow: 0 4px 16px rgba(22,163,74,0.35);
          white-space: nowrap;
        }
        .bd-btn-primary:hover { background: #15803d; transform: translateY(-1px); }
        .bd-btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.75);
          padding: 10px 18px; border-radius: 50px; font-size: 13px; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.12); cursor: pointer; text-decoration: none;
          transition: background .15s; white-space: nowrap; font-family: inherit;
        }
        .bd-btn-ghost:hover { background: rgba(255,255,255,0.14); }

        /* onboarding banner */
        .bd-onboarding {
          background: #fffbeb; border: 1px solid #fde68a; border-radius: 18px;
          padding: 18px 20px; display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .bd-onboarding-left { display: flex; align-items: flex-start; gap: 12px; }
        .bd-onboarding-icon { width: 38px; height: 38px; border-radius: 12px; background: #fef3c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bd-onboarding-cta {
          display: inline-flex; align-items: center; gap: 6px;
          background: #d97706; color: #fff; padding: 9px 18px; border-radius: 50px;
          font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap;
          transition: background .15s;
        }
        .bd-onboarding-cta:hover { background: #b45309; }

        /* KPI grid */
        .bd-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
        .bd-kpi {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 18px; padding: 18px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: flex; flex-direction: column; gap: 12px;
        }
        .bd-kpi-top { display: flex; align-items: center; justify-content: space-between; }
        .bd-kpi-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .bd-kpi-val { font-size: 28px; font-weight: 800; color: #111; letter-spacing: -.03em; line-height: 1; }
        .bd-kpi-lbl { font-size: 12px; color: #9ca3af; font-weight: 600; }

        /* charts */
        .bd-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 700px) { .bd-charts { grid-template-columns: 1fr; } }
        .bd-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 20px; padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .bd-card-title { font-size: 13px; font-weight: 700; color: #111; margin: 0 0 16px; }

        /* RFQ table */
        .bd-table-wrap { overflow-x: auto; }
        .bd-table { width: 100%; border-collapse: collapse; }
        .bd-th {
          font-size: 10.5px; font-weight: 800; color: #9ca3af;
          letter-spacing: .06em; text-transform: uppercase;
          padding: 0 14px 10px; text-align: left; white-space: nowrap;
        }
        .bd-td { padding: 12px 14px; font-size: 13px; color: #374151; vertical-align: middle; }
        .bd-tr { border-top: 1px solid #f3f4f6; transition: background .12s; }
        .bd-tr:hover { background: #fafafa; }
        .bd-status {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 50px;
        }
        .bd-status-dot { width: 5px; height: 5px; border-radius: 50%; }
        .bd-empty-chart { display: flex; align-items: center; justify-content: center; height: 220px; flex-direction: column; gap: 8px; color: #d1d5db; }

        /* quick actions */
        .bd-quick { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .bd-quick-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px; padding: 16px 18px;
          display: flex; align-items: center; gap: 12px;
          text-decoration: none; transition: box-shadow .15s, transform .12s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .bd-quick-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09); transform: translateY(-2px); }
        .bd-quick-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bd-quick-title { font-size: 13px; font-weight: 700; color: #111; margin: 0 0 2px; }
        .bd-quick-sub { font-size: 11.5px; color: #9ca3af; font-weight: 500; margin: 0; }
        .bd-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .bd-section-title { font-size: 14px; font-weight: 800; color: #111; margin: 0; }
        .bd-see-all { font-size: 12.5px; font-weight: 700; color: #16a34a; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .bd-see-all:hover { text-decoration: underline; }
        .bd-empty-table { text-align: center; padding: 40px 20px; color: #9ca3af; }
        .bd-empty-table h3 { font-size: 14px; font-weight: 700; color: #374151; margin: 10px 0 6px; }
        .bd-empty-table p { font-size: 12.5px; margin: 0 0 16px; }
      `}</style>

      <div className="bd-page">
        {/* ── Greeting hero ── */}
        <div className="bd-greeting">
          <div className="bd-greeting-inner">
            <div>
              <h1 className="bd-greeting-title">Welcome back 👋</h1>
              <p className="bd-greeting-sub">Here&apos;s your sourcing overview for today</p>
            </div>
            <div className="bd-greeting-actions">
              <Link href="/buyer/rfq/new" className="bd-btn-primary"><Plus size={14} />New RFQ</Link>
              <Link href="/browse?type=Vendor" className="bd-btn-ghost"><Search size={13} />Browse Vendors</Link>
            </div>
          </div>
        </div>

        {/* ── Onboarding banner ── */}
        {needsOnboarding && (
          <div className="bd-onboarding">
            <div className="bd-onboarding-left">
              <div className="bd-onboarding-icon"><AlertTriangle size={18} color="#d97706" /></div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>Complete your Buyer Profile</p>
                <p style={{ fontSize: 13, color: "#a16207", margin: 0, lineHeight: 1.5 }}>Finish onboarding to unlock vendor discovery, send RFQs, and get matched with verified sustainable suppliers.</p>
              </div>
            </div>
            <Link href="/buyer/onboarding" className="bd-onboarding-cta">
              <ClipboardList size={14} />Complete Onboarding
            </Link>
          </div>
        )}

        {/* ── KPI cards ── */}
        <div className="bd-kpis">
          <div className="bd-kpi">
            <div className="bd-kpi-top">
              <span className="bd-kpi-lbl">Total RFQs</span>
              <div className="bd-kpi-icon" style={{ background: "#f0fdf4" }}><FileText size={16} color="#16a34a" /></div>
            </div>
            <div className="bd-kpi-val">{total}</div>
          </div>
          <div className="bd-kpi">
            <div className="bd-kpi-top">
              <span className="bd-kpi-lbl">Pending</span>
              <div className="bd-kpi-icon" style={{ background: "#eff6ff" }}><Clock size={16} color="#3b82f6" /></div>
            </div>
            <div className="bd-kpi-val" style={{ color: "#2563eb" }}>{pending}</div>
          </div>
          <div className="bd-kpi">
            <div className="bd-kpi-top">
              <span className="bd-kpi-lbl">Quoted</span>
              <div className="bd-kpi-icon" style={{ background: "#fefce8" }}><TrendingUp size={16} color="#f59e0b" /></div>
            </div>
            <div className="bd-kpi-val" style={{ color: "#d97706" }}>{quoted}</div>
          </div>
          <div className="bd-kpi">
            <div className="bd-kpi-top">
              <span className="bd-kpi-lbl">Accepted</span>
              <div className="bd-kpi-icon" style={{ background: "#f0fdf4" }}><CheckCircle2 size={16} color="#22c55e" /></div>
            </div>
            <div className="bd-kpi-val" style={{ color: "#16a34a" }}>{accepted}</div>
          </div>
          <div className="bd-kpi" style={{ borderColor: "#d97706", borderWidth: 1.5 }}>
            <div className="bd-kpi-top">
              <span className="bd-kpi-lbl">Response Rate</span>
              <div className="bd-kpi-icon" style={{ background: "#fefce8" }}><Percent size={16} color="#d97706" /></div>
            </div>
            <div className="bd-kpi-val" style={{ color: "#d97706" }}>{responseRate}%</div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 12px" }}>Quick actions</p>
          <div className="bd-quick">
            <Link href="/buyer/rfq/new" className="bd-quick-card">
              <div className="bd-quick-icon" style={{ background: "#f0fdf4" }}><Plus size={18} color="#16a34a" /></div>
              <div><p className="bd-quick-title">Submit RFQ</p><p className="bd-quick-sub">Request quotes from vendors</p></div>
            </Link>
            <Link href="/browse?type=Vendor" className="bd-quick-card">
              <div className="bd-quick-icon" style={{ background: "#eff6ff" }}><Search size={18} color="#3b82f6" /></div>
              <div><p className="bd-quick-title">Find Vendors</p><p className="bd-quick-sub">Browse verified suppliers</p></div>
            </Link>
            <Link href="/buyer/rfqs" className="bd-quick-card">
              <div className="bd-quick-icon" style={{ background: "#fefce8" }}><FileText size={18} color="#f59e0b" /></div>
              <div><p className="bd-quick-title">My RFQs</p><p className="bd-quick-sub">Track your requests</p></div>
            </Link>
            <Link href="/buyer/reports" className="bd-quick-card">
              <div className="bd-quick-icon" style={{ background: "#fdf4ff" }}><TrendingUp size={18} color="#a855f7" /></div>
              <div><p className="bd-quick-title">Reports</p><p className="bd-quick-sub">View sourcing analytics</p></div>
            </Link>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="bd-charts">
          <div className="bd-card">
            <p className="bd-card-title">RFQs over time</p>
            {trendData.length === 0 ? (
              <div className="bd-empty-chart"><TrendingUp size={28} style={{ opacity: .2 }} /><p style={{ fontSize: 12, margin: 0 }}>No data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Line dataKey="rfqs" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: "#16a34a", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bd-card">
            <p className="bd-card-title">RFQ status breakdown</p>
            {total === 0 ? (
              <div className="bd-empty-chart"><FileText size={28} style={{ opacity: .2 }} /><p style={{ fontSize: 12, margin: 0 }}>No RFQs yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} barCategoryGap={36} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Recent RFQs ── */}
        <div className="bd-card" style={{ padding: 0 }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div className="bd-section-header" style={{ margin: 0 }}>
              <p className="bd-section-title">Recent RFQs</p>
              <Link href="/buyer/rfqs" className="bd-see-all">View all <ArrowRight size={12} /></Link>
            </div>
          </div>

          {recentRfqs.length === 0 ? (
            <div className="bd-empty-table">
              <Inbox size={32} style={{ opacity: .2, margin: "0 auto" }} />
              <h3>No RFQs yet</h3>
              <p>Submit your first request for quotation to get started.</p>
              <Link href="/buyer/rfq/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#16a34a", color: "#fff", padding: "9px 20px", borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                <Plus size={13} />Create RFQ
              </Link>
            </div>
          ) : (
            <div className="bd-table-wrap">
              <table className="bd-table">
                <thead>
                  <tr>
                    <th className="bd-th">Status</th>
                    <th className="bd-th">Date</th>
                    <th className="bd-th">Requirement</th>
                    <th className="bd-th">Qty</th>
                    <th className="bd-th">Timeline</th>
                    <th className="bd-th">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRfqs.map(r => {
                    const meta = STATUS_META[r.status] || { label: r.status, bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
                    return (
                      <tr key={r.id} className="bd-tr">
                        <td className="bd-td">
                          <span className="bd-status" style={{ background: meta.bg, color: meta.color }}>
                            <span className="bd-status-dot" style={{ background: meta.dot }} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="bd-td" style={{ color: "#9ca3af", whiteSpace: "nowrap" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="bd-td" style={{ fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.requirementTitle}
                        </td>
                        <td className="bd-td" style={{ color: "#6b7280" }}>{r.estimatedQuantity || "—"}</td>
                        <td className="bd-td" style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{r.requiredTimeline?.replaceAll("_", " ") || "—"}</td>
                        <td className="bd-td" style={{ color: "#6b7280" }}>{r.deliveryCountry || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "14px 20px", borderTop: "1px solid #f3f4f6", textAlign: "right" }}>
                <Link href="/buyer/rfqs" className="bd-see-all">View all RFQs <ArrowRight size={12} /></Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
