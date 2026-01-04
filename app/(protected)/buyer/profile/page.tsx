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
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        Loading profile…
      </div>
    );
  }

  return (
    <main className="max-w-full space-y-8">

      {/* ================= CARD ================= */}
      <section
        className="
          rounded-3xl p-6
          bg-[var(--color-bg-white)]
          shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          space-y-6 w-full
        "
      >
        {/* ICON */}
        <div className="flex items-center gap-4 w-full">
          <div
            className="
              h-12 w-12 rounded-xl
              bg-[var(--color-bg-soft)]
              flex items-center justify-center
            "
          >
            <User className="h-6 w-6 text-[var(--color-primary-green)]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Buyer Information
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Shared with vendors only after RFQ acceptance
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="grid gap-5">
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

          {/* EMAIL */}
          <div>
            <label className="label">Email</label>
            <input
              className="input bg-[var(--color-bg-soft)] cursor-not-allowed"
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
        <div className="flex justify-end pt-2">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="
              inline-flex items-center gap-2
              rounded-full
              bg-[var(--color-solar-yellow)]
              text-black
              px-6 py-2.5
              text-sm font-semibold
              hover:brightness-95
              transition
              disabled:opacity-60
            "
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </section>

      {/* INFO */}
      <p className="text-xs text-[var(--color-text-secondary)]">
        Your contact details are visible to vendors only after you accept a quote.
      </p>

      {/* ================= GLOBAL INPUT STYLES ================= */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-text-primary);
          background: white;
        }

        .input:focus {
          outline: none;
          border-color: var(--color-primary-green);
          box-shadow: 0 0 0 2px rgba(11, 110, 79, 0.15);
        }

        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 0.35rem;
        }
      `}</style>
    </main>
  );
}
