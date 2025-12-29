"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { X, Send } from "lucide-react";

export default function ReplyQuoteModal({
  rfq,
  onClose,
  onSent,
}: {
  rfq: any;
  onClose: () => void;
  onSent: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendorContact, setVendorContact] = useState<{
    phone?: string;
    email?: string;
  }>({});

  const [form, setForm] = useState({
    price: "",
    currency: "INR",
    deliveryTimeline: "",
    message: "",
  });

  /* ================= LOAD VENDOR CONTACT ================= */
  useEffect(() => {
    async function loadVendor() {
      if (!rfq.vendorId) return;

      const snap = await getDoc(doc(db, "vendors", rfq.vendorId));
      if (snap.exists()) {
        const v = snap.data();
        setVendorContact({
          phone: v.phone || "",
          email: v.email || "",
        });
      }
    }

    loadVendor();
  }, [rfq.vendorId]);

  /* ================= SUBMIT QUOTE ================= */
  async function submitQuote() {
    setError("");

    if (!form.price || !form.deliveryTimeline) {
      setError("Please fill price and delivery timeline");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, "rfqs", rfq.id), {
        vendorResponse: {
          price: Number(form.price),
          currency: form.currency,
          deliveryTimeline: form.deliveryTimeline,
          message: form.message,
        },
        vendorContact: {
          phone: vendorContact.phone || "",
          email: vendorContact.email || "",
        },
        status: "QUOTED",
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onSent();
    } catch (e) {
      setError("Failed to send quote. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
  {/* ================= HEADER ================= */}
  <div className="flex justify-between items-start px-6 py-5 border-b bg-gray-50">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Send Quotation
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        RFQ: <span className="font-medium">{rfq.requirementTitle}</span>
      </p>
    </div>

    <button
      onClick={onClose}
      className="p-2 rounded-full hover:bg-gray-200 transition"
    >
      <X className="h-5 w-5 text-gray-500" />
    </button>
  </div>

  {/* ================= BODY ================= */}
  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
    {/* BUYER SUMMARY */}
    <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 border rounded-xl p-4 text-sm">
      <div>
        <p className="text-xs text-gray-500">Buyer</p>
        <p className="font-medium text-gray-900">{rfq.buyerName}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Delivery Location</p>
        <p className="font-medium text-gray-900">{rfq.deliveryCountry}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Quantity</p>
        <p className="font-medium text-gray-900">{rfq.estimatedQuantity}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Required Timeline</p>
        <p className="font-medium text-gray-900">
          {rfq.requiredTimeline?.replaceAll("_", " ")}
        </p>
      </div>
    </div>

    {/* BUYER REQUIREMENT */}
    {rfq.additionalDetails && (
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Buyer Requirement
        </p>
        <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700">
          {rfq.additionalDetails}
        </div>
      </div>
    )}

    {/* QUOTE INPUTS */}
    <div>
  <p className="text-sm font-semibold text-gray-900 mb-3">
    Your Quotation
  </p>

  <div className="grid md:grid-cols-3 gap-4">
    {/* PRICE */}
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Price *
      </label>
      <input
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
        text-gray-900 placeholder-gray-400 shadow-sm
        focus:border-black focus:ring-2 focus:ring-black/10
        outline-none transition"
        placeholder="Eg: 1,25,000"
        value={form.price}
        onChange={(e) =>
          setForm({ ...form, price: e.target.value })
        }
      />
    </div>

    {/* CURRENCY */}
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Currency
      </label>
      <select
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
        text-gray-900 shadow-sm
        focus:border-black focus:ring-2 focus:ring-black/10
        outline-none transition"
        value={form.currency}
        onChange={(e) =>
          setForm({ ...form, currency: e.target.value })
        }
      >
        <option value="INR">INR</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
    </div>

    {/* DELIVERY TIMELINE */}
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Delivery Timeline *
      </label>
      <input
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
        text-gray-900 placeholder-gray-400 shadow-sm
        focus:border-black focus:ring-2 focus:ring-black/10
        outline-none transition"
        placeholder="Eg: 15–20 days"
        value={form.deliveryTimeline}
        onChange={(e) =>
          setForm({
            ...form,
            deliveryTimeline: e.target.value,
          })
        }
      />
    </div>
  </div>
</div>

{/* MESSAGE */}
<div>
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Message to Buyer <span className="text-gray-400">(optional)</span>
  </label>
  <textarea
    rows={3}
    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
    text-gray-900 placeholder-gray-400 shadow-sm
    focus:border-black focus:ring-2 focus:ring-black/10
    outline-none transition"
    placeholder="Eg: We will call you shortly to discuss further."
    value={form.message}
    onChange={(e) =>
      setForm({ ...form, message: e.target.value })
    }
  />
</div>


    {/* ERROR */}
    {error && (
      <p className="text-sm text-red-600 font-medium">
        {error}
      </p>
    )}

    {/* INFO */}
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
      Buyer contact details will be shared only after the buyer accepts your quote.
    </div>
  </div>

  {/* ================= FOOTER ================= */}
  <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
    <button
      onClick={onClose}
      className="rounded-full px-4 py-2 text-sm border border-gray-300 hover:bg-gray-100"
    >
      Cancel
    </button>

    <button
      onClick={submitQuote}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2 text-sm hover:bg-gray-900 disabled:opacity-60"
    >
      <Send className="h-4 w-4" />
      {loading ? "Sending..." : "Send Quote"}
    </button>
  </div>
</div>

    </div>
  );
}
