"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";


export default function BuyerRFQModal({
  open,
  onClose,
  vendorId,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  vendorId: string;
  productId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    requirementTitle: "",
    requirementType: "PRODUCT",
    estimatedQuantity: "",
    deliveryCountry: "",
    requiredTimeline: "",
    additionalDetails: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
  });

  if (!open) return null;

  async function submitRFQ() {
    setError("");

    // ✅ FIXED VALIDATION (only fields that exist in UI)
    if (
      !form.requirementTitle.trim() ||
      !form.estimatedQuantity.trim() ||
      !form.deliveryCountry.trim() ||
      !form.requiredTimeline ||
      !form.buyerName.trim() ||
      !form.buyerEmail.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const session = getStoredSession();
      if (!session) {
        setError("Please login as a buyer before sending an RFQ.");
        return;
      }

      const response = await fetch("/api/buyer/rfqs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirementTitle: form.requirementTitle,
          requirementType: form.requirementType,
          estimatedQuantity: form.estimatedQuantity,
          deliveryCountry: form.deliveryCountry,
          requiredTimeline: form.requiredTimeline,
          additionalDetails: form.additionalDetails,
          buyerName: form.buyerName,
          buyerEmail: form.buyerEmail,
          buyerPhone: form.buyerPhone || "",
          vendorId,
          productId: productId || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Something went wrong.");
      }

      onClose();
      alert("RFQ sent successfully. Vendor will respond soon.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Request a Quote</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">What do you need? *</label>
            <input
              className="input"
              placeholder="Eg: 2 kW Off Grid Solar System"
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
              placeholder="Estimated Quantity (Eg: 100 units)"
              value={form.estimatedQuantity}
              onChange={(e) =>
                setForm({ ...form, estimatedQuantity: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Delivery Country"
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
            rows={3}
            className="input"
            placeholder="Additional details (specs, certifications, expectations)"
            value={form.additionalDetails}
            onChange={(e) =>
              setForm({ ...form, additionalDetails: e.target.value })
            }
          />

          {/* Buyer */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold">Your Contact Details</h3>

            <input
              className="input"
              placeholder="Your Name *"
              value={form.buyerName}
              onChange={(e) =>
                setForm({ ...form, buyerName: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Email *"
              value={form.buyerEmail}
              onChange={(e) =>
                setForm({ ...form, buyerEmail: e.target.value })
              }
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

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">
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
    </div>
  );
}
