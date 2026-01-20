"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Edit,
  Save,
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";

/* ================= TYPES ================= */
type VendorForm = {
  companyName: string;
  businessType: string;
  primaryCategory: string;
  businessEmail: string;
  phone: string;
  city: string;
  country: string;
  description?: string;
  website?: string;
};

/* ================= PAGE ================= */
export default function VendorMyProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [vendorId, setVendorId] = useState("");
  const [form, setForm] = useState<VendorForm | null>(null);

  /* ================= LOAD VENDOR ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setVendorId(user.uid);

      const snap = await getDoc(doc(db, "vendors", user.uid));

      if (!snap.exists()) {
        router.push("/vendor/onboarding");
        return;
      }

      const data = snap.data();

      if (!data.approved) {
        router.push("/vendor/pending");
        return;
      }

      setForm({
        companyName: data.companyName || "",
        businessType: data.businessType || "",
        primaryCategory: data.primaryCategory || "",
        businessEmail: data.businessEmail || "",
        phone: data.phone || "",
        city: data.city || "",
        country: data.country || "",
        description: data.description || "",
        website: data.website || "",
      });

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  /* ================= SAVE ================= */
  async function saveProfile() {
    if (!form || !vendorId) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "vendors", vendorId), {
        phone: form.phone,
        city: form.city,
        country: form.country,
        website: form.website || "",
        description: form.description || "",
        updatedAt: serverTimestamp(),
      });

      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        Loading your profile…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-soft)] py-6">
      <div className="max-w-full mx-auto space-y-6">

        {/* ================= HEADER ================= */}
        <div className="bg-[var(--color-bg-white)] rounded-3xl p-6 border border-[var(--color-border)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[var(--color-bg-soft)] flex items-center justify-center">
              <Building2 className="h-7 w-7 text-[var(--color-primary-green)]" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {form.companyName}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {form.businessType} · {form.primaryCategory}
              </p>
            </div>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="
                inline-flex items-center gap-2 px-5 py-2 rounded-full
                border border-[var(--color-border)]
                text-sm font-medium
                hover:bg-[var(--color-bg-soft)]
              "
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="
                inline-flex items-center gap-2 px-5 py-2 rounded-full
                border border-[var(--color-border)]
                text-sm
              "
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        {/* ================= COMPANY INFO ================= */}
        <Section title="Company Overview">
          <Grid>
            <ReadOnlyField label="Business Email" icon={<Mail className="h-4 w-4" />}>
              {form.businessEmail}
            </ReadOnlyField>

            <ReadOnlyField label="Business Type">
              {form.businessType}
            </ReadOnlyField>

            <ReadOnlyField label="Primary Category">
              {form.primaryCategory}
            </ReadOnlyField>
          </Grid>
        </Section>

        {/* ================= CONTACT ================= */}
        <Section title="Contact Information">
          <Grid>
            <EditableField
              label="Phone"
              icon={<Phone className="h-4 w-4" />}
              value={form.phone}
              disabled={!editing}
              onChange={(v) => setForm({ ...form, phone: v })}
            />

            <EditableField
              label="City"
              icon={<MapPin className="h-4 w-4" />}
              value={form.city}
              disabled={!editing}
              onChange={(v) => setForm({ ...form, city: v })}
            />

            <EditableField
              label="Country"
              value={form.country}
              disabled={!editing}
              onChange={(v) => setForm({ ...form, country: v })}
            />

            <EditableField
              label="Website"
              icon={<Globe className="h-4 w-4" />}
              value={form.website || ""}
              disabled={!editing}
              onChange={(v) => setForm({ ...form, website: v })}
            />
          </Grid>
        </Section>

        {/* ================= DESCRIPTION ================= */}
        <Section title="Company Description">
          <textarea
            rows={4}
            disabled={!editing}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Tell buyers about your company, certifications, strengths…"
            className="
              w-full rounded-xl border border-[var(--color-border)]
              bg-white px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)]/20
              disabled:bg-[var(--color-bg-soft)]
            "
          />
        </Section>

        {/* ================= SAVE ================= */}
        {editing && (
          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="
                inline-flex items-center gap-2 px-8 py-2.5 rounded-full
                text-sm font-semibold text-white
                bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
                shadow-[0_8px_24px_rgba(11,110,79,0.25)]
                hover:opacity-90
                disabled:opacity-60
              "
            >
              {saving && (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              )}
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ================= UI HELPERS ================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-3xl p-6 border border-[var(--color-border)]">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

function ReadOnlyField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
        {icon}
        <span>{children}</span>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  disabled,
  icon,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {icon}
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full rounded-xl border border-[var(--color-border)]
            bg-white px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)]/20
            disabled:bg-[var(--color-bg-soft)]
          "
        />
      </div>
    </div>
  );
}
