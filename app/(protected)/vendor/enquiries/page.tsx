"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReplyQuoteModal from "./ReplyQuoteModal";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  Send, CheckCircle2, XCircle, MessageSquare, Inbox,
  MapPin, Package, AlarmClock, Search, Filter,
} from "lucide-react";

type RFQStatus = "RFQ_REQUESTED" | "QUOTED" | "ACCEPTED" | "REJECTED";
type FilterKey  = RFQStatus | "ALL";

interface RFQ {
  id: string;
  status: RFQStatus;
  requirementTitle: string;
  buyerName: string;
  deliveryCountry: string;
  requirementType: string;
  estimatedQuantity: string | number;
  requiredTimeline?: string;
  additionalDetails?: string;
}

const STATUS_META: Record<RFQStatus, { label: string; bg: string; color: string; dot: string }> = {
  RFQ_REQUESTED: { label: "Pending",      bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  QUOTED:        { label: "Quote Sent",   bg: "#fefce8", color: "#92400e", dot: "#f59e0b" },
  ACCEPTED:      { label: "Accepted",     bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  REJECTED:      { label: "Rejected",     bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
};

const TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL",          label: "All" },
  { key: "RFQ_REQUESTED",label: "Pending" },
  { key: "QUOTED",       label: "Quoted" },
  { key: "ACCEPTED",     label: "Accepted" },
  { key: "REJECTED",     label: "Rejected" },
];

const ORDER: Record<RFQStatus, number> = { RFQ_REQUESTED: 1, QUOTED: 2, ACCEPTED: 3, REJECTED: 4 };

export default function VendorEnquiriesPage() {
  const router = useRouter();
  const [rfqs, setRfqs]         = useState<RFQ[]>([]);
  const [active, setActive]     = useState<RFQ | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState<FilterKey>("ALL");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const res = await fetch("/api/vendor/rfqs", { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load RFQs.");
        setRfqs(payload.rfqs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load RFQs.");
      } finally { setLoading(false); }
    }
    load();
  }, [router]);

  const counts = {
    ALL:          rfqs.length,
    RFQ_REQUESTED: rfqs.filter(r => r.status === "RFQ_REQUESTED").length,
    QUOTED:       rfqs.filter(r => r.status === "QUOTED").length,
    ACCEPTED:     rfqs.filter(r => r.status === "ACCEPTED").length,
    REJECTED:     rfqs.filter(r => r.status === "REJECTED").length,
  };

  const filtered = rfqs
    .filter(r => tab === "ALL" || r.status === tab)
    .filter(r => !search || r.requirementTitle.toLowerCase().includes(search.toLowerCase()) || r.buyerName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .ve-page{display:flex;flex-direction:column;gap:20px;padding-bottom:32px}
        .ve-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:24px 28px;position:relative;overflow:hidden}
        .ve-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 250px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .ve-hero-inner{position:relative;z-index:1}
        .ve-hero-title{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.025em}
        .ve-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .ve-hero-count{font-size:30px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1}

        .ve-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .ve-search{flex:1;min-width:200px;position:relative}
        .ve-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none}
        .ve-search-input{width:100%;padding:10px 12px 10px 36px;border:1.5px solid rgba(0,0,0,.08);border-radius:12px;font-size:13px;outline:none;background:#fff;color:#111;transition:border .15s;font-family:inherit}
        .ve-search-input:focus{border-color:#16a34a}

        .ve-tabs{display:flex;gap:6px;flex-wrap:wrap}
        .ve-tab{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:50px;font-size:12.5px;font-weight:700;border:1.5px solid transparent;cursor:pointer;transition:all .15s;font-family:inherit;background:none}
        .ve-tab-count{font-size:10.5px;font-weight:800;padding:1px 7px;border-radius:50px}
        .ve-tab.active{background:#0f2318;color:#4ade80;border-color:#4ade80}
        .ve-tab:not(.active){background:#fff;color:#6b7280;border-color:rgba(0,0,0,.08)}
        .ve-tab:not(.active):hover{background:#f9fafb;color:#374151}

        .ve-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
        .ve-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:all .15s;display:flex;flex-direction:column}
        .ve-card:hover{box-shadow:0 6px 22px rgba(0,0,0,.09);transform:translateY(-2px)}
        .ve-card-top{padding:18px 18px 14px;border-bottom:1px solid #f9fafb}
        .ve-card-title{font-size:14px;font-weight:800;color:#111;margin:0 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ve-card-buyer{font-size:12.5px;font-weight:600;color:#374151;margin:0}
        .ve-pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px}
        .ve-dot{width:6px;height:6px;border-radius:50%}

        .ve-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 18px}
        .ve-meta-item{}
        .ve-meta-label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin:0 0 2px;display:flex;align-items:center;gap:3px}
        .ve-meta-val{font-size:12.5px;font-weight:700;color:#111;margin:0}

        .ve-details{padding:0 18px 14px;font-size:12.5px;color:#6b7280;line-height:1.55;border-top:1px solid #f9fafb;padding-top:12px}
        .ve-card-footer{padding:14px 18px;border-top:1px solid #f9fafb;display:flex;justify-content:flex-end;margin-top:auto}

        .ve-send-btn{display:inline-flex;align-items:center;gap:7px;background:#16a34a;color:#fff;padding:9px 18px;border-radius:50px;font-size:12.5px;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:background .15s;box-shadow:0 3px 12px rgba(22,163,74,.3)}
        .ve-send-btn:hover{background:#15803d}

        .ve-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:48px 24px;background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;text-align:center}
        .ve-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}
      `}</style>

      <div className="ve-page">
        {error && <div className="ve-err">{error}</div>}

        {/* Hero */}
        <div className="ve-hero">
          <div className="ve-hero-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 className="ve-hero-title">Buyer Enquiries</h1>
              <p className="ve-hero-sub">Manage and respond to quotation requests</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="ve-hero-count">{counts.ALL}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.35)", margin: "4px 0 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Total RFQs</p>
            </div>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="ve-toolbar">
          <div className="ve-search">
            <div className="ve-search-icon"><Search size={14} color="#9ca3af" /></div>
            <input className="ve-search-input" placeholder="Search by title or buyer…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="ve-tabs">
          {TABS.map(({ key, label }) => (
            <button key={key} className={`ve-tab${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>
              {label}
              <span className="ve-tab-count" style={{ background: tab === key ? "rgba(74,222,128,.2)" : "#f3f4f6", color: tab === key ? "#4ade80" : "#9ca3af" }}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="ve-empty">
            <Inbox size={36} color="#e5e7eb" />
            <p style={{ fontSize: 14, fontWeight: 700, color: "#9ca3af", margin: 0 }}>No enquiries found</p>
            <p style={{ fontSize: 12.5, color: "#d1d5db", margin: 0 }}>
              {search ? "Try a different search term" : "No RFQs match this filter"}
            </p>
          </div>
        ) : (
          <div className="ve-grid">
            {filtered.map(r => {
              const m = STATUS_META[r.status];
              return (
                <div key={r.id} className="ve-card">
                  <div className="ve-card-top">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <h2 className="ve-card-title">{r.requirementTitle}</h2>
                        <p className="ve-card-buyer">{r.buyerName}</p>
                      </div>
                      <span className="ve-pill" style={{ background: m.bg, color: m.color, flexShrink: 0 }}>
                        <span className="ve-dot" style={{ background: m.dot }} />{m.label}
                      </span>
                    </div>
                  </div>

                  <div className="ve-meta">
                    <div className="ve-meta-item">
                      <p className="ve-meta-label"><MapPin size={9} />Location</p>
                      <p className="ve-meta-val">{r.deliveryCountry || "—"}</p>
                    </div>
                    <div className="ve-meta-item">
                      <p className="ve-meta-label"><Package size={9} />Quantity</p>
                      <p className="ve-meta-val">{r.estimatedQuantity || "—"}</p>
                    </div>
                    <div className="ve-meta-item">
                      <p className="ve-meta-label"><AlarmClock size={9} />Timeline</p>
                      <p className="ve-meta-val">{r.requiredTimeline?.replaceAll("_", " ") || "—"}</p>
                    </div>
                  </div>

                  {r.additionalDetails && (
                    <div className="ve-details">{r.additionalDetails}</div>
                  )}

                  <div className="ve-card-footer">
                    {r.status === "RFQ_REQUESTED" && (
                      <button className="ve-send-btn" onClick={() => setActive(r)}>
                        <Send size={13} />Send Quote
                      </button>
                    )}
                    {r.status === "QUOTED" && (
                      <span className="ve-pill" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        <MessageSquare size={12} />Quote Sent — Awaiting Response
                      </span>
                    )}
                    {r.status === "ACCEPTED" && (
                      <span className="ve-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>
                        <CheckCircle2 size={12} />Deal Accepted
                      </span>
                    )}
                    {r.status === "REJECTED" && (
                      <span className="ve-pill" style={{ background: "#fef2f2", color: "#b91c1c" }}>
                        <XCircle size={12} />Quote Rejected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {active && (
        <ReplyQuoteModal
          rfq={active}
          onClose={() => setActive(null)}
          onSent={() => {
            setRfqs(prev => prev.map(x => x.id === active.id ? { ...x, status: "QUOTED" } : x));
            setActive(null);
          }}
        />
      )}
    </>
  );
}
