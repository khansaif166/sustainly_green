"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import {
  fetchApprovedProducts,
  fetchApprovedVendorById,
  submitVendorClaim,
  type PublicVendor,
} from "@/lib/supabasePublic";
import { getValidSession } from "@/lib/supabaseAuth";
import {
  FiMapPin, FiMail, FiGlobe, FiArrowLeft, FiPackage,
  FiCheckCircle, FiClock, FiAlertCircle, FiExternalLink, FiX,
  FiAward, FiShield, FiUser, FiPhone, FiBriefcase, FiLink, FiFileText, FiLock,
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";

type Vendor = PublicVendor;
type Product = { id: string; title: string; images?: string[]; priceType?: string; ecoScore?: number; };
type VendorDisplayFields = Vendor & {
  category?: string;
  ecoTier?: string;
  website?: string;
  ecoScore?: number;
  GreenLensScore?: number;
};

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = Array.isArray(params.vendorId) ? params.vendorId[0] : params.vendorId;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimLoginOpen, setClaimLoginOpen] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimForm, setClaimForm] = useState({
    requesterName: "", requesterEmail: "", requesterPhone: "",
    requesterDesignation: "", companyEmail: "", companyWebsite: "",
    proofType: "GST", proofDetails: "", message: "",
  });

  const set = (k: keyof typeof claimForm, v: string) => setClaimForm(f => ({ ...f, [k]: v }));

  async function openClaimFlow() {
    const session = await getValidSession();
    setClaimError("");

    if (!session?.accessToken) {
      setClaimLoginOpen(true);
      return;
    }

    setClaimOpen(true);
  }

  const loadVendor = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const v = await fetchApprovedVendorById(vendorId);
      if (!v) { setVendor(null); return; }
      setVendor(v);
      setProducts(await fetchApprovedProducts({ vendorId: v.id, limit: 24 }));
    } catch (e) { console.error(e); setVendor(null); }
    finally { setLoading(false); }
  };

  const handleClaim = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendor) return;
    const session = await getValidSession();

    if (!session?.accessToken) {
      setClaimOpen(false);
      setClaimLoginOpen(true);
      return;
    }

    setClaimSubmitting(true); setClaimError("");
    try {
      await submitVendorClaim({ vendorId: vendor.id, ...claimForm, profileId: session?.user?.id, accessToken: session?.accessToken });
      setClaimSuccess(true); setClaimOpen(false);
      await loadVendor();
    } catch { setClaimError("We could not submit this claim. It may already be under review."); }
    finally { setClaimSubmitting(false); }
  };

  useEffect(() => { loadVendor(); }, [vendorId]);

  /* ── loading / not found ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
      <FiPackage size={40} style={{ opacity: .3 }} />
      <p className="font-medium">Vendor not found</p>
      <Link href="/browse?type=Vendor" className="text-green-600 text-sm font-semibold hover:underline">← Back to vendors</Link>
    </div>
  );

  const companyName = (vendor.companyName || "").replace(/^\/+/, "").trim() || "Vendor";
  const displayVendor = vendor as VendorDisplayFields;
  const initials = companyName.slice(0, 2).toUpperCase();
  const certs = (vendor.certifications || []) as string[];

  return (
    <>
      <style>{`
        /* ── VENDOR PROFILE DESIGN ── */
        .vp-page { min-height: 100vh; background: #f5f6f4; }

        /* ── HERO ── */
        .vp-hero {
          background: linear-gradient(145deg, #0a1a10 0%, #0f2318 50%, #0c1e13 100%);
          position: relative; overflow: hidden;
        }
        .vp-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 700px 400px at 80% 50%, rgba(22,163,74,0.14) 0%, transparent 65%),
                      radial-gradient(ellipse 350px 250px at 15% 60%, rgba(29,185,84,0.07) 0%, transparent 55%);
          pointer-events: none;
        }
        .vp-hero-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 32px 24px 36px;
          position: relative; z-index: 1;
        }
        .vp-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 500;
          text-decoration: none; margin-bottom: 28px; transition: color .18s;
        }
        .vp-back:hover { color: rgba(255,255,255,0.85); }

        .vp-hero-card {
          display: flex; gap: 24px; align-items: flex-start;
          flex-wrap: wrap;
        }
        .vp-logo-wrap {
          width: 88px; height: 88px; border-radius: 20px; flex-shrink: 0;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff; font-size: 26px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 3px solid rgba(255,255,255,0.12); overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .vp-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .vp-hero-info { flex: 1; min-width: 0; }
        .vp-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .vp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 50px;
          letter-spacing: .04em;
        }
        .vp-badge-amber { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
        .vp-badge-blue  { background: rgba(96,165,250,0.15); color: #60a5fa; border: 1px solid rgba(96,165,250,0.2); }
        .vp-badge-green { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .vp-badge-purple { background: rgba(167,139,250,0.15); color: #a78bfa; border: 1px solid rgba(167,139,250,0.2); }

        .vp-hero-name {
          font-size: clamp(22px, 3vw, 32px); font-weight: 800; color: #fff;
          letter-spacing: -.03em; line-height: 1.15; margin: 0 0 8px;
        }
        .vp-hero-meta {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .vp-hero-meta-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 500;
        }
        .vp-hero-desc {
          font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.65;
          max-width: 560px; margin: 0;
        }
        .vp-hero-cta { flex-shrink: 0; padding-top: 4px; }
        .vp-claim-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #16a34a; color: #fff;
          padding: 11px 22px; border-radius: 50px;
          font-size: 14px; font-weight: 700; border: none; cursor: pointer;
          font-family: inherit; transition: background .18s, transform .15s;
          box-shadow: 0 4px 20px rgba(22,163,74,0.4);
        }
        .vp-claim-btn:hover { background: #15803d; transform: translateY(-1px); }
        .vp-claim-btn-disabled {
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4);
          padding: 11px 22px; border-radius: 50px;
          font-size: 14px; font-weight: 700; border: none;
          font-family: inherit; cursor: default;
        }

        /* stats bar */
        .vp-stats-bar {
          display: flex; gap: 0;
          border-top: 1px solid rgba(255,255,255,0.07);
          margin-top: 28px; padding-top: 20px;
          flex-wrap: wrap;
        }
        .vp-stat {
          flex: 1; min-width: 100px;
          padding: 0 20px 0 0;
          border-right: 1px solid rgba(255,255,255,0.07);
          margin-right: 20px;
        }
        .vp-stat:last-child { border-right: none; margin-right: 0; }
        .vp-stat-val { font-size: 22px; font-weight: 800; color: #fff; line-height: 1; }
        .vp-stat-lbl { font-size: 11.5px; color: rgba(255,255,255,0.4); margin-top: 3px; font-weight: 500; }

        /* ── BODY ── */
        .vp-body { max-width: 1100px; margin: 0 auto; padding: 32px 24px 72px; display: flex; gap: 24px; align-items: flex-start; }
        .vp-sidebar { width: 272px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .vp-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 24px; }

        @media (max-width: 860px) {
          .vp-body { flex-direction: column; }
          .vp-sidebar { width: 100%; }
        }

        /* cards */
        .vp-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 20px; padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }
        .vp-card-title {
          font-size: 11px; font-weight: 700; color: #9ca3af;
          letter-spacing: .06em; text-transform: uppercase;
          margin: 0 0 14px;
        }

        /* contact rows */
        .vp-contact-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);
          font-size: 13px; color: #374151; font-weight: 500;
          text-decoration: none; transition: color .15s;
        }
        .vp-contact-row:last-child { border-bottom: none; }
        .vp-contact-row:hover { color: #16a34a; }
        .vp-contact-icon { color: #9ca3af; flex-shrink: 0; }

        /* cert pills */
        .vp-certs { display: flex; flex-wrap: wrap; gap: 6px; }
        .vp-cert {
          display: inline-flex; align-items: center; gap: 4px;
          background: #f0fdf4; color: #15803d;
          border: 1px solid #bbf7d0;
          font-size: 11.5px; font-weight: 600;
          padding: 4px 10px; border-radius: 50px;
        }

        /* products grid */
        .vp-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .vp-prod-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px; overflow: hidden; text-decoration: none;
          transition: box-shadow .2s, transform .2s; display: flex; flex-direction: column;
        }
        .vp-prod-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .vp-prod-img {
          height: 160px;
          background: linear-gradient(135deg, #f0f9f4, #e8f5ec);
          overflow: hidden; position: relative;
        }
        .vp-prod-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
        .vp-prod-card:hover .vp-prod-img img { transform: scale(1.06); }
        .vp-prod-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #c4b5c0; }
        .vp-prod-body { padding: 12px 14px 14px; flex: 1; }
        .vp-prod-title { font-size: 13px; font-weight: 700; color: #111; margin: 0 0 5px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .vp-prod-price { font-size: 12px; color: #9ca3af; font-weight: 500; }
        .vp-prod-eco {
          display: inline-flex; align-items: center; gap: 3px;
          background: rgba(22,163,74,0.1); color: #15803d;
          font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 50px;
          margin-top: 6px;
        }

        /* empty */
        .vp-empty {
          text-align: center; padding: 56px 24px;
          background: #fff; border: 1px dashed rgba(0,0,0,0.1); border-radius: 20px; color: #9ca3af;
        }
        .vp-empty h3 { font-size: 16px; font-weight: 700; color: #374151; margin: 12px 0 6px; }
        .vp-empty p { font-size: 13px; margin: 0; }

        /* success banner */
        .vp-success {
          display: flex; align-items: center; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 12px; padding: 12px 16px;
          font-size: 13px; color: #15803d; font-weight: 500;
        }

        /* unclaimed notice */
        .vp-unclaimed-notice {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 14px; padding: 14px 16px;
          font-size: 13px; color: #92400e; line-height: 1.55;
        }

        /* ── CLAIM MODAL ── */
        .vp-modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(5,15,10,0.7); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .vp-modal {
          width: 100%; max-width: 680px; max-height: 92vh;
          overflow: hidden; background: #fff; border-radius: 24px;
          box-shadow: 0 32px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06);
          display: flex; flex-direction: column;
        }
        /* modal top banner */
        .vp-modal-banner {
          background: linear-gradient(135deg, #0a1a10 0%, #0f2318 100%);
          border-radius: 24px 24px 0 0; padding: 18px 24px 16px;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
          position: relative; overflow: hidden;
          flex-shrink: 0;
        }
        .vp-modal-banner::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 300px 200px at 90% 60%, rgba(22,163,74,0.18) 0%, transparent 60%);
          pointer-events: none;
        }
        .vp-modal-banner-left { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; min-width: 0; flex: 1; }
        .vp-modal-avatar {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff; font-size: 15px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(255,255,255,0.12);
        }
        .vp-modal-banner-copy { min-width: 0; padding-top: 1px; }
        .vp-modal-banner-title {
          font-size: 17px; font-weight: 850; color: #fff; margin: 0 0 4px;
          line-height: 1.2; overflow-wrap: anywhere;
        }
        .vp-modal-banner-sub {
          font-size: 12.5px; color: rgba(255,255,255,0.55); margin: 0;
          line-height: 1.35; overflow-wrap: anywhere;
        }
        .vp-modal-close {
          width: 36px; height: 36px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.1); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.6); flex-shrink: 0; transition: background .15s;
          position: relative; z-index: 1;
          margin-top: 2px;
        }
        .vp-modal-close:hover { background: rgba(255,255,255,0.18); color: #fff; }

        /* modal body */
        .vp-login-modal {
          max-width: 440px;
          padding: 26px;
          gap: 18px;
          position: relative;
        }
        .vp-login-head {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .vp-login-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #f0fdf4;
          color: #15803d;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .vp-login-title {
          margin: 0 0 6px;
          color: #111827;
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -.02em;
          line-height: 1.2;
        }
        .vp-login-copy {
          margin: 0;
          color: #6b7280;
          font-size: 13.5px;
          line-height: 1.6;
        }
        .vp-login-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .vp-login-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 42px;
          padding: 0 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          border: 1px solid rgba(0,0,0,0.1);
          font-family: inherit;
          cursor: pointer;
        }
        .vp-login-btn-primary {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
          box-shadow: 0 8px 22px rgba(22,163,74,.22);
        }
        .vp-login-btn-secondary {
          background: #fff;
          color: #374151;
        }
        .vp-login-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .vp-login-close:hover { background: #e5e7eb; color: #111827; }
        .vp-claim-form { display: flex; flex-direction: column; min-height: 0; flex: 1; }
        .vp-modal-body {
          padding: 22px 24px;
          display: flex; flex-direction: column; gap: 18px;
          overflow-y: auto;
          min-height: 0;
        }

        /* section divider */
        .vp-section-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 800; color: #9ca3af;
          letter-spacing: .08em; text-transform: uppercase;
          margin-bottom: 12px;
        }
        .vp-section-label::after { content: ''; flex: 1; height: 1px; background: #f0f0f0; }

        .vp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 620px) { .vp-form-grid { grid-template-columns: 1fr; } }
        .vp-form-full { grid-column: 1 / -1; }

        /* input with icon */
        .vp-field-wrap { display: flex; flex-direction: column; gap: 5px; }
        .vp-field-lbl { font-size: 12px; font-weight: 700; color: #374151; display: flex; align-items: center; gap: 4px; }
        .vp-field-lbl span { color: #16a34a; }
        .vp-input-wrap { position: relative; }
        .vp-input-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .vp-textarea-icon { position: absolute; left: 11px; top: 11px; color: #9ca3af; pointer-events: none; }
        .vp-form-in {
          width: 100%; padding: 10px 12px 10px 36px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 13px; font-family: inherit; outline: none; color: #111;
          background: #fafafa; transition: border-color .15s, background .15s;
          box-sizing: border-box;
        }
        .vp-form-in:focus { border-color: #16a34a; background: #fff; box-shadow: 0 0 0 3px rgba(22,163,74,0.08); }
        .vp-form-in::placeholder { color: #c4cad3; }
        .vp-form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; }
        .vp-form-in-noicon { padding-left: 12px; }
        .vp-form-textarea { padding: 10px 12px 10px 36px; min-height: 88px; resize: vertical; vertical-align: top; line-height: 1.5; }

        /* proof callout */
        .vp-proof-callout {
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
          padding: 12px 14px; font-size: 12.5px; color: #166534; line-height: 1.55;
          display: flex; gap: 8px; align-items: flex-start;
        }

        /* footer */
        .vp-modal-footer {
          padding: 16px 24px 20px;
          border-top: 1px solid #f3f4f6;
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          flex-shrink: 0;
        }
        .vp-form-note { font-size: 11px; color: #b0b8c4; max-width: 280px; line-height: 1.5; display: flex; align-items: flex-start; gap: 5px; }
        .vp-submit-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #16a34a; color: #fff; padding: 11px 26px;
          border-radius: 50px; font-size: 14px; font-weight: 700;
          border: none; cursor: pointer; font-family: inherit;
          transition: background .18s, transform .12s;
          white-space: nowrap; box-shadow: 0 4px 16px rgba(22,163,74,0.3);
        }
        .vp-submit-btn:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
        .vp-submit-btn:disabled { background: #d1d5db; cursor: not-allowed; box-shadow: none; }
        .vp-form-err {
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
          padding: 10px 14px; font-size: 13px; color: #991b1b;
          display: flex; align-items: center; gap: 6px; margin: 0 24px 12px;
        }
        @media (max-width: 640px) {
          .vp-modal-overlay { align-items: flex-end; padding: 10px; }
          .vp-modal { max-height: 94vh; border-radius: 20px; }
          .vp-modal-banner { border-radius: 20px 20px 0 0; padding: 16px; gap: 12px; }
          .vp-modal-avatar { width: 42px; height: 42px; border-radius: 12px; font-size: 14px; }
          .vp-modal-banner-title { font-size: 15px; }
          .vp-modal-banner-sub { font-size: 11.5px; }
          .vp-modal-body { padding: 18px 16px; }
          .vp-modal-footer { padding: 14px 16px 16px; }
          .vp-submit-btn { width: 100%; justify-content: center; }
          .vp-form-note { max-width: none; }
          .vp-form-err { margin: 0 16px 12px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="vp-page">
        <Header />

        {/* ── HERO ── */}
        <div className="vp-hero">
          <div className="vp-hero-inner">
            <Link href="/browse?type=Vendor" className="vp-back">
              <FiArrowLeft size={13} />Back to vendors
            </Link>

            <div className="vp-hero-card">
              {/* Logo */}
              <div className="vp-logo-wrap">
                {vendor.logoUrl
                  ? <img src={vendor.logoUrl} alt={companyName} />
                  : initials}
              </div>

              {/* Info */}
              <div className="vp-hero-info">
                <div className="vp-hero-badges">
                  {vendor.isUnclaimed && <span className="vp-badge vp-badge-amber"><FiAlertCircle size={10} />Unclaimed listing</span>}
                  {vendor.isClaimRequested && <span className="vp-badge vp-badge-blue"><FiClock size={10} />Claim under review</span>}
                  {vendor.isClaimed && <span className="vp-badge vp-badge-green"><FiCheckCircle size={10} />Verified business</span>}
                  {displayVendor.ecoTier && <span className="vp-badge vp-badge-purple"><HiOutlineSparkles size={10} />{displayVendor.ecoTier}</span>}
                </div>

                <h1 className="vp-hero-name">{companyName}</h1>

                <div className="vp-hero-meta">
                  {vendor.location && <span className="vp-hero-meta-item"><FiMapPin size={12} />{vendor.location}</span>}
                  {displayVendor.category && <span className="vp-hero-meta-item"><FiAward size={12} />{displayVendor.category}</span>}
                  {vendor.email && <span className="vp-hero-meta-item"><FiMail size={12} />{vendor.email}</span>}
                </div>

                {vendor.description && (
                  <p className="vp-hero-desc">{String(vendor.description).replace(/<[^>]+>/g, "").slice(0, 180)}{String(vendor.description).length > 180 ? "…" : ""}</p>
                )}
              </div>

              {/* CTA */}
              <div className="vp-hero-cta">
                {vendor.isUnclaimed && (
                  <button className="vp-claim-btn" onClick={openClaimFlow}>
                    <FiShield size={14} />Claim this business
                  </button>
                )}
                {vendor.isClaimRequested && (
                  <span className="vp-claim-btn-disabled"><FiClock size={14} />Claim under review</span>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <div className="vp-stats-bar">
              <div className="vp-stat">
                <div className="vp-stat-val">{products.length}</div>
                <div className="vp-stat-lbl">Products listed</div>
              </div>
              {typeof displayVendor.ecoScore === "number" && (
                <div className="vp-stat">
                  <div className="vp-stat-val">{displayVendor.ecoScore}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/100</span></div>
                  <div className="vp-stat-lbl">Eco Score</div>
                </div>
              )}
              {certs.length > 0 && (
                <div className="vp-stat">
                  <div className="vp-stat-val">{certs.length}</div>
                  <div className="vp-stat-lbl">Certifications</div>
                </div>
              )}
              {typeof displayVendor.GreenLensScore === "number" && (
                <div className="vp-stat">
                  <div className="vp-stat-val">{displayVendor.GreenLensScore}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/5</span></div>
                  <div className="vp-stat-lbl">Green Lens Score</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="vp-body">

          {/* Sidebar */}
          <aside className="vp-sidebar">

            {/* Contact */}
            {(vendor.email || displayVendor.website || vendor.location) && (
              <div className="vp-card">
                <p className="vp-card-title">Contact & Info</p>
                {vendor.location && (
                  <span className="vp-contact-row">
                    <FiMapPin size={14} className="vp-contact-icon" />{vendor.location}
                  </span>
                )}
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} className="vp-contact-row">
                    <FiMail size={14} className="vp-contact-icon" />{vendor.email}
                  </a>
                )}
                {displayVendor.website && (
                  <a href={displayVendor.website} target="_blank" rel="noopener noreferrer" className="vp-contact-row">
                    <FiGlobe size={14} className="vp-contact-icon" />Website <FiExternalLink size={11} style={{ marginLeft: "auto", opacity: .5 }} />
                  </a>
                )}
              </div>
            )}

            {/* Certifications */}
            {certs.length > 0 && (
              <div className="vp-card">
                <p className="vp-card-title">Certifications</p>
                <div className="vp-certs">
                  {certs.map((c, i) => (
                    <span key={i} className="vp-cert"><FiCheckCircle size={10} />{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Unclaimed notice */}
            {vendor.isUnclaimed && (
              <div className="vp-unclaimed-notice">
                <FiAlertCircle size={15} style={{ flexShrink: 0, marginTop: 1, color: "#d97706" }} />
                This listing is publicly visible but hasn&apos;t been claimed yet. The business owner can claim it after Sustainly verifies ownership.
              </div>
            )}

            {claimSuccess && (
              <div className="vp-success">
                <FiCheckCircle size={16} />
                Claim submitted. Our team will review the proof before granting access.
              </div>
            )}
          </aside>

          {/* Main */}
          <main className="vp-main">

            {/* Full description */}
            {vendor.description && String(vendor.description).length > 180 && (
              <div className="vp-card">
                <p className="vp-card-title">About</p>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{String(vendor.description).replace(/<[^>]+>/g, "")}</p>
              </div>
            )}

            {/* Products */}
            <div className="vp-card" style={{ padding: 0 }}>
              <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="vp-card-title" style={{ margin: 0 }}>Products from this vendor</p>
                {products.length > 0 && <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0", fontWeight: 500 }}>{products.length} listing{products.length !== 1 ? "s" : ""}</p>}
              </div>
              <div style={{ padding: 20 }}>
                {products.length === 0 ? (
                  <div className="vp-empty">
                    <FiPackage size={36} style={{ opacity: .25, margin: "0 auto" }} />
                    <h3>No products yet</h3>
                    <p>This vendor hasn&apos;t listed any products yet.</p>
                  </div>
                ) : (
                  <div className="vp-products-grid">
                    {products.map(p => (
                      <Link key={p.id} href={`/products/${p.id}`} className="vp-prod-card">
                        <div className="vp-prod-img">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.title} />
                            : <div className="vp-prod-ph"><FiPackage size={26} /></div>}
                        </div>
                        <div className="vp-prod-body">
                          <h3 className="vp-prod-title">{p.title}</h3>
                          <p className="vp-prod-price">{p.priceType || "Price on request"}</p>
                          {p.ecoScore && <span className="vp-prod-eco"><HiOutlineSparkles size={10} />Eco {p.ecoScore}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {claimLoginOpen && vendor.isUnclaimed && (
          <div className="vp-modal-overlay" onClick={e => e.target === e.currentTarget && setClaimLoginOpen(false)}>
            <div className="vp-modal vp-login-modal" role="dialog" aria-modal="true" aria-label="Login required">
              <button className="vp-login-close" onClick={() => setClaimLoginOpen(false)} aria-label="Close login prompt">
                <FiX size={14} />
              </button>
              <div className="vp-login-head">
                <div className="vp-login-icon">
                  <FiLock size={20} />
                </div>
                <div>
                  <h2 className="vp-login-title">Login required</h2>
                  <p className="vp-login-copy">
                    Please login first to claim this business. We need an account so Sustainly can verify ownership and track the claim request.
                  </p>
                </div>
              </div>
              <div className="vp-login-actions">
                <Link href="/login" className="vp-login-btn vp-login-btn-primary">
                  <FiUser size={14} />Login
                </Link>
                <Link href="/register?role=VENDOR" className="vp-login-btn vp-login-btn-secondary">
                  Create vendor account
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── CLAIM MODAL ── */}
        {claimOpen && vendor.isUnclaimed && (
          <div className="vp-modal-overlay" onClick={e => e.target === e.currentTarget && setClaimOpen(false)}>
            <div className="vp-modal">

              {/* Banner header */}
              <div className="vp-modal-banner">
                <div className="vp-modal-banner-left">
                  <div className="vp-modal-avatar">{initials}</div>
                  <div className="vp-modal-banner-copy">
                    <p className="vp-modal-banner-title">Claim this business</p>
                    <p className="vp-modal-banner-sub">{companyName} · Ownership verification required</p>
                  </div>
                </div>
                <button className="vp-modal-close" onClick={() => setClaimOpen(false)}><FiX size={13} /></button>
              </div>

              <form onSubmit={handleClaim} className="vp-claim-form">
                <div className="vp-modal-body">

                  {/* Section 1 — Your details */}
                  <div>
                    <p className="vp-section-label"><FiUser size={11} />Your details</p>
                    <div className="vp-form-grid">
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">Full name <span>*</span></label>
                        <div className="vp-input-wrap">
                          <FiUser size={13} className="vp-input-icon" />
                          <input required className="vp-form-in" placeholder="Rahul Sharma" value={claimForm.requesterName} onChange={e => set("requesterName", e.target.value)} />
                        </div>
                      </div>
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">Work email <span>*</span></label>
                        <div className="vp-input-wrap">
                          <FiMail size={13} className="vp-input-icon" />
                          <input required type="email" className="vp-form-in" placeholder="rahul@company.com" value={claimForm.requesterEmail} onChange={e => set("requesterEmail", e.target.value)} />
                        </div>
                      </div>
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">Phone</label>
                        <div className="vp-input-wrap">
                          <FiPhone size={13} className="vp-input-icon" />
                          <input className="vp-form-in" placeholder="+91 98765 43210" value={claimForm.requesterPhone} onChange={e => set("requesterPhone", e.target.value)} />
                        </div>
                      </div>
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">Designation / Role</label>
                        <div className="vp-input-wrap">
                          <FiBriefcase size={13} className="vp-input-icon" />
                          <input className="vp-form-in" placeholder="Director, Founder, Manager…" value={claimForm.requesterDesignation} onChange={e => set("requesterDesignation", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 — Company info */}
                  <div>
                    <p className="vp-section-label"><FiBriefcase size={11} />Company info</p>
                    <div className="vp-form-grid">
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">Official company email</label>
                        <div className="vp-input-wrap">
                          <FiMail size={13} className="vp-input-icon" />
                          <input type="email" className="vp-form-in" placeholder="info@company.com" value={claimForm.companyEmail} onChange={e => set("companyEmail", e.target.value)} />
                        </div>
                      </div>
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">Company website</label>
                        <div className="vp-input-wrap">
                          <FiLink size={13} className="vp-input-icon" />
                          <input className="vp-form-in" placeholder="https://company.com" value={claimForm.companyWebsite} onChange={e => set("companyWebsite", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3 — Verification proof */}
                  <div>
                    <p className="vp-section-label"><FiShield size={11} />Ownership proof</p>
                    <div className="vp-proof-callout">
                      <FiLock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      Provide at least one document or ID that proves you are authorised to manage this business on Sustainly.
                    </div>
                    <div className="vp-form-grid" style={{ marginTop: 12 }}>
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">Proof type <span>*</span></label>
                        <div className="vp-input-wrap">
                          <FiFileText size={13} className="vp-input-icon" />
                          <select required className="vp-form-in vp-form-select" value={claimForm.proofType} onChange={e => set("proofType", e.target.value)}>
                            <option value="GST">GST Certificate</option>
                            <option value="CIN">CIN / MCA Registration</option>
                            <option value="UDYAM">UDYAM / MSME Certificate</option>
                            <option value="Website Email">Official Website Email</option>
                            <option value="Business Document">Other Business Document</option>
                          </select>
                        </div>
                      </div>
                      <div className="vp-field-wrap">
                        <label className="vp-field-lbl">
                          {claimForm.proofType === "GST" ? "GST number" :
                           claimForm.proofType === "CIN" ? "CIN / company ID" :
                           claimForm.proofType === "UDYAM" ? "UDYAM registration no." :
                           claimForm.proofType === "Website Email" ? "Official domain / email" :
                           "Document reference"} <span>*</span>
                        </label>
                        <div className="vp-input-wrap">
                          <FiFileText size={13} className="vp-input-icon" />
                          <input required className="vp-form-in"
                            placeholder={
                              claimForm.proofType === "GST" ? "27AAPFU0939F1ZV" :
                              claimForm.proofType === "CIN" ? "U74999MH2010PTC123456" :
                              claimForm.proofType === "UDYAM" ? "UDYAM-MH-00-1234567" :
                              claimForm.proofType === "Website Email" ? "company.com" :
                              "Document ID or reference"
                            }
                            value={claimForm.proofDetails} onChange={e => set("proofDetails", e.target.value)} />
                        </div>
                      </div>
                      <div className="vp-field-wrap vp-form-full">
                        <label className="vp-field-lbl">Additional context for reviewer</label>
                        <div className="vp-input-wrap">
                          <FiFileText size={13} className="vp-textarea-icon" />
                          <textarea className="vp-form-in vp-form-textarea" style={{ paddingTop: 9 }}
                            placeholder="E.g. I'm the founder. Our GST is registered under our parent entity. The listing was imported from an old directory…"
                            value={claimForm.message} onChange={e => set("message", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {claimError && (
                  <div className="vp-form-err"><FiAlertCircle size={14} />{claimError}</div>
                )}

                <div className="vp-modal-footer">
                  <p className="vp-form-note">
                    <FiLock size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                    Submitting does not grant access automatically. Sustainly reviews every claim before approval.
                  </p>
                  <button type="submit" disabled={claimSubmitting} className="vp-submit-btn">
                    {claimSubmitting
                      ? <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Submitting…</>
                      : <><FiShield size={14} />Submit claim</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}
