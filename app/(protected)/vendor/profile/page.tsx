"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit3, Save, X, Building2, BarChart3,
  Leaf, ShoppingBag, CheckCircle2, Clock, ChevronDown,
  ChevronUp, User, AlertTriangle,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)
          ? clean(v as object)
          : v,
      ])
  ) as Partial<T>;
}

// ─── Field (view / edit) ──────────────────────────────────────────────────────
function Field({ label, value, editing, onChange, type = "text", options, readOnly }: {
  label: string; value: string; editing: boolean; readOnly?: boolean;
  onChange?: (v: string) => void; type?: string;
  options?: { label: string; value: string }[];
}) {
  if (!editing || readOnly) {
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
        <select value={value} onChange={e => onChange?.(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none">
          <option value="">Select…</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" />
    </div>
  );
}

function TextAreaField({ label, value, editing, onChange }: {
  label: string; value: string; editing: boolean; onChange?: (v: string) => void;
}) {
  if (!editing) {
    return (
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{value || <span className="text-gray-300 italic">—</span>}</p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <textarea value={value} rows={3} onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none" />
    </div>
  );
}

// ─── Tag chip row ─────────────────────────────────────────────────────────────
function Tags({ items }: { items?: string[] }) {
  if (!items?.length) return <span className="text-gray-300 italic text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(t => (
        <span key={t} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-100">{t}</span>
      ))}
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, color, children, defaultOpen = true }: {
  title: string; icon: any; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
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

// ─── Toggle badge ─────────────────────────────────────────────────────────────
function BoolBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {value ? "✓ Yes" : "✗ No"}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VendorProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [approved, setApproved] = useState(false);
  const [data, setData] = useState<any>({});
  const [draft, setDraft] = useState<any>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setVendorId(u.uid);

      const snap = await getDoc(doc(db, "vendors", u.uid));
      if (!snap.exists()) { router.push("/vendor/onboarding"); return; }

      const d = snap.data();
      setApproved(!!d.approved);
      setData(d);
      setDraft(d);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // flat setter — handles both top-level and any field path
  const set = (key: string, value: string) =>
    setDraft((prev: any) => ({ ...prev, [key]: value }));

  const f = (key: string): string =>
    (editing ? draft : data)?.[key] ?? "";

  const handleSave = async () => {
    if (!vendorId) return;
    setSaving(true);
    try {
      const payload = clean({ ...draft, updatedAt: serverTimestamp() });
      await setDoc(doc(db, "vendors", vendorId), payload, { merge: true });
      setData(draft);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Save failed. Please try again.");
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

  const REG_TYPES = [
    { label: "Pvt Ltd", value: "pvt-ltd" },
    { label: "LLP", value: "llp" },
    { label: "Proprietorship", value: "proprietorship" },
    { label: "Partnership", value: "partnership" },
    { label: "Public Ltd", value: "public-ltd" },
    { label: "Other", value: "other" },
  ];

  const BIZ_TYPES = [
    { label: "Manufacturer", value: "manufacturer" },
    { label: "Trader / Distributor", value: "trader" },
    { label: "Service Provider", value: "service" },
    { label: "Manufacturer-Exporter", value: "mfr-exporter" },
  ];

  const LISTING_TIERS = [
    { label: "Starter", value: "starter" },
    { label: "Grow", value: "grow" },
    { label: "Pro", value: "pro" },
  ];

  return (
    <main className="max-w-full space-y-6 pb-16">
      {/* Back */}
      <Link href="/vendor/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header card */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.companyName || "Vendor Profile"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data.businessType || "—"} · {data.primaryCategory || "—"} · {data.city || ""}{data.city && data.country ? ", " : ""}{data.country || ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Approval status */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {approved ? <><CheckCircle2 size={13} /> Approved</> : <><Clock size={13} /> Pending Approval</>}
          </span>

          {!data.vendorProfileComplete && (
            <Link href="/vendor/onboarding" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition">
              <AlertTriangle size={14} /> Complete Onboarding
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

      {/* ── STEP 1: IDENTITY & CONTACT ── */}
      <Section title="Identity & Legal" icon={Building2} color="bg-blue-50 text-blue-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Company / Brand Name" value={f("companyName")} editing={editing} onChange={v => set("companyName", v)} />
          <Field label="Registration Type" value={f("registrationType")} editing={editing} onChange={v => set("registrationType", v)} options={REG_TYPES} />
          <Field label="CIN / Registration No." value={f("cinRegistration")} editing={editing} onChange={v => set("cinRegistration", v)} />
          <Field label="GST Number" value={f("gstNumber")} editing={editing} onChange={v => set("gstNumber", v)} />
          <Field label="Year of Incorporation" value={f("yearOfIncorporation")} editing={editing} onChange={v => set("yearOfIncorporation", v)} type="number" />
          <div className="md:col-span-2 lg:col-span-3">
            <Field label="Registered Address" value={f("registeredAddress")} editing={editing} onChange={v => set("registeredAddress", v)} />
          </div>
          <Field label="City" value={f("city")} editing={editing} onChange={v => set("city", v)} />
          <Field label="State" value={f("state")} editing={editing} onChange={v => set("state", v)} />
          <Field label="PIN Code" value={f("pinCode")} editing={editing} onChange={v => set("pinCode", v)} />
          <Field label="Country" value={f("country")} editing={editing} onChange={v => set("country", v)} />
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Primary Contact</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="Contact Person" value={f("primaryContactName")} editing={editing} onChange={v => set("primaryContactName", v)} />
            <Field label="Designation" value={f("designation")} editing={editing} onChange={v => set("designation", v)} />
            <Field label="Business Email" value={f("businessEmail")} editing={editing} onChange={v => set("businessEmail", v)} type="email" />
            <Field label="WhatsApp / Mobile" value={f("whatsapp")} editing={editing} onChange={v => set("whatsapp", v)} />
            <Field label="Alternate Phone" value={f("alternatePhone")} editing={editing} onChange={v => set("alternatePhone", v)} />
          </div>
        </div>
      </Section>

      {/* ── STEP 2: BUSINESS OVERVIEW ── */}
      <Section title="Business Overview" icon={BarChart3} color="bg-purple-50 text-purple-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Business Type" value={f("businessType")} editing={editing} onChange={v => set("businessType", v)} options={BIZ_TYPES} />
          <Field label="Primary Category" value={f("primaryCategory")} editing={editing} onChange={v => set("primaryCategory", v)} />
          <Field label="No. of Employees" value={f("noOfEmployees")} editing={editing} onChange={v => set("noOfEmployees", v)} />
          <Field label="Annual Turnover" value={f("annualTurnover")} editing={editing} onChange={v => set("annualTurnover", v)} />
          <Field label="Supply Capacity" value={f("supplyCapacity")} editing={editing} onChange={v => set("supplyCapacity", v)} />
          <Field label="MOQ" value={f("moq")} editing={editing} onChange={v => set("moq", v)} />
          <Field label="Target Industries" value={f("targetIndustries")} editing={editing} onChange={v => set("targetIndustries", v)} />
          <Field label="Preferred Buyer Geography" value={f("preferredBuyerGeography")} editing={editing} onChange={v => set("preferredBuyerGeography", v)} />
          <Field label="Export Markets" value={f("exportMarkets")} editing={editing} onChange={v => set("exportMarkets", v)} />
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Sub-Categories</p>
            <Tags items={data.subCategories} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Products</p>
            <Tags items={data.keyProducts} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Export Capability</p>
          <BoolBadge value={!!data.exportCapability} />
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <TextAreaField label="Short Description" value={f("shortDescription")} editing={editing} onChange={v => set("shortDescription", v)} />
        </div>
      </Section>

      {/* ── STEP 3: SUSTAINABILITY ── */}
      <Section title="Sustainability & Certifications" icon={Leaf} color="bg-green-50 text-green-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Primary Sustainability Cert." value={f("primarySustainabilityCert")} editing={editing} onChange={v => set("primarySustainabilityCert", v)} />
          <Field label="Issuing / Certifying Body" value={f("issuingBody")} editing={editing} onChange={v => set("issuingBody", v)} />
          <Field label="Recycled Content %" value={f("recycledContent")} editing={editing} onChange={v => set("recycledContent", v)} />
          <Field label="Carbon Footprint (tCO₂e)" value={f("carbonFootprint")} editing={editing} onChange={v => set("carbonFootprint", v)} />
          <Field label="EPR Registration No." value={f("eprRegistration")} editing={editing} onChange={v => set("eprRegistration", v)} />
          <Field label="Social Compliance" value={f("socialCompliance")} editing={editing} onChange={v => set("socialCompliance", v)} />
          <Field label="Net Zero Commitment" value={f("netZeroCommitment")} editing={editing} onChange={v => set("netZeroCommitment", v)} />
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <TextAreaField label="Sustainability Practices" value={f("sustainabilityPractice")} editing={editing} onChange={v => set("sustainabilityPractice", v)} />
        </div>
      </Section>

      {/* ── STEP 4: MARKETPLACE ── */}
      <Section title="Marketplace & Listing" icon={ShoppingBag} color="bg-orange-50 text-orange-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Listing Tier" value={f("listingTier")} editing={editing} onChange={v => set("listingTier", v)} options={LISTING_TIERS} />
          <Field label="Looking for Buyers In" value={f("lookingForBuyersIn")} editing={editing} onChange={v => set("lookingForBuyersIn", v)} />
          <Field label="Payment Terms" value={f("paymentTerms")} editing={editing} onChange={v => set("paymentTerms", v)} />
          <Field label="Language of Communication" value={f("language")} editing={editing} onChange={v => set("language", v)} />
          <Field label="Case Studies / Clients" value={f("caseStudies")} editing={editing} onChange={v => set("caseStudies", v)} />
          <Field label="Awards & Recognitions" value={f("awards")} editing={editing} onChange={v => set("awards", v)} />
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Willing to Offer Samples</p>
          <BoolBadge value={!!data.willingnessToOfferSamples} />
        </div>
      </Section>

      {/* ── ECO SCORE (collapsible, default closed) ── */}
      <Section title="Eco Score Self-Declaration" icon={Leaf} color="bg-teal-50 text-teal-600" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Lifecycle Stage" value={f("lifecycleStage")} editing={editing} onChange={v => set("lifecycleStage", v)} />
          <Field label="Packaging" value={f("packaging")} editing={editing} onChange={v => set("packaging", v)} />
          <Field label="Energy Source" value={f("energySource")} editing={editing} onChange={v => set("energySource", v)} />
          <Field label="Water Recycling" value={f("waterRecycling")} editing={editing} onChange={v => set("waterRecycling", v)} />
          <Field label="Waste Reduction" value={f("wasteReduction")} editing={editing} onChange={v => set("wasteReduction", v)} />
          <Field label="Audit Frequency" value={f("auditFrequency")} editing={editing} onChange={v => set("auditFrequency", v)} />
          <Field label="Certifying Body" value={f("certifyingBody")} editing={editing} onChange={v => set("certifyingBody", v)} />
          <Field label="GHG Scope 1 (tCO₂e)" value={f("ghgScope1")} editing={editing} onChange={v => set("ghgScope1", v)} />
          <Field label="GHG Scope 2 (tCO₂e)" value={f("ghgScope2")} editing={editing} onChange={v => set("ghgScope2", v)} />
          <Field label="GHG Scope 3 (tCO₂e)" value={f("ghgScope3")} editing={editing} onChange={v => set("ghgScope3", v)} />
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">SDG Alignment</p>
          <Tags items={data.sdgAlignment} />
        </div>
      </Section>

      {/* Declaration summary */}
      {data.declarationName && (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={15} className="text-green-600" />
            <span className="font-medium">{data.declarationName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 size={15} className="text-green-600" />
            Declared on <span className="font-medium ml-1">{data.declarationDate}</span>
          </div>
        </div>
      )}

      {/* Sticky save bar visible only in edit mode */}
      {editing && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="flex gap-3 bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-lg px-4 py-3">
            <button onClick={handleCancel} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
              <X size={15} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60">
              <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
