"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchCurrentProfile, getStoredSession } from "@/lib/supabaseAuth";

export default function CreateRFQPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    async function loadProfile() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const profile = await fetchCurrentProfile(session.accessToken);

      setForm((f) => ({
        ...f,
        buyerName: profile?.name || session.user.email?.split("@")[0] || "",
        buyerEmail: profile?.email || session.user.email || "",
      }));
    }

    void loadProfile();
  }, [router]);

  /* ================= SUBMIT ================= */
  async function submitRFQ() {
    setError("");

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

    const session = getStoredSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/buyer/rfqs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to submit RFQ.");
      }

      router.push("/buyer/dashboard");
    } catch (err) {
      console.error("BUYER_RFQ_CREATE_ERROR", err);
      setError(err instanceof Error ? err.message : "Unable to submit RFQ.");
    } finally {
      setLoading(false);
    }
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
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

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
