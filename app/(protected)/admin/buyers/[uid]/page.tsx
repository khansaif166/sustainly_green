"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  ArrowLeft, CheckCircle2, XCircle, Edit3, Save, X,
  Building2, BarChart3, Leaf, ShoppingCart, Layers, Info, Trash2,
} from "lucide-react";

/* ── helpers ── */
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, v !== null && typeof v === "object" && !Array.isArray(v) ? clean(v as object) : v])
  ) as Partial<T>;
}

/* ── sub-components ── */
function SectionHeader({ icon: Icon, title, description, color = "bg-green-50 text-green-600" }: any) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

function DataItem({ label, value }: { label: string; value?: any }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || <span className="text-gray-300 italic">—</span>}</p>
    </div>
  );
}

function EditField({ label, value, name, editing, data, setData, options, type = "text" }: any) {
  if (!editing) return <DataItem label={label} value={value} />;
  if (options) {
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        <select
          value={value ?? ""}
          onChange={e => setData((prev: any) => ({ ...prev, [name]: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        >
          <option value="">Select…</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input type={type} value={value ?? ""}
        onChange={e => setData((prev: any) => ({ ...prev, [name]: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
      />
    </div>
  );
}

function Tags({ items }: { items?: string[] }) {
  if (!items?.length) return <span className="text-gray-300 italic text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(t => (
        <span key={t} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-100">{t}</span>
      ))}
    </div>
  );
}

/* ── Page ── */
export default function AdminBuyerDetailPage() {
  const router = useRouter();
  const { uid } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [buyerData, setBuyerData] = useState<any>(null);

  // flat editable copies of each sub-document
  const [ciDraft, setCiDraft] = useState<any>({});
  const [boDraft, setBoDraft] = useState<any>({});
  const [susDraft, setSusDraft] = useState<any>({});
  const [proDraft, setProDraft] = useState<any>({});

  useEffect(() => {
    async function load() {
      if (!uid) return;
      const snap = await getDoc(doc(db, "buyers", uid as string));
      if (snap.exists()) {
        const d = snap.data();
        setBuyerData(d);
        setCiDraft(d.companyInfo ?? {});
        setBoDraft(d.businessOverview ?? {});
        setSusDraft(d.sustainability ?? {});
        setProDraft(d.procurement ?? {});
      }
      setLoading(false);
    }
    load();
  }, [uid]);

  const handleApprove = async () => {
    if (!uid) return;
    setSaving(true);
    await updateDoc(doc(db, "buyers", uid as string), { approved: true });
    await updateDoc(doc(db, "users", uid as string), { buyerApproved: true });
    setBuyerData((p: any) => ({ ...p, approved: true }));
    setSaving(false);
  };

  const handleReject = async () => {
    if (!uid) return;
    setSaving(true);
    await updateDoc(doc(db, "buyers", uid as string), { approved: false });
    setBuyerData((p: any) => ({ ...p, approved: false }));
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!uid || !confirm("Permanently delete this buyer profile?")) return;
    await deleteDoc(doc(db, "buyers", uid as string));
    router.push("/admin/buyers");
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const payload = clean({
        companyInfo: ciDraft,
        businessOverview: boDraft,
        sustainability: susDraft,
        procurement: proDraft,
      });
      await updateDoc(doc(db, "buyers", uid as string), payload as any);
      setBuyerData((p: any) => ({ ...p, ...payload }));
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    setCiDraft(buyerData?.companyInfo ?? {});
    setBoDraft(buyerData?.businessOverview ?? {});
    setSusDraft(buyerData?.sustainability ?? {});
    setProDraft(buyerData?.procurement ?? {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!buyerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">Buyer profile not found.</p>
        <button onClick={() => router.push("/admin/buyers")} className="mt-4 text-green-600 hover:underline text-sm">← Back to Buyers</button>
      </div>
    );
  }

  const ci = isEditing ? ciDraft : (buyerData.companyInfo ?? {});
  const bo = isEditing ? boDraft : (buyerData.businessOverview ?? {});
  const sus = isEditing ? susDraft : (buyerData.sustainability ?? {});
  const pro = isEditing ? proDraft : (buyerData.procurement ?? {});
  const seg = buyerData.segmentDetails ?? {};
  const decl = buyerData.declaration ?? {};

  const SEGMENT_OPTS = [
    { label: "Corporate / Listed", value: "corporate" },
    { label: "MSME", value: "msme" },
    { label: "Distributor", value: "distributor" },
    { label: "Retailer", value: "retailer" },
  ];

  const updatedLabel = buyerData.updatedAt?.seconds
    ? new Date(buyerData.updatedAt.seconds * 1000).toLocaleDateString()
    : "—";

  return (
    <main className="min-h-screen bg-[#fafbfc] py-8 px-4">
      <div className="w-full mx-auto space-y-8 max-w-7xl">

        {/* ── Top Bar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin/buyers")}
              className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ci.companyName || "Buyer"}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  buyerData.status === "submitted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {buyerData.status === "submitted" ? <CheckCircle2 size={11} /> : <Info size={11} />}
                  {buyerData.status === "submitted" ? "Submitted" : "Draft"}
                </span>
                {buyerData.approved && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    <CheckCircle2 size={11} /> Approved
                  </span>
                )}
                <span className="text-xs text-gray-400">• Updated {updatedLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <>
                <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all">
                  <X size={16} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm">
                  <Edit3 size={16} /> Edit Profile
                </button>
                {!buyerData.approved && (
                  <button onClick={handleApprove} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50">
                    <CheckCircle2 size={16} /> Approve Buyer
                  </button>
                )}
                {buyerData.approved && (
                  <button onClick={handleReject} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-xl font-medium hover:bg-red-100 transition-all">
                    <XCircle size={16} /> Suspend
                  </button>
                )}
                <button onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — 2 columns */}
          <div className="lg:col-span-2 space-y-8">

            {/* Identity */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <SectionHeader icon={Building2} title="Business Identity" description="Legal registration and contact details" color="bg-blue-50 text-blue-600" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <EditField label="Company Name" value={ci.companyName} name="companyName" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Brand Name" value={ci.brandName} name="brandName" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Organisation Type" value={ci.organisationType} name="organisationType" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Stock Listed" value={ci.stockListed} name="stockListed" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="CIN / Reg. No." value={ci.cinRegistration} name="cinRegistration" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="GST Number" value={ci.gstNumber} name="gstNumber" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <div className="col-span-full">
                  <DataItem label="Address" value={[ci.registeredAddress, ci.city, ci.state, ci.pinCode, ci.country].filter(Boolean).join(", ")} />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-6">
                <EditField label="Contact Person" value={ci.contactPerson} name="contactPerson" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Designation" value={ci.designation} name="designation" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Department" value={ci.department} name="department" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Email" value={ci.email} name="email" editing={isEditing} data={ciDraft} setData={setCiDraft} type="email" />
                <EditField label="Mobile" value={ci.mobile} name="mobile" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Alternate Phone" value={ci.alternatePhone} name="alternatePhone" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="LinkedIn" value={ci.linkedin} name="linkedin" editing={isEditing} data={ciDraft} setData={setCiDraft} />
                <EditField label="Website" value={ci.website} name="website" editing={isEditing} data={ciDraft} setData={setCiDraft} />
              </div>
            </div>

            {/* Business Overview */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <SectionHeader icon={BarChart3} title="Business Overview" description="Scale, segment, and operations" color="bg-purple-50 text-purple-600" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <EditField label="Buyer Segment" value={bo.buyerSegment} name="buyerSegment" editing={isEditing} data={boDraft} setData={setBoDraft} options={SEGMENT_OPTS} />
                <EditField label="Primary Industry" value={bo.industry} name="industry" editing={isEditing} data={boDraft} setData={setBoDraft} />
                <EditField label="Secondary Industry" value={bo.secondaryIndustry} name="secondaryIndustry" editing={isEditing} data={boDraft} setData={setBoDraft} />
                <EditField label="No. of Employees" value={bo.noOfEmployees} name="noOfEmployees" editing={isEditing} data={boDraft} setData={setBoDraft} />
                <EditField label="Annual Revenue" value={bo.annualRevenue} name="annualRevenue" editing={isEditing} data={boDraft} setData={setBoDraft} />
                <EditField label="No. of Locations" value={bo.noOfLocations} name="noOfLocations" editing={isEditing} data={boDraft} setData={setBoDraft} />
                <EditField label="Procurement Budget" value={bo.procurementBudget} name="procurementBudget" editing={isEditing} data={boDraft} setData={setBoDraft} />
                <EditField label="Geography" value={bo.geographyOfOperation} name="geographyOfOperation" editing={isEditing} data={boDraft} setData={setBoDraft} />
              </div>
              {bo.keyMarkets?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Markets</p>
                  <Tags items={bo.keyMarkets} />
                </div>
              )}
            </div>

            {/* Sustainability */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <SectionHeader icon={Leaf} title="Sustainability" description="ESG commitments and certifications" color="bg-green-50 text-green-600" />
              <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <EditField label="Sustainability Policy" value={sus.sustainabilityPolicy} name="sustainabilityPolicy" editing={isEditing} data={susDraft} setData={setSusDraft} />
                <EditField label="ESG Report" value={sus.esgReport} name="esgReport" editing={isEditing} data={susDraft} setData={setSusDraft} />
                <div className="col-span-full">
                  <DataItem label="Description" value={sus.sustainabilityDescription} />
                </div>
              </div>
              {sus.certifications?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Certifications</p>
                  <Tags items={sus.certifications} />
                </div>
              )}
            </div>

            {/* Procurement */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <SectionHeader icon={ShoppingCart} title="Procurement Preferences" description="Sourcing needs and vendor requirements" color="bg-orange-50 text-orange-600" />
              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Primary Categories</p>
                  <Tags items={pro.categoriesNeeded} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Secondary Categories</p>
                  <Tags items={pro.secondaryCategories} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                <DataItem label="Volume" value={pro.procurementVolume} />
                <DataItem label="Vendor Location" value={pro.vendorLocationPreference} />
                <DataItem label="Vendor Size" value={pro.preferredVendorSize} />
                <DataItem label="Min. Certification" value={pro.minCertificationRequired} />
                <DataItem label="Pricing Model" value={pro.pricingModel} />
                <DataItem label="Order Frequency" value={pro.orderFrequency} />
                <DataItem label="Order Value" value={pro.typicalOrderValue} />
                <DataItem label="Payment Terms" value={pro.paymentTerms} />
                <DataItem label="Communication" value={pro.communicationMode} />
                <DataItem label="Site Audit" value={pro.siteAuditRequired} />
                <DataItem label="NDA Required" value={pro.ndaRequired} />
                <DataItem label="Multi-loc Delivery" value={pro.multiLocationDelivery} />
              </div>
            </div>
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-8">

            {/* Segment Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <SectionHeader icon={Layers} title="Segment Details" description={`${bo.buyerSegment ? bo.buyerSegment.charAt(0).toUpperCase() + bo.buyerSegment.slice(1) : "N/A"} specific fields`} color="bg-pink-50 text-pink-600" />
              <div className="space-y-4 text-sm">
                {Object.entries(seg).filter(([, v]) => v && (typeof v === "string" || (Array.isArray(v) && v.length))).map(([key, val]) => (
                  Array.isArray(val)
                    ? <div key={key}><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{key}</p><Tags items={val as string[]} /></div>
                    : <DataItem key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={String(val)} />
                ))}
                {!Object.keys(seg).length && <p className="text-xs text-gray-400 italic">No segment data submitted.</p>}
              </div>
            </div>

            {/* Verification checklist */}
            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-base font-bold mb-5">Verification Checklist</h3>
              <div className="space-y-4">
                {[
                  { label: "CIN / GST Provided", check: !!(ci.cinRegistration && ci.gstNumber) },
                  { label: "Contact Details Complete", check: !!(ci.email && ci.mobile) },
                  { label: "Sustainability Policy Set", check: !!sus.sustainabilityPolicy },
                  { label: "Categories Specified", check: !!(pro.categoriesNeeded?.length) },
                  { label: "Onboarding Submitted", check: buyerData.status === "submitted" },
                  { label: "Admin Approved", check: !!buyerData.approved },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.check ? "bg-green-500" : "bg-gray-700"}`}>
                      <CheckCircle2 size={12} />
                    </div>
                    <span className={`text-sm ${item.check ? "text-white" : "text-gray-400"}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              {!buyerData.approved && buyerData.status === "submitted" && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <p className="text-xs text-gray-400 mb-4">Once approved, the buyer will be able to access vendor discovery and send RFQs.</p>
                  <button
                    onClick={handleApprove}
                    disabled={saving}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Approve & Activate Buyer
                  </button>
                </div>
              )}
            </div>

            {/* Declaration */}
            {decl.name && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Declaration</h3>
                <div className="space-y-3 text-sm">
                  <DataItem label="Signatory" value={decl.name} />
                  <DataItem label="Designation" value={decl.designation} />
                  <DataItem label="Date" value={decl.date} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
