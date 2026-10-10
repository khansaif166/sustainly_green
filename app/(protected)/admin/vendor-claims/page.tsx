"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, ShieldQuestion, XCircle } from "lucide-react";
import { getValidSession } from "@/lib/supabaseAuth";
import { readApiJson } from "@/lib/clientApiResponse";

type Claim = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  reviewedAt: string | null;
  reviewNotes: string;
  requester: { name: string; email: string; phone: string; designation: string };
  companyEmail: string;
  companyWebsite: string;
  message: string;
  proofType: string;
  proofDetails: string;
  vendor: { id: string; companyName: string; location: string; claimStatus: string; owned: boolean } | null;
  claimant: { id: string; email: string; name: string; role: string } | null;
};

const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
type Tab = (typeof TABS)[number];

const STATUS_META: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fffbeb", color: "#b45309" },
  APPROVED: { bg: "#f0fdf4", color: "#16a34a" },
  REJECTED: { bg: "#fef2f2", color: "#dc2626" },
  CANCELLED: { bg: "#f3f4f6", color: "#6b7280" },
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminVendorClaims() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const load = useCallback(async (status: Tab) => {
    setLoading(true);
    setLoadError("");
    try {
      const session = await getValidSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");
      const res = await fetch(`/api/admin/vendor-claims?status=${status}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const payload = await readApiJson<{ claims: Claim[] }>(res, "Unable to load vendor claims.");
      setClaims(payload.claims);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load vendor claims.");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  async function review(claim: Claim, action: "approve" | "reject") {
    const company = claim.vendor?.companyName || "this business";
    const confirmText =
      action === "approve"
        ? `Approve ${claim.requester.name}'s claim to ${company}?\n\nTheir account (${claim.claimant?.email}) becomes the owner of this listing and is switched to an approved vendor account.`
        : `Reject ${claim.requester.name}'s claim to ${company}?`;
    if (!window.confirm(confirmText)) return;

    setBusyId(claim.id);
    setActionError((prev) => ({ ...prev, [claim.id]: "" }));
    try {
      const session = await getValidSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");
      const res = await fetch(`/api/admin/vendor-claims/${claim.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes[claim.id] || "" }),
      });
      await readApiJson(res, "Unable to update this claim.");
      await load(tab);
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [claim.id]: err instanceof Error ? err.message : "Unable to update this claim.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <style>{`
        .vc-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .vc-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .vc-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .vc-hero-title{position:relative;font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .vc-hero-sub{position:relative;font-size:13px;color:rgba(255,255,255,.45);margin:0}
        .vc-tabs{display:flex;gap:8px;flex-wrap:wrap}
        .vc-tab{padding:8px 16px;border-radius:50px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;background:#fff;color:#4b5563}
        .vc-tab.active{background:#0f2318;color:#fff}
        .vc-card{background:#fff;border-radius:20px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:14px}
        .vc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
        .vc-company{font-size:16px;font-weight:800;color:#111;margin:0;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
        .vc-company:hover{color:#16a34a}
        .vc-muted{font-size:12px;color:#6b7280;margin:2px 0 0}
        .vc-badge{display:inline-flex;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700}
        .vc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
        .vc-box{background:#fafafa;border-radius:14px;padding:12px 14px}
        .vc-label{font-size:10.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px}
        .vc-line{font-size:13px;color:#374151;margin:0 0 3px;word-break:break-word}
        .vc-line strong{color:#111}
        .vc-warn{font-size:12.5px;color:#b45309;background:#fffbeb;border-radius:12px;padding:9px 12px}
        .vc-error{font-size:12.5px;color:#dc2626;background:#fef2f2;border-radius:12px;padding:9px 12px}
        .vc-notes{width:100%;min-height:60px;border-radius:12px;padding:9px 12px;font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box}
        .vc-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
        .vc-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
        .vc-btn:disabled{opacity:.5;cursor:not-allowed}
        .vc-empty{background:#fff;border-radius:20px;padding:40px 20px;text-align:center;color:#9ca3af;font-size:13.5px}
      `}</style>

      <div className="vc-page">
        <div className="vc-hero">
          <h1 className="vc-hero-title">Business claims</h1>
          <p className="vc-hero-sub">
            Requests from owners to take over an imported listing. Check the proof before approving.
          </p>
        </div>

        <div className="vc-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`vc-tab${tab === t ? " active" : ""}`}
              // Inline border: globals.css strips borders from all buttons.
              style={{ border: "1px solid rgba(0,0,0,.1)" }}
              onClick={() => setTab(t)}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loadError && <div className="vc-error" role="alert">{loadError}</div>}

        {loading ? (
          <div className="vc-empty">Loading claims…</div>
        ) : claims.length === 0 ? (
          <div className="vc-empty">No {tab === "ALL" ? "" : tab.toLowerCase()} claims.</div>
        ) : (
          claims.map((claim) => {
            const meta = STATUS_META[claim.status] || STATUS_META.CANCELLED;
            const pending = claim.status === "PENDING";
            const cannotApprove = !claim.claimant
              ? "This claim isn't linked to an account, so it can't be approved. Reject it and ask the requester to sign in and claim again."
              : claim.vendor?.owned
                ? "This listing already has an owner."
                : claim.claimant.role === "ADMIN"
                  ? "The requester is an admin account."
                  : "";
            return (
              <div key={claim.id} className="vc-card">
                <div className="vc-head">
                  <div>
                    {claim.vendor ? (
                      <Link href={`/find-vendors/${claim.vendor.id}`} target="_blank" className="vc-company">
                        {claim.vendor.companyName}
                        <ExternalLink size={13} />
                      </Link>
                    ) : (
                      <p className="vc-company">Listing removed</p>
                    )}
                    <p className="vc-muted">
                      {[claim.vendor?.location, `Submitted ${formatDate(claim.createdAt)}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="vc-badge" style={{ background: meta.bg, color: meta.color }}>
                    {claim.status}
                  </span>
                </div>

                <div className="vc-grid">
                  <div className="vc-box">
                    <p className="vc-label">Requester</p>
                    <p className="vc-line"><strong>{claim.requester.name}</strong>{claim.requester.designation && ` · ${claim.requester.designation}`}</p>
                    <p className="vc-line">{claim.requester.email}</p>
                    {claim.requester.phone && <p className="vc-line">{claim.requester.phone}</p>}
                  </div>
                  <div className="vc-box">
                    <p className="vc-label">Linked account</p>
                    {claim.claimant ? (
                      <>
                        <p className="vc-line"><strong>{claim.claimant.email}</strong></p>
                        <p className="vc-line">Current role: {claim.claimant.role}</p>
                      </>
                    ) : (
                      <p className="vc-line">None</p>
                    )}
                  </div>
                  <div className="vc-box">
                    <p className="vc-label">Proof</p>
                    <p className="vc-line"><strong>{claim.proofType || "Not given"}</strong></p>
                    {claim.proofDetails && <p className="vc-line">{claim.proofDetails}</p>}
                    {claim.companyEmail && <p className="vc-line">Company email: {claim.companyEmail}</p>}
                    {claim.companyWebsite && <p className="vc-line">Website: {claim.companyWebsite}</p>}
                  </div>
                </div>

                {claim.message && (
                  <div className="vc-box">
                    <p className="vc-label">Message</p>
                    <p className="vc-line">{claim.message}</p>
                  </div>
                )}

                {!pending && (claim.reviewNotes || claim.reviewedAt) && (
                  <p className="vc-muted">
                    Reviewed {formatDate(claim.reviewedAt)}{claim.reviewNotes && ` · ${claim.reviewNotes}`}
                  </p>
                )}

                {pending && (
                  <>
                    {cannotApprove && <div className="vc-warn">{cannotApprove}</div>}
                    <textarea
                      className="vc-notes"
                      style={{ border: "1.5px solid rgba(0,0,0,.1)" }}
                      placeholder="Review notes (optional, saved with the decision)"
                      value={notes[claim.id] || ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                    />
                    {actionError[claim.id] && <div className="vc-error" role="alert">{actionError[claim.id]}</div>}
                    <div className="vc-actions">
                      <button
                        className="vc-btn"
                        style={{ background: "#fff", color: "#dc2626", border: "1.5px solid rgba(220,38,38,.25)" }}
                        disabled={busyId !== null}
                        onClick={() => review(claim, "reject")}
                      >
                        <XCircle size={14} />Reject
                      </button>
                      <button
                        className="vc-btn"
                        style={{ background: "#16a34a", color: "#fff", border: "1.5px solid #16a34a" }}
                        disabled={busyId !== null || Boolean(cannotApprove)}
                        onClick={() => review(claim, "approve")}
                      >
                        <CheckCircle2 size={14} />
                        {busyId === claim.id ? "Saving…" : "Approve & transfer ownership"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}

        {!loading && tab === "PENDING" && claims.length === 0 && !loadError && (
          <p className="vc-muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldQuestion size={14} />New claims appear here as soon as an owner submits one from a listing page.
          </p>
        )}
      </div>
    </>
  );
}
