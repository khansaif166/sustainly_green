"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";
import { Award, CheckCircle2, Clock, XCircle, ShieldCheck, PlusCircle } from "lucide-react";

type Certification = {
  id: string;
  certificationType?: string;
  status?: string;
  vendorId?: string;
};

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string; icon: any }> = {
  APPROVED: { label: "Approved", bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", icon: CheckCircle2 },
  PENDING:  { label: "Pending",  bg: "#fefce8", color: "#92400e", dot: "#f59e0b", icon: Clock       },
  REJECTED: { label: "Rejected", bg: "#fef2f2", color: "#991b1b", dot: "#ef4444", icon: XCircle     },
};

export default function VendorCertifications() {
  const router = useRouter();
  const [data,    setData]    = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const res = await fetch("/api/vendor/certifications", { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load certifications.");
        setData(payload.certifications || []);
      } catch (err) {
        console.error("Error loading certifications:", err);
        setError(err instanceof Error ? err.message : "Unable to load certifications.");
      } finally { setLoading(false); }
    }
    load();
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const approved = data.filter(c => c.status?.toUpperCase() === "APPROVED").length;
  const pending  = data.filter(c => c.status?.toUpperCase() === "PENDING").length;

  return (
    <>
      <style>{`
        .vc-page{display:flex;flex-direction:column;gap:20px;padding-bottom:40px;max-width:760px}
        .vc-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:24px 28px;position:relative;overflow:hidden}
        .vc-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 340px 220px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .vc-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .vc-hero-title{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.025em}
        .vc-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .vc-hero-stats{display:flex;gap:20px}
        .vc-hero-stat{text-align:right}
        .vc-hero-stat-val{font-size:28px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .vc-hero-stat-label{font-size:11px;color:rgba(255,255,255,.32);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .vc-pills{display:flex;gap:10px;flex-wrap:wrap}
        .vc-pill{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:50px;font-size:12.5px;font-weight:700;border:1px solid rgba(0,0,0,.07);background:#fff}

        .vc-list{display:flex;flex-direction:column;gap:12px}
        .vc-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:box-shadow .15s}
        .vc-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.08)}
        .vc-cert-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .vc-cert-name{font-size:13.5px;font-weight:800;color:#111;margin:0 0 5px}
        .vc-badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:3px 11px;border-radius:50px}

        .vc-empty{display:flex;flex-direction:column;align-items:center;gap:14px;padding:56px 24px;background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;text-align:center}
        .vc-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}
      `}</style>

      <div className="vc-page">

        {/* Hero */}
        <div className="vc-hero">
          <div className="vc-hero-inner">
            <div>
              <h1 className="vc-hero-title">My Certifications</h1>
              <p className="vc-hero-sub">Track your submitted sustainability credentials</p>
            </div>
            <div className="vc-hero-stats">
              <div className="vc-hero-stat">
                <p className="vc-hero-stat-val">{data.length}</p>
                <p className="vc-hero-stat-label">Total</p>
              </div>
              <div className="vc-hero-stat">
                <p className="vc-hero-stat-val">{approved}</p>
                <p className="vc-hero-stat-label">Approved</p>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="vc-err">{error}</div>}

        {/* Summary pills */}
        {data.length > 0 && (
          <div className="vc-pills">
            <span className="vc-pill">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ color: "#15803d" }}>{approved} Approved</span>
            </span>
            <span className="vc-pill">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} />
              <span style={{ color: "#92400e" }}>{pending} Pending</span>
            </span>
          </div>
        )}

        {/* Empty state */}
        {data.length === 0 && (
          <div className="vc-empty">
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={28} color="#16a34a" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>No certifications found</p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Add your sustainability certifications during onboarding or profile setup.</p>
            </div>
            <Link href="/vendor/profile" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#16a34a", color: "#fff", padding: "10px 20px", borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <PlusCircle size={14} />Add in Profile
            </Link>
          </div>
        )}

        {/* Certification list */}
        {data.length > 0 && (
          <div className="vc-list">
            {data.map(r => {
              const statusKey = (r.status || "").toUpperCase();
              const meta = STATUS_META[statusKey] || { label: r.status || "Unknown", bg: "#f9fafb", color: "#6b7280", dot: "#d1d5db", icon: ShieldCheck };
              const Icon = meta.icon;
              return (
                <div key={r.id} className="vc-card">
                  <div className="vc-cert-icon" style={{ background: meta.bg }}>
                    <ShieldCheck size={20} color={meta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="vc-cert-name">{r.certificationType || "Unnamed Certification"}</p>
                    <span className="vc-badge" style={{ background: meta.bg, color: meta.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot, flexShrink: 0 }} />
                      {meta.label}
                    </span>
                  </div>
                  <Icon size={18} color={meta.dot} style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
