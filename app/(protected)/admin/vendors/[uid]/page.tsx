"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { OnboardingFormData } from "../../../vendor/onboarding/schema";
import {
  ArrowLeft, CheckCircle2, XCircle, Edit3, Save, X,
  ExternalLink, ShieldCheck, Building2, User, ShoppingBag,
} from "lucide-react";
import { Input, Select, TextArea, MultiSelect, Toggle, FileUpload } from "../../../vendor/onboarding/_components/FormFields";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

const VERIFIED_BADGE_SRC = "/eco-verified-badge.jpg";

export default function AdminVendorDetailsPage() {
  const router = useRouter();
  const { uid } = useParams();

  const [loading,    setLoading]    = useState(true);
  const [isEditing,  setIsEditing]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorData, setVendorData] = useState<any>(null);

  const methods = useForm<OnboardingFormData>({ mode: "onChange" });
  const { reset, handleSubmit } = methods;

  function getAuthHeaders() {
    const session = getStoredSession();
    if (!session) throw new Error("Please sign in again.");
    return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
  }

  useEffect(() => {
    async function load() {
      if (!uid) return;
      try {
        const res     = await fetch(`/api/admin/vendors/${uid}`, { headers: { Authorization: getAuthHeaders().Authorization } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load vendor.");
        setVendorData(payload.vendor);
        reset(payload.vendor as any);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    load();
  }, [uid, reset]);

  const handleApprove = async () => {
    if (!uid) return;
    setSubmitting(true);
    try {
      const res     = await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ approved: true }) });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Error approving vendor");
      setVendorData((p: any) => ({ ...p, approved: true }));
    } catch (err) { alert(err instanceof Error ? err.message : "Error"); }
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!uid) return;
    setSubmitting(true);
    try {
      const res     = await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ approved: false }) });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Error rejecting vendor");
      setVendorData((p: any) => ({ ...p, approved: false }));
    } catch (err) { alert(err instanceof Error ? err.message : "Error"); }
    setSubmitting(false);
  };

  const handleToggleVerifiedBadge = async () => {
    if (!uid || !vendorData) return;
    setSubmitting(true);
    try {
      const nextValue = !vendorData.listingVerified;
      const res = await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ listingVerified: nextValue }) });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Error updating verified badge");
      setVendorData((p: any) => ({ ...p, listingVerified: nextValue }));
    } catch (err) { alert(err instanceof Error ? err.message : "Error"); }
    setSubmitting(false);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!uid) return;
    setSubmitting(true);
    try {
      const { logoFile, certificateFile, awardsFile, ...cleanData } = data;
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      const [logoUp, certUp, awardsUp] = await Promise.all([
        logoFile instanceof File ? uploadFileToSupabaseStorage(logoFile, { bucket: "marketplace", folder: "vendors/logos", accessToken: session.accessToken }) : Promise.resolve(null),
        certificateFile instanceof File ? uploadFileToSupabaseStorage(certificateFile, { bucket: "marketplace", folder: "vendors/certificates", accessToken: session.accessToken }) : Promise.resolve(null),
        awardsFile instanceof File ? uploadFileToSupabaseStorage(awardsFile, { bucket: "marketplace", folder: "vendors/awards", accessToken: session.accessToken }) : Promise.resolve(null),
      ]);
      const payload = { ...cleanData, ...(logoUp ? { logoUrl: logoUp.url } : {}), ...(certUp ? { certificateFileUrl: certUp.url } : {}), ...(awardsUp ? { awardsImageUrl: awardsUp.url } : {}) };
      const res = await fetch(`/api/admin/vendors/${uid}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const rp  = await res.json();
      if (!res.ok) throw new Error(rp?.error?.message || "Error updating vendor profile");
      setVendorData((p: any) => ({ ...p, ...payload }));
      setIsEditing(false);
    } catch (err) { alert(err instanceof Error ? err.message : "Error"); }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!vendorData) return (
    <div style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <p style={{ color: "#6b7280" }}>Vendor profile not found.</p>
      <button onClick={() => router.back()} style={{ color: "#16a34a", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>← Go Back</button>
    </div>
  );

  const D = ({ label, value }: { label: string; value?: any }) => (
    <div>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0 }}>{value || "—"}</p>
    </div>
  );

  const SH = ({ icon: Icon, title, desc, bg = "#f0fdf4", ic = "#16a34a" }: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={ic} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>{title}</p>
        {desc && <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0 }}>{desc}</p>}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .avd-page{display:flex;flex-direction:column;gap:20px;padding-bottom:40px}
        .avd-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:20px 24px;position:relative;overflow:hidden}
        .avd-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .avd-hero-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .avd-back{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:rgba(255,255,255,.4);cursor:pointer;background:none;border:none;font-family:inherit;padding:0;transition:color .15s;margin-bottom:10px}
        .avd-back:hover{color:rgba(255,255,255,.75)}
        .avd-logo{width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#4ade80;flex-shrink:0;overflow:hidden}
        .avd-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:50px;font-size:11.5px;font-weight:700}
        .avd-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .avd-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none}
        .avd-btn-outline{background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.18)}
        .avd-btn-outline:hover{background:rgba(255,255,255,.18)}
        .avd-btn-green{background:#16a34a;color:#fff;box-shadow:0 3px 10px rgba(22,163,74,.35)}
        .avd-btn-green:hover{background:#15803d}
        .avd-btn-red{background:rgba(239,68,68,.15);color:#f87171;border:1.5px solid rgba(239,68,68,.2)}
        .avd-btn-red:hover{background:rgba(239,68,68,.25)}

        .avd-grid{display:grid;grid-template-columns:2fr 1fr;gap:16px}
        @media(max-width:900px){.avd-grid{grid-template-columns:1fr}}
        .avd-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px 22px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .avd-data-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        @media(max-width:600px){.avd-data-grid{grid-template-columns:repeat(2,1fr)}}

        .avd-checklist{display:flex;flex-direction:column;gap:10px}
        .avd-check-item{display:flex;align-items:center;gap:10px}
        .avd-check-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .avd-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        .avd-eco-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:50px;font-size:11.5px;font-weight:800;background:rgba(16,185,129,.16);color:#6ee7b7;border:1px solid rgba(110,231,183,.2)}
        .avd-eco-badge img{width:20px;height:24px;object-fit:cover;border-radius:4px}
        .avd-badge-preview{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:#f8fafc;border:1px solid #e5e7eb;margin-top:14px}
        .avd-badge-preview img{width:54px;height:66px;object-fit:cover;border-radius:7px;box-shadow:0 8px 18px rgba(15,23,42,.12)}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="avd-page">

        {/* Hero */}
        <div className="avd-hero">
          <div style={{ position: "relative", zIndex: 1 }}>
            <button onClick={() => router.push("/admin/vendors")} className="avd-back"><ArrowLeft size={13} />Back to Vendors</button>
            <div className="avd-hero-inner">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="avd-logo">
                  {vendorData.logoUrl
                    ? <img src={vendorData.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (vendorData.companyName?.charAt(0) || "V")
                  }
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 5px", letterSpacing: "-.02em" }}>{vendorData.companyName}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="avd-badge" style={vendorData.approved ? { background: "rgba(74,222,128,.15)", color: "#4ade80" } : { background: "rgba(251,191,36,.15)", color: "#fbbf24" }}>
                      {vendorData.approved ? <CheckCircle2 size={12} /> : null}
                      {vendorData.approved ? "Verified Vendor" : "Pending Verification"}
                    </span>
                    {vendorData.listingVerified && (
                      <span className="avd-eco-badge">
                        <img src={VERIFIED_BADGE_SRC} alt="" />
                        Eco Verified Badge
                      </span>
                    )}
                    {vendorData.updatedAt && <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Updated {new Date(vendorData.updatedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>

              <div className="avd-actions">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="avd-btn avd-btn-outline"><X size={14} />Cancel</button>
                    <button onClick={handleSubmit(onSubmit)} disabled={submitting} className="avd-btn avd-btn-green">
                      {submitting ? <div className="avd-spinner" /> : <Save size={14} />}Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="avd-btn avd-btn-outline"><Edit3 size={14} />Edit</button>
                    <button onClick={handleToggleVerifiedBadge} disabled={submitting} className={vendorData.listingVerified ? "avd-btn avd-btn-red" : "avd-btn avd-btn-green"}>
                      {submitting ? <div className="avd-spinner" /> : <ShieldCheck size={14} />}
                      {vendorData.listingVerified ? "Remove Eco Badge" : "Add Eco Badge"}
                    </button>
                    {!vendorData.approved && <button onClick={handleApprove} disabled={submitting} className="avd-btn avd-btn-green">{submitting ? <div className="avd-spinner" /> : <CheckCircle2 size={14} />}Approve</button>}
                    {vendorData.approved && <button onClick={handleReject} disabled={submitting} className="avd-btn avd-btn-red"><XCircle size={14} />Suspend</button>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <FormProvider {...methods}>
          <div className="avd-grid">

            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Identity */}
              <div className="avd-card">
                <SH icon={User} title="Identity & Legal" desc="Company registration and contact details" />
                {isEditing ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ gridColumn: "1/-1" }}><FileUpload name="logoFile" label="Company Logo" /></div>
                    <Input name="companyName" label="Company Name *" />
                    <Select name="registrationType" label="Registration Type *" options={[{label:"Pvt Ltd",value:"pvt-ltd"},{label:"LLP",value:"llp"},{label:"Sole Proprietorship",value:"sole-proprietorship"}]} />
                    <Input name="cinRegistration" label="CIN Number *" />
                    <Input name="gstNumber" label="GST Number *" />
                    <Input name="yearOfIncorporation" label="Year of Incorporation *" />
                    <Input name="businessEmail" label="Business Email *" />
                    <Input name="whatsapp" label="WhatsApp / Mobile *" />
                    <Input name="primaryContactName" label="Primary Contact *" />
                    <Input name="designation" label="Designation *" />
                    <Input name="city" label="City *" />
                    <Input name="state" label="State *" />
                    <Input name="pinCode" label="PIN Code *" />
                    <Input name="country" label="Country *" />
                  </div>
                ) : (
                  <div className="avd-data-grid">
                    <D label="Company Name"       value={vendorData.companyName} />
                    <D label="Registration Type"  value={vendorData.registrationType} />
                    <D label="CIN Number"         value={vendorData.cinRegistration} />
                    <D label="GST Number"         value={vendorData.gstNumber} />
                    <D label="Established"        value={vendorData.yearOfIncorporation} />
                    <D label="Business Email"     value={vendorData.businessEmail} />
                    <D label="Primary Contact"    value={vendorData.primaryContactName} />
                    <D label="Designation"        value={vendorData.designation} />
                    <D label="WhatsApp"           value={vendorData.whatsapp} />
                    <div style={{ gridColumn: "1/-1" }}>
                      <D label="Registered Address" value={[vendorData.registeredAddress, vendorData.city, vendorData.state, vendorData.pinCode, vendorData.country].filter(Boolean).join(", ")} />
                    </div>
                  </div>
                )}
              </div>

              {/* Business Overview */}
              <div className="avd-card">
                <SH icon={Building2} title="Business Overview" desc="Operations, scale and market reach" bg="#eff6ff" ic="#3b82f6" />
                {isEditing ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Select name="businessType" label="Business Type *" options={[{label:"Manufacturer",value:"manufacturer"},{label:"Trader",value:"trader"}]} />
                    <Input name="primaryCategory" label="Primary Category *" />
                    <div style={{ gridColumn: "1/-1" }}><MultiSelect name="subCategories" label="Sub-Categories" max={3} /></div>
                    <div style={{ gridColumn: "1/-1" }}><TextArea name="shortDescription" label="Company Description *" rows={3} /></div>
                    <MultiSelect name="keyProducts" label="Key Products" max={5} />
                    <Toggle name="exportCapability" label="Export Capability" />
                    <Input name="exportMarkets" label="Export Markets" />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="avd-data-grid">
                      <D label="Business Type"      value={vendorData.businessType} />
                      <D label="Primary Category"   value={vendorData.primaryCategory} />
                      <D label="Export Capability"  value={vendorData.exportCapability ? "Yes" : "No"} />
                      <D label="Export Markets"     value={vendorData.exportMarkets} />
                    </div>
                    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                      <D label="Company Description" value={vendorData.shortDescription} />
                    </div>
                    {Array.isArray(vendorData.keyProducts) && vendorData.keyProducts.length > 0 && (
                      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                        <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 8px" }}>Key Products</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {vendorData.keyProducts.map((p: string) => <span key={p} style={{ padding: "3px 10px", background: "#f3f4f6", color: "#374151", fontSize: 12, fontWeight: 600, borderRadius: 50 }}>{p}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sustainability */}
              <div className="avd-card">
                <SH icon={ShieldCheck} title="Sustainability Credentials" desc="Environmental compliance and certifications" />
                {isEditing ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Input name="primarySustainabilityCert" label="Primary Certification *" />
                    <Input name="issuingBody" label="Issuing Body *" />
                    <div style={{ gridColumn: "1/-1" }}><FileUpload name="certificateFile" label="Sustainability Certificate" /></div>
                    <div style={{ gridColumn: "1/-1" }}><TextArea name="sustainabilityPractice" label="Sustainability Description *" rows={3} /></div>
                    <Input name="recycledContent" label="Recycled Content %" />
                    <Input name="carbonFootprint" label="Carbon Footprint" />
                    <Input name="socialCompliance" label="Social Compliance" />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f0fdf4", borderRadius: 14, gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={18} color="#16a34a" /></div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: 0 }}>{vendorData.primarySustainabilityCert || "—"}</p>
                          <p style={{ fontSize: 11.5, color: "#6b7280", margin: 0 }}>Issued by {vendorData.issuingBody || "—"}</p>
                        </div>
                      </div>
                      {vendorData.certificateFileUrl && (
                        <a href={vendorData.certificateFileUrl} target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "#fff", color: "#16a34a", fontSize: 12, fontWeight: 700, borderRadius: 50, border: "1.5px solid rgba(22,163,74,.2)", textDecoration: "none" }}>
                          <ExternalLink size={12} />View Cert
                        </a>
                      )}
                    </div>
                    <div className="avd-data-grid">
                      <D label="Recycled Content %"  value={vendorData.recycledContent} />
                      <D label="Carbon Footprint"    value={vendorData.carbonFootprint} />
                      <D label="Social Compliance"   value={vendorData.socialCompliance} />
                    </div>
                    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                      <D label="Sustainability Practice" value={vendorData.sustainabilityPractice} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Marketplace */}
              <div className="avd-card">
                <SH icon={ShoppingBag} title="Marketplace" desc="Preferences & listing" bg="#fefce8" ic="#f59e0b" />
                <div style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <D label="Listing Tier"   value={vendorData.listingTier} />
                  <D label="Language"       value={vendorData.language} />
                  <D label="Payment Terms"  value={vendorData.paymentTerms} />
                  <D label="Eco Verified Badge" value={vendorData.listingVerified ? "Visible to buyers" : "Not assigned"} />
                </div>
                {vendorData.listingVerified && (
                  <div className="avd-badge-preview">
                    <img src={VERIFIED_BADGE_SRC} alt="Sustainly Green Eco Verified badge" />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 3px" }}>Eco Verified badge active</p>
                      <p style={{ fontSize: 11.5, color: "#6b7280", margin: 0 }}>Buyers can see this badge on the public vendor listing and profile.</p>
                    </div>
                  </div>
                )}
                {vendorData.awardsImageUrl && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 8px" }}>Awards &amp; Recognitions</p>
                    <a href={vendorData.awardsImageUrl} target="_blank" style={{ display: "block", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,.07)" }}>
                      <img src={vendorData.awardsImageUrl} alt="Award" style={{ width: "100%", display: "block" }} />
                    </a>
                  </div>
                )}
              </div>

              {/* Verification Checklist */}
              <div style={{ background: "linear-gradient(170deg,#0a1a10 0%,#0d2218 55%,#0b1e14 100%)", borderRadius: 20, padding: "20px 22px" }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Verification Checklist</p>
                <div className="avd-checklist">
                  {[
                    { label: "Valid GST / CIN Registered",          check: !!vendorData.gstNumber },
                    { label: "Sustainability Certificate Provided",  check: !!vendorData.certificateFileUrl },
                    { label: "Contact Details Verified",             check: !!vendorData.whatsapp },
                    { label: "Admin Approved",                       check: vendorData.approved },
                  ].map((item, i) => (
                    <div key={i} className="avd-check-item">
                      <div className="avd-check-dot" style={{ background: item.check ? "#16a34a" : "rgba(255,255,255,.1)" }}>
                        <CheckCircle2 size={12} color="#fff" />
                      </div>
                      <span style={{ fontSize: 13, color: item.check ? "#fff" : "rgba(255,255,255,.4)", fontWeight: 600 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {!vendorData.approved && (
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.3)", margin: "0 0 12px" }}>Once approved, the vendor&apos;s profile will be live on the marketplace.</p>
                    <button onClick={handleApprove} disabled={submitting} style={{ width: "100%", padding: "11px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {submitting ? <div className="avd-spinner" /> : <CheckCircle2 size={15} />}Approve &amp; Go Live
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FormProvider>
      </div>
    </>
  );
}
