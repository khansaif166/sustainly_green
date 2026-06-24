"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit3, Save, X, Building2, BarChart3,
  Leaf, ShoppingCart, Layers, CheckCircle2, Clock,
  MapPin, Mail, Phone, Globe, Link2, User, Briefcase,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

// ─── tiny reusable display/edit row ──────────────────────────────────────────
function Field({ label, value, editing, name, onChange, type = "text", options }: {
  label: string; value: string; editing: boolean; name: string;
  onChange: (n: string, v: string) => void; type?: string;
  options?: { label: string; value: string }[];
}) {
  if (!editing) {
    return (
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300 italic">—</span>}</p>
      </div>
    );
  }
  if (options) {
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        <select
          value={value}
          onChange={e => onChange(name, e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        >
          <option value="">Select…</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
      />
    </div>
  );
}

// ─── section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color, children, defaultOpen = true }: {
  title: string; icon: any; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={16} />
          </div>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 py-5 bg-white">{children}</div>}
    </div>
  );
}

// ─── tags display ─────────────────────────────────────────────────────────────
function Tags({ items }: { items?: string[] }) {
  if (!items?.length) return <span className="text-gray-300 italic text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map(t => (
        <span key={t} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-100">{t}</span>
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function BuyerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [data, setData] = useState<any>({});
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const session = getStoredSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/buyer/profile", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Unable to load buyer profile.");
        }

        const buyer = payload.buyer || {};
        setProfileComplete(Boolean(payload.profileComplete));
        setData(buyer);
        setDraft(buyer);
      } catch (err) {
        console.error("BUYER_PROFILE_LOAD_ERROR", err);
        setError(err instanceof Error ? err.message : "Unable to load buyer profile.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [router]);

  const handleChange = (name: string, value: string) => {
    const parts = name.split(".");
    if (parts.length === 2) {
      setDraft((prev: any) => ({ ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } }));
    } else {
      setDraft((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const f = (section: string, key: string) =>
    editing ? draft?.[section]?.[key] ?? "" : data?.[section]?.[key] ?? "";

  const handleSave = async () => {
    const session = getStoredSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/buyer/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...draft,
          status: draft.status || data.status || "submitted",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Save failed. Please try again.");
      }

      const buyer = payload.buyer || draft;
      setData(draft);
      setData(buyer);
      setDraft(buyer);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { setDraft(data); setEditing(false); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  const ci = data.companyInfo || {};
  const bo = data.businessOverview || {};
  const sus = data.sustainability || {};
  const pro = data.procurement || {};
  const seg = data.segmentDetails || {};
  const decl = data.declaration || {};
  const status = data.status;

  const ORG_TYPES = [
    { label: "Public Limited", value: "public-limited" },
    { label: "Private Limited", value: "pvt-limited" },
    { label: "LLP", value: "llp" },
    { label: "Proprietorship", value: "proprietorship" },
    { label: "Government / PSU", value: "govt-psu" },
    { label: "NGO / Trust", value: "ngo-trust" },
    { label: "Other", value: "other" },
  ];

  return (
    <main className="max-w-full space-y-6 pb-16">
      {/* ── Back ── */}
      <Link href="/buyer/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* ── Header card ── */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl bg-white border border-gray-100 shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{ci.companyName || "Buyer Profile"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{ci.organisationType || "Organisation"} · {ci.city || ""}{ci.city && ci.country ? ", " : ""}{ci.country || ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            status === "submitted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {status === "submitted"
              ? <><CheckCircle2 size={13} /> Profile Submitted</>
              : <><Clock size={13} /> Draft</>
            }
          </span>

          {!profileComplete && (
            <Link href="/buyer/onboarding" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition">
              Complete Onboarding
            </Link>
          )}

          {!editing ? (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition">
              <Edit3 size={15} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                <X size={15} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60">
                <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 1: Business Identity ── */}
      <Section title="Business Identity" icon={Building2} color="bg-blue-50 text-blue-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Company Name" value={f("companyInfo","companyName")} editing={editing} name="companyInfo.companyName" onChange={handleChange} />
          <Field label="Brand Name" value={f("companyInfo","brandName")} editing={editing} name="companyInfo.brandName" onChange={handleChange} />
          <Field label="Organisation Type" value={f("companyInfo","organisationType")} editing={editing} name="companyInfo.organisationType" onChange={handleChange} options={ORG_TYPES} />
          <Field label="Stock Listed" value={f("companyInfo","stockListed")} editing={editing} name="companyInfo.stockListed" onChange={handleChange} />
          <Field label="CIN / Registration" value={f("companyInfo","cinRegistration")} editing={editing} name="companyInfo.cinRegistration" onChange={handleChange} />
          <Field label="GST Number" value={f("companyInfo","gstNumber")} editing={editing} name="companyInfo.gstNumber" onChange={handleChange} />
          <div className="md:col-span-2 lg:col-span-3">
            <Field label="Registered Address" value={f("companyInfo","registeredAddress")} editing={editing} name="companyInfo.registeredAddress" onChange={handleChange} />
          </div>
          <Field label="City" value={f("companyInfo","city")} editing={editing} name="companyInfo.city" onChange={handleChange} />
          <Field label="State" value={f("companyInfo","state")} editing={editing} name="companyInfo.state" onChange={handleChange} />
          <Field label="PIN Code" value={f("companyInfo","pinCode")} editing={editing} name="companyInfo.pinCode" onChange={handleChange} />
          <Field label="Country" value={f("companyInfo","country")} editing={editing} name="companyInfo.country" onChange={handleChange} />
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Primary Contact</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="Contact Person" value={f("companyInfo","contactPerson")} editing={editing} name="companyInfo.contactPerson" onChange={handleChange} />
            <Field label="Designation" value={f("companyInfo","designation")} editing={editing} name="companyInfo.designation" onChange={handleChange} />
            <Field label="Department" value={f("companyInfo","department")} editing={editing} name="companyInfo.department" onChange={handleChange} />
            <Field label="Email" value={f("companyInfo","email")} editing={editing} name="companyInfo.email" onChange={handleChange} type="email" />
            <Field label="Mobile" value={f("companyInfo","mobile")} editing={editing} name="companyInfo.mobile" onChange={handleChange} />
            <Field label="Alternate Phone" value={f("companyInfo","alternatePhone")} editing={editing} name="companyInfo.alternatePhone" onChange={handleChange} />
            <Field label="LinkedIn" value={f("companyInfo","linkedin")} editing={editing} name="companyInfo.linkedin" onChange={handleChange} />
            <Field label="Website" value={f("companyInfo","website")} editing={editing} name="companyInfo.website" onChange={handleChange} />
          </div>
        </div>
      </Section>

      {/* ── SECTION 2: Business Overview ── */}
      <Section title="Business Overview" icon={BarChart3} color="bg-purple-50 text-purple-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Buyer Segment" value={f("businessOverview","buyerSegment")} editing={editing} name="businessOverview.buyerSegment" onChange={handleChange}
            options={[{label:"Corporate / Listed",value:"corporate"},{label:"MSME",value:"msme"},{label:"Distributor",value:"distributor"},{label:"Retailer",value:"retailer"}]} />
          <Field label="Primary Industry" value={f("businessOverview","industry")} editing={editing} name="businessOverview.industry" onChange={handleChange} />
          <Field label="Secondary Industry" value={f("businessOverview","secondaryIndustry")} editing={editing} name="businessOverview.secondaryIndustry" onChange={handleChange} />
          <Field label="No. of Employees" value={f("businessOverview","noOfEmployees")} editing={editing} name="businessOverview.noOfEmployees" onChange={handleChange} />
          <Field label="Annual Revenue" value={f("businessOverview","annualRevenue")} editing={editing} name="businessOverview.annualRevenue" onChange={handleChange} />
          <Field label="No. of Locations" value={f("businessOverview","noOfLocations")} editing={editing} name="businessOverview.noOfLocations" onChange={handleChange} />
          <Field label="Procurement Budget" value={f("businessOverview","procurementBudget")} editing={editing} name="businessOverview.procurementBudget" onChange={handleChange} />
          <Field label="Geography of Operation" value={f("businessOverview","geographyOfOperation")} editing={editing} name="businessOverview.geographyOfOperation" onChange={handleChange} />
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Markets</p>
          <Tags items={bo.keyMarkets} />
        </div>
      </Section>

      {/* ── SECTION 3: Sustainability ── */}
      <Section title="Sustainability Commitments" icon={Leaf} color="bg-green-50 text-green-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Sustainability Policy" value={f("sustainability","sustainabilityPolicy")} editing={editing} name="sustainability.sustainabilityPolicy" onChange={handleChange} />
          <Field label="ESG Report" value={f("sustainability","esgReport")} editing={editing} name="sustainability.esgReport" onChange={handleChange} />
          <div className="md:col-span-2">
            <Field label="Description" value={f("sustainability","sustainabilityDescription")} editing={editing} name="sustainability.sustainabilityDescription" onChange={handleChange} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Certifications</p>
          <Tags items={sus.certifications} />
        </div>
      </Section>

      {/* ── SECTION 4: Procurement ── */}
      <Section title="Procurement Preferences" icon={ShoppingCart} color="bg-orange-50 text-orange-600">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Primary Categories</p>
            <Tags items={pro.categoriesNeeded} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Secondary Categories</p>
            <Tags items={pro.secondaryCategories} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
          <Field label="Procurement Volume" value={f("procurement","procurementVolume")} editing={editing} name="procurement.procurementVolume" onChange={handleChange} />
          <Field label="Vendor Location Preference" value={f("procurement","vendorLocationPreference")} editing={editing} name="procurement.vendorLocationPreference" onChange={handleChange} />
          <Field label="Preferred Vendor Size" value={f("procurement","preferredVendorSize")} editing={editing} name="procurement.preferredVendorSize" onChange={handleChange} />
          <Field label="Min. Certification Required" value={f("procurement","minCertificationRequired")} editing={editing} name="procurement.minCertificationRequired" onChange={handleChange} />
          <Field label="Pricing Model" value={f("procurement","pricingModel")} editing={editing} name="procurement.pricingModel" onChange={handleChange} />
          <Field label="Order Frequency" value={f("procurement","orderFrequency")} editing={editing} name="procurement.orderFrequency" onChange={handleChange} />
          <Field label="Typical Order Value" value={f("procurement","typicalOrderValue")} editing={editing} name="procurement.typicalOrderValue" onChange={handleChange} />
          <Field label="Payment Terms" value={f("procurement","paymentTerms")} editing={editing} name="procurement.paymentTerms" onChange={handleChange} />
          <Field label="Communication Mode" value={f("procurement","communicationMode")} editing={editing} name="procurement.communicationMode" onChange={handleChange} />
          <Field label="Site Audit Required" value={f("procurement","siteAuditRequired")} editing={editing} name="procurement.siteAuditRequired" onChange={handleChange} />
          <Field label="NDA Required" value={f("procurement","ndaRequired")} editing={editing} name="procurement.ndaRequired" onChange={handleChange} />
          <Field label="Multi-location Delivery" value={f("procurement","multiLocationDelivery")} editing={editing} name="procurement.multiLocationDelivery" onChange={handleChange} />
        </div>
      </Section>

      {/* ── SECTION 5: Segment Details ── */}
      {Object.keys(seg).some(k => seg[k]) && (
        <Section title="Segment Details" icon={Layers} color="bg-pink-50 text-pink-600" defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              ["stockSymbol","Stock Symbol"],["sustainabilityCommittee","Sustainability Committee"],
              ["brsrCompliance","BRSR Compliance"],["vendorDiversityPolicy","Vendor Diversity Policy"],
              ["vendorCode","Vendor Code of Conduct"],["esgScore","ESG Score"],
              ["sustainabilityIndex","Sustainability Index"],["csrSpend","CSR Spend"],
              ["udyamNumber","Udyam Number"],["msmeCategory","MSME Category"],
              ["reasonForSustainableSourcing","Reason for Sustainable Sourcing"],
              ["budgetSensitivity","Budget Sensitivity"],["premiumWillingness","Premium Willingness"],
              ["sourcingType","Sourcing Type"],["groupBuyingInterest","Group Buying Interest"],
              ["tradeAssociation","Trade Association"],["coverageArea","Coverage Area"],
              ["noOfRetailOutlets","No. of Retail Outlets"],["monthlyVolume","Monthly Volume"],
              ["coldChainCapability","Cold Chain Capability"],["exclusiveInterest","Exclusive Interest"],
              ["trackRecord","Track Record"],["creditTermsPreferred","Credit Terms Preferred"],
              ["retailFormat","Retail Format"],["storeOrSkuCount","Store / SKU Count"],
              ["monthlyOrders","Monthly Orders"],
            ].filter(([key]) => seg[key]).map(([key, label]) => (
              <Field key={key} label={label} value={f("segmentDetails", key)} editing={editing} name={`segmentDetails.${key}`} onChange={handleChange} />
            ))}
          </div>
          {seg.existingBrands?.length > 0 && (
            <div className="mt-4"><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Existing Brands</p><Tags items={seg.existingBrands} /></div>
          )}
          {seg.platformPresence?.length > 0 && (
            <div className="mt-4"><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Platform Presence</p><Tags items={seg.platformPresence} /></div>
          )}
        </Section>
      )}

      {/* ── Declaration summary ── */}
      {decl.name && (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={15} className="text-green-600" />
            <span className="font-medium">{decl.name}</span>
            {decl.designation && <span className="text-gray-400">· {decl.designation}</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 size={15} className="text-green-600" />
            Declared on <span className="font-medium ml-1">{decl.date}</span>
          </div>
        </div>
      )}

      {/* Prompt if no data */}
      {!ci.companyName && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl mb-4">📋</div>
          <h3 className="text-base font-semibold text-gray-700">No profile data yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-5">Complete your onboarding to populate your profile.</p>
          <Link href="/buyer/onboarding" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition">
            Start Onboarding
          </Link>
        </div>
      )}
    </main>
  );
}
