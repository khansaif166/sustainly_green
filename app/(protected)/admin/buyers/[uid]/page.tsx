"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, XCircle, Edit3, Save, X,
  Building2, BarChart3, Leaf, ShoppingCart, Layers, Trash2,
} from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => [k, v !== null && typeof v === "object" && !Array.isArray(v) ? clean(v as object) : v])
  ) as Partial<T>;
}

function Tags({ items }: { items?: string[] }) {
  if (!items?.length) return <span style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {items.map(t => <span key={t} style={{ padding: "3px 10px", background: "#f0fdf4", color: "#15803d", fontSize: 11.5, fontWeight: 700, borderRadius: 50, border: "1px solid rgba(22,163,74,.12)" }}>{t}</span>)}
    </div>
  );
}

export default function AdminBuyerDetailPage() {
  const router = useRouter();
  const { uid } = useParams();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [buyerData, setBuyerData] = useState<any>(null);

  const [ciDraft,  setCiDraft]  = useState<any>({});
  const [boDraft,  setBoDraft]  = useState<any>({});
  const [susDraft, setSusDraft] = useState<any>({});
  const [proDraft, setProDraft] = useState<any>({});

  function getAuthHeaders() {
    const session = getStoredSession();
    if (!session) throw new Error("Please sign in again.");
    return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
  }

  useEffect(() => {
    async function load() {
      if (!uid) return;
      try {
        const res     = await fetch(`/api/admin/buyers/${uid}`, { headers: { Authorization: getAuthHeaders().Authorization } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load buyer.");
        const d = payload.buyer;
        setBuyerData(d);
        setCiDraft(d.companyInfo ?? {});
        setBoDraft(d.businessOverview ?? {});
        setSusDraft(d.sustainability ?? {});
        setProDraft(d.procurement ?? {});
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    load();
  }, [uid]);

  const handleApprove = async () => {
    if (!uid) return; setSaving(true);
    try {
      const res = await fetch(`/api/admin/buyers/${uid}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ approved: true }) });
      if (!res.ok) throw new Error((await res.json())?.error?.message || "Unable to approve buyer.");
      setBuyerData((p: any) => ({ ...p, approved: true }));
    } catch (err) { alert(err instanceof Error ? err.message : "Error"); }
    setSaving(false);
  };

  const handleReject = async () => {
    if (!uid) return; setSaving(true);
    try {
      const res = await fetch(`/api/admin/buyers/${uid}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ approved: false }) });
      if (!res.ok) throw new Error((await res.json())?.error?.message || "Unable to suspend buyer.");
      setBuyerData((p: any) => ({ ...p, approved: false }));
    } catch (err) { alert(err instanceof Error ? err.message : "Error"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!uid || !confirm("Permanently delete this buyer profile?")) return;
    const res = await fetch(`/api/admin/buyers/${uid}`, { method: "DELETE", headers: { Authorization: getAuthHeaders().Authorization } });
    if (res.ok) router.push("/admin/buyers");
  };

  const handleSave = async () => {
    if (!uid) return; setSaving(true);
    try {
      const payload = clean({ companyInfo: ciDraft, businessOverview: boDraft, sustainability: susDraft, procurement: proDraft });
      const res  = await fetch(`/api/admin/buyers/${uid}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const rp   = await res.json();
      if (!res.ok) throw new Error(rp?.error?.message || "Save failed.");
      setBuyerData((p: any) => ({ ...p, ...payload }));
      setIsEditing(false);
    } catch (err) { alert(err instanceof Error ? err.message : "Error"); }
    setSaving(false);
  };

  const cancelEdit = () => {
    setCiDraft(buyerData?.companyInfo ?? {});
    setBoDraft(buyerData?.businessOverview ?? {});
    setSusDraft(buyerData?.sustainability ?? {});
    setProDraft(buyerData?.procurement ?? {});
    setIsEditing(false);
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!buyerData) return (
    <div style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <p style={{ color: "#6b7280" }}>Buyer profile not found.</p>
      <button onClick={() => router.push("/admin/buyers")} style={{ color: "#16a34a", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>← Back to Buyers</button>
    </div>
  );

  const ci  = isEditing ? ciDraft  : (buyerData.companyInfo ?? {});
  const bo  = isEditing ? boDraft  : (buyerData.businessOverview ?? {});
  const sus = isEditing ? susDraft : (buyerData.sustainability ?? {});
  const pro = isEditing ? proDraft : (buyerData.procurement ?? {});
  const seg = buyerData.segmentDetails ?? {};
  const decl= buyerData.declaration ?? {};

  const D = ({ label, value }: { label: string; value?: any }) => (
    <div>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0 }}>{value || "—"}</p>
    </div>
  );

  const EF = ({ label, value, name, setter, options, type = "text" }: any) => {
    if (!isEditing) return <D label={label} value={value} />;
    if (options) return (
      <div>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 4px" }}>{label}</p>
        <select value={value ?? ""} onChange={e => setter((p: any) => ({ ...p, [name]: e.target.value }))}
          style={{ width: "100%", padding: "8px 11px", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", appearance: "none", cursor: "pointer", boxSizing: "border-box" }}>
          <option value="">Select…</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
    return (
      <div>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 4px" }}>{label}</p>
        <input type={type} value={value ?? ""} onChange={e => setter((p: any) => ({ ...p, [name]: e.target.value }))}
          style={{ width: "100%", padding: "8px 11px", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }} />
      </div>
    );
  };

  const SH = ({ icon: Icon, title, desc, bg = "#f0fdf4", ic = "#16a34a" }: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={ic} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>{title}</p>
        {desc && <p style={{ fontSize: 11.5, color: "#9ca3af", margin: 0 }}>{desc}</p>}
      </div>
    </div>
  );

  const SEGMENT_OPTS = [{ label: "Corporate / Listed", value: "corporate" }, { label: "MSME", value: "msme" }, { label: "Distributor", value: "distributor" }, { label: "Retailer", value: "retailer" }];

  return (
    <>
      <style>{`
        .abd-page{display:flex;flex-direction:column;gap:20px;padding-bottom:40px}
        .abd-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:20px 24px;position:relative;overflow:hidden}
        .abd-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .abd-hero-inner{position:relative;z-index:1}
        .abd-back{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:rgba(255,255,255,.4);cursor:pointer;background:none;border:none;font-family:inherit;padding:0;transition:color .15s;margin-bottom:12px}
        .abd-back:hover{color:rgba(255,255,255,.75)}
        .abd-avatar{width:48px;height:48px;border-radius:15px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#4ade80;flex-shrink:0}
        .abd-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700}
        .abd-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
        .abd-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none}
        .abd-btn-outline{background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.18)}
        .abd-btn-outline:hover{background:rgba(255,255,255,.18)}
        .abd-btn-green{background:#16a34a;color:#fff}
        .abd-btn-green:hover{background:#15803d}
        .abd-btn-red{background:rgba(239,68,68,.15);color:#f87171;border:1.5px solid rgba(239,68,68,.2)}
        .abd-btn-red:hover{background:rgba(239,68,68,.25)}
        .abd-btn-ghost{background:rgba(255,255,255,.08);color:rgba(255,255,255,.5);border:1.5px solid rgba(255,255,255,.1)}
        .abd-btn-ghost:hover{background:rgba(255,255,255,.15)}

        .abd-grid{display:grid;grid-template-columns:2fr 1fr;gap:16px}
        @media(max-width:900px){.abd-grid{grid-template-columns:1fr}}
        .abd-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px 22px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .abd-data-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        @media(max-width:600px){.abd-data-grid{grid-template-columns:repeat(2,1fr)}}
        .abd-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}

        .abd-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="abd-page">

        {/* Hero */}
        <div className="abd-hero">
          <div className="abd-hero-inner">
            <button onClick={() => router.push("/admin/buyers")} className="abd-back"><ArrowLeft size={13} />Back to Buyers</button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="abd-avatar">{ci.companyName?.charAt(0)?.toUpperCase() || "B"}</div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 5px", letterSpacing: "-.02em" }}>{ci.companyName || "Buyer"}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span className="abd-badge" style={buyerData.status === "submitted" ? { background: "rgba(74,222,128,.15)", color: "#4ade80" } : { background: "rgba(251,191,36,.15)", color: "#fbbf24" }}>
                      {buyerData.status === "submitted" ? "Submitted" : "Draft"}
                    </span>
                    {buyerData.approved && <span className="abd-badge" style={{ background: "rgba(59,130,246,.15)", color: "#60a5fa" }}><CheckCircle2 size={11} />Approved</span>}
                    {buyerData.updatedAt && <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Updated {new Date(buyerData.updatedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>

              <div className="abd-actions">
                {isEditing ? (
                  <>
                    <button onClick={cancelEdit} className="abd-btn abd-btn-outline"><X size={13} />Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="abd-btn abd-btn-green">
                      {saving ? <div className="abd-spinner" /> : <Save size={13} />}Save
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="abd-btn abd-btn-outline"><Edit3 size={13} />Edit</button>
                    {!buyerData.approved && <button onClick={handleApprove} disabled={saving} className="abd-btn abd-btn-green">{saving ? <div className="abd-spinner" /> : <CheckCircle2 size={13} />}Approve</button>}
                    {buyerData.approved && <button onClick={handleReject} disabled={saving} className="abd-btn abd-btn-red"><XCircle size={13} />Suspend</button>}
                    <button onClick={handleDelete} className="abd-btn abd-btn-ghost"><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="abd-grid">

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Identity */}
            <div className="abd-card">
              <SH icon={Building2} title="Business Identity" desc="Legal registration and contact details" bg="#eff6ff" ic="#3b82f6" />
              <div className={isEditing ? "abd-edit-grid" : "abd-data-grid"}>
                <EF label="Company Name"       value={ci.companyName}       name="companyName"      setter={setCiDraft} />
                <EF label="Brand Name"         value={ci.brandName}         name="brandName"        setter={setCiDraft} />
                <EF label="Organisation Type"  value={ci.organisationType}  name="organisationType" setter={setCiDraft} />
                <EF label="CIN / Reg. No."     value={ci.cinRegistration}   name="cinRegistration"  setter={setCiDraft} />
                <EF label="GST Number"         value={ci.gstNumber}         name="gstNumber"        setter={setCiDraft} />
                {!isEditing && <div style={{ gridColumn: "1/-1" }}><D label="Address" value={[ci.registeredAddress, ci.city, ci.state, ci.pinCode, ci.country].filter(Boolean).join(", ")} /></div>}
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 14, paddingTop: 14 }}>
                <div className={isEditing ? "abd-edit-grid" : "abd-data-grid"}>
                  <EF label="Contact Person"  value={ci.contactPerson}  name="contactPerson"  setter={setCiDraft} />
                  <EF label="Designation"     value={ci.designation}    name="designation"    setter={setCiDraft} />
                  <EF label="Email"           value={ci.email}          name="email"          setter={setCiDraft} type="email" />
                  <EF label="Mobile"          value={ci.mobile}         name="mobile"         setter={setCiDraft} />
                  <EF label="Website"         value={ci.website}        name="website"        setter={setCiDraft} />
                </div>
              </div>
            </div>

            {/* Business Overview */}
            <div className="abd-card">
              <SH icon={BarChart3} title="Business Overview" desc="Scale, segment, and operations" bg="#faf5ff" ic="#9333ea" />
              <div className={isEditing ? "abd-edit-grid" : "abd-data-grid"}>
                <EF label="Buyer Segment"     value={bo.buyerSegment}         name="buyerSegment"         setter={setBoDraft} options={[{label:"Corporate",value:"corporate"},{label:"MSME",value:"msme"},{label:"Distributor",value:"distributor"},{label:"Retailer",value:"retailer"}]} />
                <EF label="Primary Industry"  value={bo.industry}             name="industry"             setter={setBoDraft} />
                <EF label="No. of Employees"  value={bo.noOfEmployees}        name="noOfEmployees"        setter={setBoDraft} />
                <EF label="Annual Revenue"    value={bo.annualRevenue}        name="annualRevenue"        setter={setBoDraft} />
                <EF label="Procurement Budget"value={bo.procurementBudget}    name="procurementBudget"    setter={setBoDraft} />
                <EF label="Geography"         value={bo.geographyOfOperation} name="geographyOfOperation" setter={setBoDraft} />
              </div>
              {bo.keyMarkets?.length > 0 && !isEditing && (
                <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 14, paddingTop: 14 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 8px" }}>Key Markets</p>
                  <Tags items={bo.keyMarkets} />
                </div>
              )}
            </div>

            {/* Sustainability */}
            <div className="abd-card">
              <SH icon={Leaf} title="Sustainability" desc="ESG commitments and certifications" />
              <div className={isEditing ? "abd-edit-grid" : "abd-data-grid"}>
                <EF label="Sustainability Policy" value={sus.sustainabilityPolicy} name="sustainabilityPolicy" setter={setSusDraft} />
                <EF label="ESG Report"            value={sus.esgReport}            name="esgReport"            setter={setSusDraft} />
              </div>
              {sus.certifications?.length > 0 && !isEditing && (
                <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 14, paddingTop: 14 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 8px" }}>Certifications</p>
                  <Tags items={sus.certifications} />
                </div>
              )}
            </div>

            {/* Procurement */}
            <div className="abd-card">
              <SH icon={ShoppingCart} title="Procurement Preferences" desc="Sourcing needs and vendor requirements" bg="#fff7ed" ic="#f97316" />
              {!isEditing && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 8px" }}>Primary Categories</p>
                    <Tags items={pro.categoriesNeeded} />
                  </div>
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                    <div className="abd-data-grid">
                      <D label="Volume"             value={pro.procurementVolume} />
                      <D label="Vendor Location"    value={pro.vendorLocationPreference} />
                      <D label="Vendor Size"        value={pro.preferredVendorSize} />
                      <D label="Min. Certification" value={pro.minCertificationRequired} />
                      <D label="Pricing Model"      value={pro.pricingModel} />
                      <D label="Order Frequency"    value={pro.orderFrequency} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Segment Details */}
            {Object.keys(seg).length > 0 && (
              <div className="abd-card">
                <SH icon={Layers} title="Segment Details" bg="#fdf2f8" ic="#ec4899" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(seg).filter(([, v]) => v && (typeof v === "string" || (Array.isArray(v) && v.length))).map(([key, val]) =>
                    Array.isArray(val)
                      ? <div key={key}><p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 5px" }}>{key}</p><Tags items={val as string[]} /></div>
                      : <D key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={String(val)} />
                  )}
                </div>
              </div>
            )}

            {/* Verification Checklist */}
            <div style={{ background: "linear-gradient(170deg,#0a1a10 0%,#0d2218 55%,#0b1e14 100%)", borderRadius: 20, padding: "20px 22px" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Verification Checklist</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "CIN / GST Provided",         check: !!(ci.cinRegistration && ci.gstNumber) },
                  { label: "Contact Details Complete",    check: !!(ci.email && ci.mobile) },
                  { label: "Sustainability Policy Set",   check: !!sus.sustainabilityPolicy },
                  { label: "Categories Specified",        check: !!(pro.categoriesNeeded?.length) },
                  { label: "Onboarding Submitted",        check: buyerData.status === "submitted" },
                  { label: "Admin Approved",              check: !!buyerData.approved },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: item.check ? "#16a34a" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle2 size={12} color="#fff" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.check ? "#fff" : "rgba(255,255,255,.4)" }}>{item.label}</span>
                  </div>
                ))}
              </div>
              {!buyerData.approved && buyerData.status === "submitted" && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                  <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.3)", margin: "0 0 12px" }}>Once approved, the buyer can access vendor discovery and send RFQs.</p>
                  <button onClick={handleApprove} disabled={saving} style={{ width: "100%", padding: "11px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {saving ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={15} />}
                    Approve &amp; Activate
                  </button>
                </div>
              )}
            </div>

            {/* Declaration */}
            {decl.name && (
              <div className="abd-card">
                <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 14px" }}>Declaration</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <D label="Signatory"   value={decl.name} />
                  <D label="Designation" value={decl.designation} />
                  <D label="Date"        value={decl.date} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
