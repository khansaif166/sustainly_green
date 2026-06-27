"use client";

import { useState } from "react";
import { X, Send, IndianRupee, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

export default function ReplyQuoteModal({ rfq, onClose, onSent }: {
  rfq: any; onClose: () => void; onSent: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({ price: "", currency: "INR", deliveryTimeline: "", message: "" });

  async function submit() {
    setError("");
    if (!form.price || !form.deliveryTimeline) { setError("Price and delivery timeline are required."); return; }
    setLoading(true);
    try {
      const session = getStoredSession();
      if (!session) { setError("Session expired. Please login again."); return; }
      const res = await fetch(`/api/vendor/rfqs/${rfq.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(form.price), currency: form.currency, deliveryTimeline: form.deliveryTimeline, message: form.message }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Failed to send quote.");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send quote.");
    } finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        .rqm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .rqm-modal{background:#fff;width:100%;max-width:580px;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.2);display:flex;flex-direction:column;max-height:92vh}
        .rqm-banner{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);padding:22px 24px;position:relative;overflow:hidden;flex-shrink:0}
        .rqm-banner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 300px 180px at 90% 50%,rgba(22,163,74,.2) 0%,transparent 60%);pointer-events:none}
        .rqm-banner-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .rqm-banner-title{font-size:17px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.02em}
        .rqm-banner-sub{font-size:12.5px;color:rgba(255,255,255,.45);margin:0}
        .rqm-close{width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s}
        .rqm-close:hover{background:rgba(255,255,255,.18)}

        .rqm-body{padding:22px 24px;display:flex;flex-direction:column;gap:18px;overflow-y:auto;flex:1}

        .rqm-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8faf9;border:1px solid rgba(0,0,0,.06);border-radius:14px;padding:14px 16px}
        .rqm-summary-item-label{font-size:10.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin:0 0 2px}
        .rqm-summary-item-val{font-size:13px;font-weight:600;color:#111;margin:0}

        .rqm-req{background:#f8faf9;border:1px solid rgba(0,0,0,.06);border-radius:14px;padding:14px 16px;font-size:13px;color:#374151;line-height:1.6}

        .rqm-section-label{font-size:11px;font-weight:800;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin:0 0 10px}
        .rqm-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .rqm-field{display:flex;flex-direction:column;gap:5px}
        .rqm-field-label{font-size:12px;font-weight:700;color:#374151}
        .rqm-field-wrap{position:relative}
        .rqm-field-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .rqm-input{width:100%;padding:10px 12px 10px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;transition:border .15s;background:#fff;box-sizing:border-box}
        .rqm-input:focus{border-color:#16a34a}
        .rqm-select{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;transition:border .15s;background:#fff;appearance:none;cursor:pointer}
        .rqm-select:focus{border-color:#16a34a}
        .rqm-textarea{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;transition:border .15s;background:#fff;resize:none;box-sizing:border-box}
        .rqm-textarea:focus{border-color:#16a34a}

        .rqm-notice{display:flex;gap:8px;align-items:flex-start;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:11px 13px}
        .rqm-err{display:flex;gap:8px;align-items:flex-start;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:11px 13px}

        .rqm-footer{padding:16px 24px;border-top:1px solid rgba(0,0,0,.06);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0}
        .rqm-cancel{padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;transition:all .15s}
        .rqm-cancel:hover{background:#f9fafb}
        .rqm-submit{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;transition:background .15s;box-shadow:0 4px 14px rgba(22,163,74,.3)}
        .rqm-submit:hover:not(:disabled){background:#15803d}
        .rqm-submit:disabled{opacity:.55;cursor:not-allowed}
        .rqm-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="rqm-overlay">
        <div className="rqm-modal">

          {/* Banner */}
          <div className="rqm-banner">
            <div className="rqm-banner-inner">
              <div>
                <h2 className="rqm-banner-title">Send Quotation</h2>
                <p className="rqm-banner-sub">RFQ: {rfq.requirementTitle}</p>
              </div>
              <button className="rqm-close" onClick={onClose}><X size={16} color="rgba(255,255,255,.7)" /></button>
            </div>
          </div>

          {/* Body */}
          <div className="rqm-body">

            {/* Buyer summary */}
            <div>
              <p className="rqm-section-label">Buyer Details</p>
              <div className="rqm-summary">
                {[
                  ["Buyer",             rfq.buyerName],
                  ["Delivery Location", rfq.deliveryCountry],
                  ["Quantity",          rfq.estimatedQuantity],
                  ["Timeline",          rfq.requiredTimeline?.replaceAll("_", " ")],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="rqm-summary-item-label">{label}</p>
                    <p className="rqm-summary-item-val">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirement */}
            {rfq.additionalDetails && (
              <div>
                <p className="rqm-section-label">Buyer Requirement</p>
                <div className="rqm-req">{rfq.additionalDetails}</div>
              </div>
            )}

            {/* Quote inputs */}
            <div>
              <p className="rqm-section-label">Your Quotation</p>
              <div className="rqm-fields">
                <div className="rqm-field">
                  <label className="rqm-field-label">Price *</label>
                  <div className="rqm-field-wrap">
                    <span className="rqm-field-icon"><IndianRupee size={13} color="#9ca3af" /></span>
                    <input className="rqm-input" placeholder="e.g. 125000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  </div>
                </div>
                <div className="rqm-field">
                  <label className="rqm-field-label">Currency</label>
                  <select className="rqm-select" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </div>
                <div className="rqm-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="rqm-field-label">Delivery Timeline *</label>
                  <div className="rqm-field-wrap">
                    <span className="rqm-field-icon"><Clock size={13} color="#9ca3af" /></span>
                    <input className="rqm-input" placeholder="e.g. 15–20 business days" value={form.deliveryTimeline} onChange={e => setForm({ ...form, deliveryTimeline: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="rqm-field">
              <label className="rqm-field-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <MessageSquare size={13} color="#9ca3af" />
                Message to Buyer <span style={{ color: "#9ca3af", fontWeight: 500 }}>(optional)</span>
              </label>
              <textarea className="rqm-textarea" rows={3} placeholder="Add any notes, terms, or special conditions…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>

            {/* Error */}
            {error && (
              <div className="rqm-err">
                <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: "#991b1b", margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Notice */}
            <div className="rqm-notice">
              <AlertCircle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                Buyer contact details are shared only after they accept your quote.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="rqm-footer">
            <button className="rqm-cancel" onClick={onClose}>Cancel</button>
            <button className="rqm-submit" onClick={submit} disabled={loading}>
              {loading ? <div className="rqm-spinner" /> : <Send size={14} />}
              {loading ? "Sending…" : "Send Quote"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
