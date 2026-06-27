"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentProfile, getStoredSession } from "@/lib/supabaseAuth";
import Link from "next/link";
import {
  ArrowLeft, Send, Package, MapPin, AlarmClock,
  User, Mail, Phone, FileText, Layers, AlertTriangle, CheckCircle2,
  ClipboardList, LockKeyhole, Search, X, ShoppingBag, ChevronRight,
} from "lucide-react";

const TIMELINES = [
  { value: "URGENT_0_7_DAYS", label: "Urgent — within 7 days" },
  { value: "WITHIN_1_MONTH",  label: "Within 1 month" },
  { value: "1_3_MONTHS",      label: "1–3 months" },
  { value: "3_MONTHS_PLUS",   label: "3 months or more" },
];

type Product = {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  price: number | string | null;
  currency: string;
  moq: number | string | null;
  imageUrl: string | null;
};

function FormField({ icon: Icon, label, required, children }: { icon: any; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={12} color="#9ca3af" />{label}{required && <span style={{ color: "#16a34a" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid #e5e7eb",
  borderRadius: 12, fontSize: 13.5, fontFamily: "inherit", outline: "none",
  color: "#111", background: "#fafafa", boxSizing: "border-box", transition: "border-color .15s",
};

function ProductPickerModal({ token, onSelect, onClose }: {
  token: string;
  onSelect: (p: Product) => void;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    async function load() {
      try {
        const res = await fetch("/api/buyer/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        setProducts(payload.products || []);
      } catch {}
      setLoading(false);
    }
    void load();
  }, [token]);

  const filtered = products.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.vendorName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 680,
        maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products or vendors…"
              style={{ ...inputStyle, paddingLeft: 34, margin: 0 }}
            />
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}>
            <X size={15} />
          </button>
        </div>

        {/* Product list */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 28, height: 28, border: "3px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
              <Package size={32} style={{ opacity: .3, margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13, margin: 0 }}>{search ? "No products match your search" : "No products available yet"}</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  style={{
                    background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14,
                    padding: 0, cursor: "pointer", textAlign: "left", transition: "all .15s",
                    overflow: "hidden", display: "flex", flexDirection: "column",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#16a34a";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(22,163,74,0.12)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }}
                >
                  {/* Image */}
                  <div style={{ width: "100%", height: 130, background: "#f9fafb", overflow: "hidden", position: "relative" }}>
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Package size={32} color="#d1d5db" />
                        </div>
                    }
                  </div>
                  {/* Info */}
                  <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#111", lineHeight: 1.35 }}>{p.title}</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280", fontWeight: 600 }}>by {p.vendorName}</p>
                    {(p.price || p.moq) && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                        {p.price && <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{p.currency} {p.price}</span>}
                        {p.moq && <span style={{ fontSize: 11.5, color: "#9ca3af" }}>MOQ: {p.moq}</span>}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: "auto", color: "#16a34a", fontSize: 12, fontWeight: 700 }}>
                      Select <ChevronRight size={12} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateRFQPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [token, setToken] = useState("");
  const [form, setForm] = useState({
    requirementTitle: "", requirementType: "PRODUCT", category: "",
    estimatedQuantity: "", deliveryCountry: "", requiredTimeline: "",
    additionalDetails: "", buyerName: "", buyerEmail: "", buyerPhone: "",
    productId: "", vendorId: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      setToken(session.accessToken);

      try {
        const res = await fetch("/api/buyer/profile", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const payload = await res.json();
        const profileComplete = Boolean(payload?.profileComplete);
        const buyerExists = Boolean(payload?.buyer);

        if (!buyerExists || !profileComplete) {
          setOnboardingRequired(true);
          setCheckingAccess(false);
          return;
        }

        const profile = payload?.profile;
        setForm(f => ({
          ...f,
          buyerName: profile?.name || session.user.email?.split("@")[0] || "",
          buyerEmail: profile?.email || session.user.email || "",
        }));
      } catch {
        const profile = await fetchCurrentProfile(session.accessToken);
        setForm(f => ({
          ...f,
          buyerName: profile?.name || session.user.email?.split("@")[0] || "",
          buyerEmail: profile?.email || session.user.email || "",
        }));
      } finally {
        setCheckingAccess(false);
      }
    }
    void loadProfile();
  }, [router]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleProductSelect(p: Product) {
    setSelectedProduct(p);
    setForm(f => ({
      ...f,
      productId: p.id,
      vendorId: p.vendorId,
      requirementTitle: p.title,
      requirementType: "PRODUCT",
    }));
    setShowPicker(false);
  }

  function clearProduct() {
    setSelectedProduct(null);
    setForm(f => ({ ...f, productId: "", vendorId: "", requirementTitle: "" }));
  }

  async function submitRFQ() {
    setError("");
    const required = ["requirementTitle", "estimatedQuantity", "deliveryCountry", "requiredTimeline", "buyerName", "buyerEmail"];
    const missing = required.filter(k => !(form as any)[k]);
    if (missing.length) { setError("Please fill in all required fields before submitting."); return; }

    const session = getStoredSession();
    if (!session) { router.push("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/buyer/rfqs", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Unable to submit RFQ.");
      setSuccess(true);
      setTimeout(() => router.push("/buyer/rfqs"), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit RFQ.");
    } finally { setLoading(false); }
  }

  if (checkingAccess) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (onboardingRequired) return (
    <>
      <style>{`
        .rfq-gate { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
        .rfq-gate-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .rfq-gate-banner { background: linear-gradient(135deg, #0a1a10 0%, #0f2318 60%, #0c1e13 100%); padding: 32px 32px 28px; position: relative; overflow: hidden; text-align: center; }
        .rfq-gate-banner::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 300px 200px at 50% 100%, rgba(22,163,74,0.18) 0%, transparent 60%); pointer-events: none; }
        .rfq-gate-icon { width: 60px; height: 60px; border-radius: 18px; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; position: relative; z-index: 1; }
        .rfq-gate-title { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -.02em; position: relative; z-index: 1; }
        .rfq-gate-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; position: relative; z-index: 1; line-height: 1.55; }
        .rfq-gate-body { padding: 28px 32px 32px; display: flex; flex-direction: column; gap: 16px; }
        .rfq-gate-steps { display: flex; flex-direction: column; gap: 10px; }
        .rfq-gate-step { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: #f9fafb; border-radius: 12px; border: 1px solid #f0f0f0; }
        .rfq-gate-step-num { width: 24px; height: 24px; border-radius: 50%; background: #16a34a; color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .rfq-gate-step-title { font-size: 13px; font-weight: 700; color: #111; margin: 0 0 2px; }
        .rfq-gate-step-desc { font-size: 12px; color: #6b7280; margin: 0; }
        .rfq-gate-cta { display: flex; flex-direction: column; gap: 8px; }
        .rfq-gate-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; text-decoration: none; transition: all .15s; font-family: inherit; border: none; cursor: pointer; width: 100%; }
        .rfq-gate-btn-primary { background: #16a34a; color: #fff; box-shadow: 0 4px 16px rgba(22,163,74,0.3); }
        .rfq-gate-btn-primary:hover { background: #15803d; }
        .rfq-gate-btn-ghost { background: #fff; color: #6b7280; border: 1.5px solid #e5e7eb; }
        .rfq-gate-btn-ghost:hover { background: #f9fafb; }
        .rfq-gate-notice { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 8px; }
        .rfq-gate-notice p { font-size: 12.5px; color: #92400e; margin: 0; line-height: 1.55; }
      `}</style>
      <div style={{ padding: "8px 0 24px" }}>
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#6b7280", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <ArrowLeft size={14} />Back
        </button>
      </div>
      <div className="rfq-gate">
        <div className="rfq-gate-card">
          <div className="rfq-gate-banner">
            <div className="rfq-gate-icon"><LockKeyhole size={26} color="rgba(255,255,255,0.7)" /></div>
            <h1 className="rfq-gate-title">Complete onboarding first</h1>
            <p className="rfq-gate-sub">You need to finish your buyer profile before you can send RFQs to vendors.</p>
          </div>
          <div className="rfq-gate-body">
            <div className="rfq-gate-steps">
              <div className="rfq-gate-step">
                <div className="rfq-gate-step-num">1</div>
                <div><p className="rfq-gate-step-title">Complete your buyer profile</p><p className="rfq-gate-step-desc">Fill in company details, sustainability commitments, and procurement preferences.</p></div>
              </div>
              <div className="rfq-gate-step">
                <div className="rfq-gate-step-num">2</div>
                <div><p className="rfq-gate-step-title">Submit for review</p><p className="rfq-gate-step-desc">Sustainly verifies your profile before activating your sourcing account.</p></div>
              </div>
              <div className="rfq-gate-step">
                <div className="rfq-gate-step-num">3</div>
                <div><p className="rfq-gate-step-title">Send RFQs to vendors</p><p className="rfq-gate-step-desc">Once active, you can submit unlimited requests for quotation to verified vendors.</p></div>
              </div>
            </div>
            <div className="rfq-gate-notice">
              <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p>This ensures vendors receive verified buyer requests, increasing your response rate.</p>
            </div>
            <div className="rfq-gate-cta">
              <Link href="/buyer/onboarding" className="rfq-gate-btn rfq-gate-btn-primary">
                <ClipboardList size={15} />Complete Onboarding
              </Link>
              <Link href="/buyer/dashboard" className="rfq-gate-btn rfq-gate-btn-ghost">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (success) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle2 size={26} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>RFQ submitted!</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          {selectedProduct
            ? `Your RFQ has been sent to ${selectedProduct.vendorName} and the admin. Redirecting…`
            : "Vendors will review and respond shortly. Redirecting…"}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .nrfq-page { display: flex; flex-direction: column; gap: 20px; max-width: 720px; }
        .nrfq-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #6b7280; border: none; background: none; cursor: pointer; padding: 8px 0; font-family: inherit; transition: color .15s; }
        .nrfq-back:hover { color: #111; }
        .nrfq-hero { background: linear-gradient(135deg, #0a1a10 0%, #0f2318 60%, #0c1e13 100%); border-radius: 20px; padding: 22px 24px; position: relative; overflow: hidden; }
        .nrfq-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 350px 200px at 90% 50%, rgba(22,163,74,0.15) 0%, transparent 65%); pointer-events: none; }
        .nrfq-hero-inner { position: relative; z-index: 1; }
        .nrfq-hero-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 3px; letter-spacing: -.02em; }
        .nrfq-hero-sub { font-size: 12.5px; color: rgba(255,255,255,0.4); margin: 0; }
        .nrfq-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 22px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 18px; }
        .nrfq-section-title { font-size: 10.5px; font-weight: 800; color: #9ca3af; letter-spacing: .07em; text-transform: uppercase; margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
        .nrfq-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 540px) { .nrfq-grid2 { grid-template-columns: 1fr; } }
        .nrfq-err { display: flex; align-items: flex-start; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 14px; font-size: 13px; color: #991b1b; font-weight: 500; }
        .nrfq-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding-top: 4px; }
        .nrfq-cancel { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #6b7280; padding: 10px 20px; border-radius: 50px; font-size: 13.5px; font-weight: 600; border: 1.5px solid #e5e7eb; cursor: pointer; font-family: inherit; transition: all .15s; }
        .nrfq-cancel:hover { background: #f3f4f6; }
        .nrfq-submit { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; padding: 10px 24px; border-radius: 50px; font-size: 13.5px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; transition: background .15s; box-shadow: 0 4px 14px rgba(22,163,74,0.3); }
        .nrfq-submit:hover:not(:disabled) { background: #15803d; }
        .nrfq-submit:disabled { opacity: .6; cursor: not-allowed; }
        input:focus, select:focus, textarea:focus { border-color: #16a34a !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.08); }

        .npick-btn { display: inline-flex; align-items: center; gap: 8px; background: #f0fdf4; color: #15803d; border: 1.5px dashed #86efac; border-radius: 12px; padding: 13px 18px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; width: 100%; justify-content: center; }
        .npick-btn:hover { background: #dcfce7; border-color: #4ade80; }
        .npick-selected { display: flex; align-items: center; gap: 12px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 12px 14px; }
        .npick-selected-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; background: #e5e7eb; flex-shrink: 0; }
        .npick-selected-img-placeholder { width: 56px; height: 56px; border-radius: 10px; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .npick-selected-info { flex: 1; min-width: 0; }
        .npick-selected-title { font-size: 13.5px; font-weight: 700; color: #111; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .npick-selected-vendor { font-size: 12px; color: #6b7280; margin: 0 0 4px; }
        .npick-selected-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 50px; }
        .npick-change { background: none; border: 1px solid #d1fae5; border-radius: 8px; padding: "6px 10px"; font-size: 12px; font-weight: 600; color: #15803d; cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
        .npick-change:hover { background: #dcfce7; }
        .npick-clear { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color .15s; }
        .npick-clear:hover { color: #ef4444; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {showPicker && token && (
        <ProductPickerModal
          token={token}
          onSelect={handleProductSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="nrfq-page">
        <button className="nrfq-back" onClick={() => router.back()}><ArrowLeft size={14} />Back</button>

        <div className="nrfq-hero">
          <div className="nrfq-hero-inner">
            <h1 className="nrfq-hero-title">New Request for Quotation</h1>
            <p className="nrfq-hero-sub">Describe what you need — vendors will respond with quotes</p>
          </div>
        </div>

        {error && (
          <div className="nrfq-err"><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{error}</div>
        )}

        {/* Product picker section */}
        <div className="nrfq-card">
          <p className="nrfq-section-title" style={{ margin: 0 }}>Select a product (optional)</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#6b7280", lineHeight: 1.55 }}>
            Choose from our marketplace — your RFQ will be sent directly to that vendor and the admin.
            Or skip this to submit a general RFQ.
          </p>

          {!selectedProduct ? (
            <button className="npick-btn" onClick={() => setShowPicker(true)}>
              <ShoppingBag size={15} />Browse Products
            </button>
          ) : (
            <div className="npick-selected">
              {selectedProduct.imageUrl
                ? <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="npick-selected-img" />
                : <div className="npick-selected-img-placeholder"><Package size={22} color="#16a34a" /></div>
              }
              <div className="npick-selected-info">
                <p className="npick-selected-title">{selectedProduct.title}</p>
                <p className="npick-selected-vendor">by {selectedProduct.vendorName}</p>
                <span className="npick-selected-badge">
                  <CheckCircle2 size={10} />RFQ will go to this vendor
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <button className="npick-clear" onClick={clearProduct} title="Remove product selection">
                  <X size={15} />
                </button>
                <button className="npick-change" onClick={() => setShowPicker(true)}>
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Requirement */}
        <div className="nrfq-card">
          <p className="nrfq-section-title">Requirement details</p>

          <FormField icon={FileText} label="What do you need?" required>
            <input style={inputStyle} placeholder="E.g. 2kW Off-Grid Solar Power System" value={form.requirementTitle} onChange={e => set("requirementTitle", e.target.value)} />
          </FormField>

          <div className="nrfq-grid2">
            <FormField icon={Layers} label="Requirement type">
              <select style={inputStyle} value={form.requirementType} onChange={e => set("requirementType", e.target.value)}>
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
                <option value="CONSULTANCY">Consultancy / Training</option>
              </select>
            </FormField>
            <FormField icon={Package} label="Estimated quantity" required>
              <input style={inputStyle} placeholder="E.g. 50 units, 200 kg" value={form.estimatedQuantity} onChange={e => set("estimatedQuantity", e.target.value)} />
            </FormField>
          </div>

          <div className="nrfq-grid2">
            <FormField icon={MapPin} label="Delivery location" required>
              <input style={inputStyle} placeholder="City, State or Country" value={form.deliveryCountry} onChange={e => set("deliveryCountry", e.target.value)} />
            </FormField>
            <FormField icon={AlarmClock} label="Required timeline" required>
              <select style={inputStyle} value={form.requiredTimeline} onChange={e => set("requiredTimeline", e.target.value)}>
                <option value="">Select timeline…</option>
                {TIMELINES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
          </div>

          <FormField icon={FileText} label="Additional requirements">
            <textarea
              rows={4}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6, verticalAlign: "top" }}
              placeholder="Certifications required, technical specs, packaging preferences, sustainability standards…"
              value={form.additionalDetails}
              onChange={e => set("additionalDetails", e.target.value)}
            />
          </FormField>
        </div>

        {/* Section 2: Contact */}
        <div className="nrfq-card">
          <p className="nrfq-section-title">Your contact details</p>

          <div className="nrfq-grid2">
            <FormField icon={User} label="Your name" required>
              <input style={inputStyle} placeholder="Rahul Sharma" value={form.buyerName} onChange={e => set("buyerName", e.target.value)} />
            </FormField>
            <FormField icon={Mail} label="Email">
              <input style={{ ...inputStyle, opacity: .65, cursor: "not-allowed" }} value={form.buyerEmail} disabled />
            </FormField>
          </div>

          <FormField icon={Phone} label="Phone / WhatsApp (optional)">
            <input style={inputStyle} placeholder="+91 98765 43210" value={form.buyerPhone} onChange={e => set("buyerPhone", e.target.value)} />
          </FormField>
        </div>

        {/* Footer */}
        <div className="nrfq-footer">
          <button className="nrfq-cancel" onClick={() => router.back()}>Cancel</button>
          <button className="nrfq-submit" onClick={submitRFQ} disabled={loading}>
            {loading
              ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Submitting…</>
              : <><Send size={14} />{selectedProduct ? `Send RFQ to ${selectedProduct.vendorName}` : "Submit RFQ"}</>}
          </button>
        </div>
      </div>
    </>
  );
}
