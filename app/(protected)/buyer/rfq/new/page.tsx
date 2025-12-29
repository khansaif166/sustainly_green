"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function CreateRFQPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [buyer, setBuyer] = useState<any>(null);

  const [form, setForm] = useState({
    requirementTitle: "",
    requirementType: "PRODUCT",
    category: "",
    estimatedQuantity: "",
    deliveryCountry: "",
    requiredTimeline: "",
    additionalDetails: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
  });

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setBuyer(u);
      setForm((f) => ({
        ...f,
        buyerName: u.displayName || "",
        buyerEmail: u.email || "",
      }));
    });

    return () => unsub();
  }, [router]);

  /* ================= SUBMIT ================= */
  async function submitRFQ() {
    if (
      !form.requirementTitle ||
      !form.estimatedQuantity ||
      !form.deliveryCountry ||
      !form.requiredTimeline ||
      !form.buyerName ||
      !form.buyerEmail
    ) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    await addDoc(collection(db, "rfqs"), {
      ...form,

      buyerId: buyer.uid,                 // ✅ IMPORTANT
      status: "RFQ_REQUESTED",
      contactShared: false,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setLoading(false);
    router.push("/buyer/dashboard");
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Create RFQ
          </h1>
          <p className="text-sm text-gray-500">
            Tell vendors what you need and get quotes
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white border rounded-2xl p-6 space-y-6">
        {/* REQUIREMENT */}
        <div>
          <label className="label">What do you need? *</label>
          <input
            className="input"
            placeholder="Eg: 2 kW Off Grid Solar Power System"
            value={form.requirementTitle}
            onChange={(e) =>
              setForm({ ...form, requirementTitle: e.target.value })
            }
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <select
            className="input"
            value={form.requirementType}
            onChange={(e) =>
              setForm({ ...form, requirementType: e.target.value })
            }
          >
            <option value="PRODUCT">Product</option>
            <option value="SERVICE">Service</option>
            <option value="CONSULTANCY">Consultancy / Training</option>
          </select>

          <input
            className="input"
            placeholder="Estimated Quantity (Eg: 50 units)"
            value={form.estimatedQuantity}
            onChange={(e) =>
              setForm({ ...form, estimatedQuantity: e.target.value })
            }
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="input"
            placeholder="Delivery Location / Country"
            value={form.deliveryCountry}
            onChange={(e) =>
              setForm({ ...form, deliveryCountry: e.target.value })
            }
          />

          <select
            className="input"
            value={form.requiredTimeline}
            onChange={(e) =>
              setForm({ ...form, requiredTimeline: e.target.value })
            }
          >
            <option value="">When do you need it?</option>
            <option value="URGENT_0_7_DAYS">Urgent (0–7 days)</option>
            <option value="WITHIN_1_MONTH">Within 1 month</option>
            <option value="1_3_MONTHS">1–3 months</option>
            <option value="3_MONTHS_PLUS">3 months+</option>
          </select>
        </div>

        <textarea
          rows={4}
          className="input"
          placeholder="Additional requirements (certifications, specs, expectations)"
          value={form.additionalDetails}
          onChange={(e) =>
            setForm({ ...form, additionalDetails: e.target.value })
          }
        />

        {/* CONTACT */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Your Contact Details
          </h3>

          <input
            className="input"
            placeholder="Your Name"
            value={form.buyerName}
            onChange={(e) =>
              setForm({ ...form, buyerName: e.target.value })
            }
          />

          <input
            className="input"
            placeholder="Email"
            value={form.buyerEmail}
            disabled
          />

          <input
            className="input"
            placeholder="Phone / WhatsApp (optional)"
            value={form.buyerPhone}
            onChange={(e) =>
              setForm({ ...form, buyerPhone: e.target.value })
            }
          />
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={submitRFQ}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Submitting..." : "Submit RFQ"}
          </button>
        </div>
      </div>

      {/* STYLES */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
        .label {
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: block;
        }
        .btn-primary {
          background: black;
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }
        .btn-outline {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }
      `}</style>
    </main>
  );
}
