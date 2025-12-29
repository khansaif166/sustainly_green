"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { User, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BuyerProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buyerId, setBuyerId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  /* ================= LOAD BUYER ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setBuyerId(u.uid);

      const ref = doc(db, "buyers", u.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setForm(snap.data() as any);
      } else {
        // First time buyer
        setForm({
          name: u.displayName || "",
          email: u.email || "",
          phone: "",
        });
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  /* ================= SAVE ================= */
  async function saveProfile() {
    if (!form.name) {
      alert("Name is required");
      return;
    }

    setSaving(true);

    await setDoc(
      doc(db, "buyers", buyerId),
      {
        ...form,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    setSaving(false);
    alert("Profile updated successfully");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <main className="space-y-8 max-w-3xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your contact details used for RFQs
        </p>
      </div>

      {/* CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
        {/* ICON */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Buyer Information
            </p>
            <p className="text-xs text-gray-500">
              This info is shared with vendors after RFQ acceptance
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="grid gap-4">
          {/* NAME */}
          <div>
            <label className="label">Full Name *</label>
            <input
              className="input"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          {/* EMAIL (READONLY) */}
          <div>
            <label className="label">Email</label>
            <input
              className="input bg-gray-50"
              value={form.email}
              disabled
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="label">Phone / WhatsApp</label>
            <input
              className="input"
              placeholder="Mobile number"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>
        </div>

        {/* SAVE */}
        <div className="flex justify-end">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2 text-sm hover:bg-gray-900 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* INFO */}
      <p className="text-xs text-gray-500">
        Your contact details will be visible to vendors only after you
        accept a quote.
      </p>

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
        .label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </main>
  );
}
