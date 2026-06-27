"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, TrendingUp,
  MapPin, Package, AlarmClock, FileText, Phone, Mail,
  MessageSquare, AlertTriangle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  RFQ_REQUESTED: { label: "Pending review",  bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  QUOTED:        { label: "Quote received",  bg: "#fefce8", color: "#92400e", dot: "#f59e0b" },
  ACCEPTED:      { label: "Accepted",        bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  REJECTED:      { label: "Rejected",        bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
};

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={14} color="#9ca3af" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10.5, fontWeight: 800, color: "#9ca3af", letterSpacing: ".05em", textTransform: "uppercase", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111", margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

export default function BuyerRFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [actionDone, setActionDone] = useState("");

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const res = await fetch(`/api/buyer/rfqs/${id}`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
        if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
        if (res.status === 404) { router.push("/buyer/rfqs"); return; }
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load RFQ.");
        setRfq(payload.rfq);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load RFQ.");
      } finally { setLoading(false); }
    }
    void load();
  }, [id, router]);

  async function updateQuote(action: "accept" | "reject") {
    const session = getStoredSession();
    if (!session) { router.push("/login"); return; }
    setUpdating(true); setError(null);
    try {
      const res = await fetch(`/api/buyer/rfqs/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Unable to update RFQ.");
      setRfq(payload.rfq);
      setActionDone(action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update RFQ.");
    } finally { setUpdating(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!rfq) return null;

  const meta = STATUS_META[rfq.status] || { label: rfq.status, bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };

  return (
    <>
      <style>{`
        .rd-page { display: flex; flex-direction: column; gap: 18px; max-width: 760px; }
        .rd-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #6b7280; text-decoration: none; padding: 8px 0; transition: color .15s; }
        .rd-back:hover { color: #111; }
        .rd-hero { background: linear-gradient(135deg, #0a1a10 0%, #0f2318 60%, #0c1e13 100%); border-radius: 20px; padding: 24px; position: relative; overflow: hidden; }
        .rd-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 350px 200px at 90% 50%, rgba(22,163,74,0.15) 0%, transparent 65%); pointer-events: none; }
        .rd-hero-inner { position: relative; z-index: 1; }
        .rd-hero-title { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 10px; letter-spacing: -.02em; line-height: 1.3; }
        .rd-hero-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .rd-status { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 50px; }
        .rd-status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .rd-hero-date { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 500; }

        .rd-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .rd-card-title { font-size: 12px; font-weight: 800; color: #9ca3af; letter-spacing: .06em; text-transform: uppercase; margin: 0 0 14px; }

        .rd-quote-card { border-radius: 18px; padding: 20px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1.5px solid #bbf7d0; }
        .rd-quote-price { font-size: 28px; font-weight: 900; color: #15803d; margin: 0 0 6px; letter-spacing: -.03em; }
        .rd-quote-msg { font-size: 13.5px; color: #166534; line-height: 1.6; margin: 0 0 16px; }
        .rd-quote-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .rd-accept-btn { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; padding: 11px 22px; border-radius: 50px; font-size: 13.5px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; transition: background .15s; box-shadow: 0 4px 14px rgba(22,163,74,0.3); }
        .rd-accept-btn:hover:not(:disabled) { background: #15803d; }
        .rd-accept-btn:disabled { opacity: .5; cursor: not-allowed; }
        .rd-reject-btn { display: inline-flex; align-items: center; gap: 7px; background: #fff; color: #b91c1c; padding: 11px 22px; border-radius: 50px; font-size: 13.5px; font-weight: 700; border: 1.5px solid #fecaca; cursor: pointer; font-family: inherit; transition: all .15s; }
        .rd-reject-btn:hover:not(:disabled) { background: #fef2f2; }
        .rd-reject-btn:disabled { opacity: .5; cursor: not-allowed; }

        .rd-accepted-banner { display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 14px; padding: 14px 16px; font-size: 13.5px; color: #15803d; font-weight: 600; }
        .rd-contact-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; text-decoration: none; transition: color .15s; }
        .rd-contact-row:last-of-type { border-bottom: none; }
        .rd-contact-row:hover { color: #16a34a; }
        .rd-contact-icon { width: 30px; height: 30px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rd-wa-btn { display: inline-flex; align-items: center; gap: 8px; background: #22c55e; color: #fff; padding: 10px 20px; border-radius: 50px; font-size: 13px; font-weight: 700; text-decoration: none; margin-top: 12px; transition: background .15s; }
        .rd-wa-btn:hover { background: #16a34a; }
        .rd-err { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #991b1b; display: flex; align-items: center; gap: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="rd-page">
        <Link href="/buyer/rfqs" className="rd-back"><ArrowLeft size={14} />My RFQs</Link>

        {error && <div className="rd-err"><AlertTriangle size={15} />{error}</div>}

        {/* Hero */}
        <div className="rd-hero">
          <div className="rd-hero-inner">
            <h1 className="rd-hero-title">{rfq.requirementTitle}</h1>
            <div className="rd-hero-meta">
              <span className="rd-status" style={{ background: meta.bg, color: meta.color }}>
                <span className="rd-status-dot" style={{ background: meta.dot }} />{meta.label}
              </span>
              {rfq.createdAt && (
                <span className="rd-hero-date">Submitted {new Date(rfq.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rd-card">
          <p className="rd-card-title">RFQ Details</p>
          <DetailRow icon={FileText}    label="Requirement type"  value={rfq.requirementType?.replaceAll("_", " ")} />
          <DetailRow icon={Package}     label="Estimated quantity" value={rfq.estimatedQuantity} />
          <DetailRow icon={MapPin}      label="Delivery location"  value={rfq.deliveryCountry} />
          <DetailRow icon={AlarmClock}  label="Required timeline"  value={rfq.requiredTimeline?.replaceAll("_", " ")} />
          {rfq.additionalDetails && (
            <div style={{ padding: "12px 0 2px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessageSquare size={14} color="#9ca3af" />
              </div>
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 800, color: "#9ca3af", letterSpacing: ".05em", textTransform: "uppercase", margin: "0 0 4px" }}>Additional details</p>
                <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.65, margin: 0 }}>{rfq.additionalDetails}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quote card */}
        {rfq.status === "QUOTED" && rfq.vendorResponse && (
          <div className="rd-quote-card">
            <p style={{ fontSize: 11, fontWeight: 800, color: "#166534", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 10px" }}>Vendor quotation</p>
            <p className="rd-quote-price">{rfq.vendorResponse.currency} {rfq.vendorResponse.price?.toLocaleString()}</p>
            {rfq.vendorResponse.message && <p className="rd-quote-msg">{rfq.vendorResponse.message}</p>}
            <div className="rd-quote-actions">
              <button onClick={() => updateQuote("accept")} disabled={updating} className="rd-accept-btn">
                {updating ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={15} />}
                Accept quote
              </button>
              <button onClick={() => updateQuote("reject")} disabled={updating} className="rd-reject-btn">
                <XCircle size={15} />Decline
              </button>
            </div>
          </div>
        )}

        {/* Accepted banner */}
        {rfq.status === "ACCEPTED" && (
          <div className="rd-accepted-banner">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            You accepted this quotation. Vendor contact details are now available below.
          </div>
        )}

        {/* Vendor contact */}
        {rfq.status === "ACCEPTED" && rfq.vendorContact && (
          <div className="rd-card">
            <p className="rd-card-title">Vendor contact</p>
            {rfq.vendorContact.phone && (
              <a href={`tel:${rfq.vendorContact.phone}`} className="rd-contact-row">
                <div className="rd-contact-icon"><Phone size={13} color="#6b7280" /></div>
                {rfq.vendorContact.phone}
              </a>
            )}
            {rfq.vendorContact.businessEmail && (
              <a href={`mailto:${rfq.vendorContact.businessEmail}`} className="rd-contact-row">
                <div className="rd-contact-icon"><Mail size={13} color="#6b7280" /></div>
                {rfq.vendorContact.businessEmail}
              </a>
            )}
            {rfq.vendorContact.phone && (
              <a href={`https://wa.me/${rfq.vendorContact.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rd-wa-btn">
                <FaWhatsapp size={16} />Chat on WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Pending waiting */}
        {rfq.status === "RFQ_REQUESTED" && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "14px 16px" }}>
            <Clock size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 500, margin: 0, lineHeight: 1.55 }}>Your RFQ is under review. Vendors will respond with a quotation shortly. You&apos;ll be notified when a quote arrives.</p>
          </div>
        )}
      </div>
    </>
  );
}
