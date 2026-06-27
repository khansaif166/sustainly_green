"use client";

import Link from "next/link";
import { Leaf, Clock, CheckCircle2, Mail, ArrowRight } from "lucide-react";

const STEPS = [
  { icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4", label: "Profile Submitted",     desc: "Your vendor profile has been received successfully." },
  { icon: Clock,        color: "#f59e0b", bg: "#fefce8", label: "Under Review",          desc: "Our team is verifying your business details and certifications." },
  { icon: Mail,         color: "#3b82f6", bg: "#eff6ff", label: "Approval Notification", desc: "You'll receive an email once your account is approved." },
];

export default function VendorPendingApprovalPage() {
  return (
    <>
      <style>{`
        .vpn-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:#f8faf9}
        .vpn-card{width:100%;max-width:500px;background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)}
        .vpn-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);padding:28px 28px 24px;position:relative;overflow:hidden;text-align:center}
        .vpn-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 280px 180px at 50% 100%,rgba(22,163,74,.2) 0%,transparent 60%);pointer-events:none}
        .vpn-hero-inner{position:relative;z-index:1}
        .vpn-logo{width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#16a34a,#15803d);display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
        .vpn-title{font-size:20px;font-weight:900;color:#fff;margin:0 0 6px;letter-spacing:-.025em}
        .vpn-sub{font-size:13px;color:rgba(255,255,255,.4);margin:0 0 16px}
        .vpn-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 16px;border-radius:50px;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.25)}
        .vpn-badge-dot{width:8px;height:8px;border-radius:50%;background:#f59e0b;animation:pulse 1.5s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .vpn-body{padding:24px 24px 28px;display:flex;flex-direction:column;gap:20px}
        .vpn-steps{display:flex;flex-direction:column;gap:0}
        .vpn-step{display:flex;align-items:flex-start;gap:14px;padding:14px 0;position:relative}
        .vpn-step:not(:last-child)::after{content:'';position:absolute;left:19px;top:46px;bottom:0;width:1.5px;background:rgba(0,0,0,.07)}
        .vpn-step-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .vpn-step-title{font-size:13px;font-weight:800;color:#111;margin:0 0 3px}
        .vpn-step-desc{font-size:12px;color:#6b7280;margin:0;line-height:1.5}
        .vpn-info{background:#fefce8;border:1px solid rgba(245,158,11,.2);border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:10px}
        .vpn-actions{display:flex;gap:10px;flex-wrap:wrap}
        .vpn-btn-outline{display:inline-flex;align-items:center;gap:6px;flex:1;justify-content:center;padding:10px 16px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;text-decoration:none;transition:background .15s}
        .vpn-btn-outline:hover{background:#f9fafb}
        .vpn-btn-primary{display:inline-flex;align-items:center;gap:6px;flex:1;justify-content:center;padding:10px 16px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;text-decoration:none;transition:background .15s;box-shadow:0 4px 12px rgba(22,163,74,.25)}
        .vpn-btn-primary:hover{background:#15803d}
        .vpn-footer{text-align:center;font-size:12px;color:#9ca3af}
      `}</style>

      <div className="vpn-wrap">
        <div className="vpn-card">

          {/* Hero */}
          <div className="vpn-hero">
            <div className="vpn-hero-inner">
              <div className="vpn-logo"><Leaf size={26} color="#fff" /></div>
              <h1 className="vpn-title">Profile Under Review</h1>
              <p className="vpn-sub">Thanks for completing your vendor onboarding.</p>
              <span className="vpn-badge">
                <span className="vpn-badge-dot" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>Status: Pending Approval</span>
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="vpn-body">

            {/* Steps */}
            <div className="vpn-steps">
              {STEPS.map(({ icon: Icon, color, bg, label, desc }, i) => (
                <div key={i} className="vpn-step">
                  <div className="vpn-step-icon" style={{ background: bg }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <p className="vpn-step-title">{label}</p>
                    <p className="vpn-step-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="vpn-info">
              <Clock size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: "#92400e", margin: 0, fontWeight: 600 }}>
                Typical review time: <span style={{ color: "#374151" }}>24–48 business hours</span>
              </p>
            </div>

            {/* Actions */}
            <div className="vpn-actions">
              <Link href="/vendor/profile" className="vpn-btn-outline">View Profile</Link>
              <Link href="/" className="vpn-btn-primary">Go to Home <ArrowRight size={13} /></Link>
            </div>

            <p className="vpn-footer">
              Questions? Email <span style={{ color: "#374151", fontWeight: 600 }}>support@sustainlygreen.com</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
