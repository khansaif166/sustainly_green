"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  Plus, FileText, Clock, TrendingUp, CheckCircle2,
  XCircle, Inbox, ArrowRight, Search, AlertTriangle, ClipboardList,
} from "lucide-react";

type RFQ = {
  id: string;
  requirementTitle: string;
  vendorId: string | null;
  status: string;
  deliveryCountry: string;
  estimatedQuantity: string;
  requiredTimeline: string;
  createdAt?: string;
  vendorResponse?: { price?: number; currency?: string; message?: string };
};

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string; icon: any }> = {
  RFQ_REQUESTED: { label: "Pending",  bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6", icon: Clock },
  QUOTED:        { label: "Quoted",   bg: "#fefce8", color: "#92400e", dot: "#f59e0b", icon: TrendingUp },
  ACCEPTED:      { label: "Accepted", bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", icon: CheckCircle2 },
  REJECTED:      { label: "Rejected", bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", icon: XCircle },
};

const TABS = ["All", "Pending", "Quoted", "Accepted", "Rejected"];

export default function BuyerRFQsPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const res = await fetch("/api/buyer/rfqs", { headers: { Authorization: `Bearer ${session.accessToken}` } });
        if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load RFQs.");
        setNeedsOnboarding(Boolean(payload?.needsOnboarding));
        setRfqs(payload.rfqs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load RFQs.");
      } finally { setLoading(false); }
    }
    void load();
  }, [router]);

  const filtered = rfqs.filter(r => {
    const matchTab = tab === "All" || STATUS_META[r.status]?.label === tab;
    const matchSearch = !search || r.requirementTitle.toLowerCase().includes(search.toLowerCase()) || r.deliveryCountry?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts: Record<string, number> = { All: rfqs.length };
  Object.entries(STATUS_META).forEach(([k, v]) => { counts[v.label] = rfqs.filter(r => r.status === k).length; });

  return (
    <>
      <style>{`
        .rfq-page { display: flex; flex-direction: column; gap: 20px; }
        .rfq-hero {
          background: linear-gradient(135deg, #0a1a10 0%, #0f2318 60%, #0c1e13 100%);
          border-radius: 20px; padding: 24px 24px 22px; position: relative; overflow: hidden;
        }
        .rfq-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 400px 250px at 85% 50%, rgba(22,163,74,0.16) 0%, transparent 65%);
          pointer-events: none;
        }
        .rfq-hero-inner { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .rfq-hero-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 3px; letter-spacing: -.02em; }
        .rfq-hero-sub { font-size: 12.5px; color: rgba(255,255,255,0.4); margin: 0; }
        .rfq-btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; padding: 9px 18px; border-radius: 50px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; text-decoration: none; font-family: inherit; transition: background .15s; box-shadow: 0 4px 14px rgba(22,163,74,0.35); white-space: nowrap; }
        .rfq-btn-primary:hover { background: #15803d; }

        .rfq-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .rfq-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 340px; }
        .rfq-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .rfq-search { width: 100%; padding: 9px 12px 9px 34px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 13px; font-family: inherit; outline: none; color: #111; background: #fff; transition: border-color .15s; box-sizing: border-box; }
        .rfq-search:focus { border-color: #16a34a; }

        .rfq-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .rfq-tab { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 50px; font-size: 12.5px; font-weight: 600; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; cursor: pointer; transition: all .15s; font-family: inherit; white-space: nowrap; }
        .rfq-tab:hover { border-color: #d1d5db; color: #374151; }
        .rfq-tab-active { background: #0f2318; border-color: #0f2318; color: #4ade80; }
        .rfq-tab-count { background: rgba(0,0,0,0.06); color: inherit; font-size: 10.5px; font-weight: 800; padding: 1px 6px; border-radius: 50px; }
        .rfq-tab-active .rfq-tab-count { background: rgba(74,222,128,0.15); }

        .rfq-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .rfq-card { background: #fff; border: 1.5px solid rgba(0,0,0,0.07); border-radius: 18px; overflow: hidden; transition: box-shadow .18s, transform .15s; display: flex; flex-direction: column; }
        .rfq-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); transform: translateY(-2px); }
        .rfq-card-body { padding: 18px 18px 14px; flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .rfq-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .rfq-card-title { font-size: 14px; font-weight: 700; color: #111; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .rfq-card-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; }
        .rfq-card-meta-item { font-size: 12px; color: #6b7280; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .rfq-quote-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 12px; }
        .rfq-quote-price { font-size: 16px; font-weight: 800; color: #15803d; margin: 0 0 2px; }
        .rfq-quote-msg { font-size: 12px; color: #166534; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .rfq-card-footer { padding: 12px 18px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; }
        .rfq-view-btn { display: inline-flex; align-items: center; gap: 6px; background: #16a34a; color: #fff; padding: 7px 16px; border-radius: 50px; font-size: 12.5px; font-weight: 700; text-decoration: none; transition: background .15s; }
        .rfq-view-btn:hover { background: #15803d; }

        .rfq-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 50px; white-space: nowrap; flex-shrink: 0; }
        .rfq-status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .rfq-empty { text-align: center; padding: 56px 24px; background: #fff; border: 1px dashed rgba(0,0,0,0.1); border-radius: 20px; color: #9ca3af; }
        .rfq-empty h3 { font-size: 15px; font-weight: 700; color: #374151; margin: 12px 0 6px; }
        .rfq-empty p { font-size: 13px; margin: 0 0 18px; }
        .rfq-err { background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 12px 16px; font-size: 13px; color: #991b1b; font-weight: 500; }
        .rfq-onboard-banner { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px; padding: 16px 20px; }
        .rfq-onboard-left { display: flex; align-items: flex-start; gap: 10px; }
        .rfq-onboard-icon { width: 36px; height: 36px; border-radius: 10px; background: #fef3c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rfq-onboard-cta { display: inline-flex; align-items: center; gap: 6px; background: #d97706; color: #fff; padding: 9px 18px; border-radius: 50px; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; transition: background .15s; align-self: center; }
        .rfq-onboard-cta:hover { background: #b45309; }
      `}</style>

      <div className="rfq-page">
        {/* Hero */}
        <div className="rfq-hero">
          <div className="rfq-hero-inner">
            <div>
              <h1 className="rfq-hero-title">My RFQs</h1>
              <p className="rfq-hero-sub">{rfqs.length} request{rfqs.length !== 1 ? "s" : ""} total</p>
            </div>
            <Link
              href={needsOnboarding ? "/buyer/onboarding" : "/buyer/rfq/new"}
              className="rfq-btn-primary"
              title={needsOnboarding ? "Complete onboarding first" : undefined}
            >
              <Plus size={14} />{needsOnboarding ? "Complete Onboarding" : "New RFQ"}
            </Link>
          </div>
        </div>

        {error && <div className="rfq-err">{error}</div>}

        {/* Onboarding banner */}
        {!loading && needsOnboarding && (
          <div className="rfq-onboard-banner">
            <div className="rfq-onboard-left">
              <div className="rfq-onboard-icon"><AlertTriangle size={17} color="#d97706" /></div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>Finish your buyer profile to send RFQs</p>
                <p style={{ fontSize: 12.5, color: "#a16207", margin: 0, lineHeight: 1.5 }}>Complete onboarding so vendors can receive and respond to your requests. It takes about 10 minutes.</p>
              </div>
            </div>
            <Link href="/buyer/onboarding" className="rfq-onboard-cta">
              <ClipboardList size={13} />Complete Onboarding
            </Link>
          </div>
        )}

        {/* Toolbar */}
        <div className="rfq-toolbar">
          <div className="rfq-search-wrap">
            <Search size={14} className="rfq-search-icon" />
            <input className="rfq-search" placeholder="Search requirement or location…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="rfq-tabs">
            {TABS.map(t => (
              <button key={t} className={`rfq-tab${tab === t ? " rfq-tab-active" : ""}`} onClick={() => setTab(t)}>
                {t} <span className="rfq-tab-count">{counts[t] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="rfq-grid">
            {filtered.map(r => {
              const meta = STATUS_META[r.status] || { label: r.status, bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af", icon: FileText };
              return (
                <div key={r.id} className="rfq-card">
                  <div className="rfq-card-body">
                    <div className="rfq-card-head">
                      <h2 className="rfq-card-title">{r.requirementTitle}</h2>
                      <span className="rfq-status" style={{ background: meta.bg, color: meta.color }}>
                        <span className="rfq-status-dot" style={{ background: meta.dot }} />{meta.label}
                      </span>
                    </div>
                    <div className="rfq-card-meta">
                      {r.deliveryCountry && <span className="rfq-card-meta-item">📍 {r.deliveryCountry}</span>}
                      {r.estimatedQuantity && <span className="rfq-card-meta-item">📦 {r.estimatedQuantity}</span>}
                      {r.requiredTimeline && <span className="rfq-card-meta-item">⏱ {r.requiredTimeline.replaceAll("_", " ")}</span>}
                      {r.createdAt && <span className="rfq-card-meta-item">🗓 {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </div>
                    {r.status === "QUOTED" && r.vendorResponse && (
                      <div className="rfq-quote-box">
                        <p className="rfq-quote-price">{r.vendorResponse.currency} {r.vendorResponse.price?.toLocaleString()}</p>
                        {r.vendorResponse.message && <p className="rfq-quote-msg">{r.vendorResponse.message}</p>}
                      </div>
                    )}
                  </div>
                  <div className="rfq-card-footer">
                    <Link href={`/buyer/rfqs/${r.id}`} className="rfq-view-btn">
                      View details <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="rfq-empty">
            <Inbox size={36} style={{ opacity: .2, margin: "0 auto" }} />
            <h3>{tab === "All" ? "No RFQs yet" : `No ${tab} RFQs`}</h3>
            <p>{tab === "All" ? "Submit your first request to get quotes from vendors." : `You don't have any ${tab.toLowerCase()} RFQs right now.`}</p>
            <Link href="/buyer/rfq/new" className="rfq-btn-primary" style={{ display: "inline-flex" }}>
              <Plus size={13} />Create RFQ
            </Link>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
