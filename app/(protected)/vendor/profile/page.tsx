"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Edit, Save, X } from "lucide-react";

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
        ...form,
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
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading your profile…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5">
      <div className="max-w-full mx-auto bg-white rounded-2xl p-4 space-y-6 shadow-sm">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {form.companyName}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {form.businessType} · {form.primaryCategory}
            </p>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-gray-300"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>

        {/* FORM */}
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <Field label="Business Email">
            <input
              disabled
              value={form.businessEmail}
              className="input bg-gray-100 cursor-not-allowed"
            />
          </Field>

          <Field label="Phone">
            <input
              disabled={!editing}
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              className="input"
            />
          </Field>

          <Field label="City">
            <input
              disabled={!editing}
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
              className="input"
            />
          </Field>

          <Field label="Country">
            <input
              disabled={!editing}
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: e.target.value })
              }
              className="input"
            />
          </Field>

          <Field label="Website">
            <input
              disabled={!editing}
              value={form.website}
              onChange={(e) =>
                setForm({ ...form, website: e.target.value })
              }
              className="input"
            />
          </Field>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="label">Company Description</label>
          <textarea
            rows={4}
            disabled={!editing}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="input resize-none"
          />
        </div>

        {/* SAVE */}
        {editing && (
          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-black text-white text-sm hover:bg-gray-900 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* GLOBAL INPUT STYLES */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #000;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08);
        }
        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.35rem;
        }
      `}</style>
    </main>
  );
}

/* ================= FIELD WRAPPER ================= */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
