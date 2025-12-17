"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function ContactVendorModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    vendorId: string;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  if (!open) return null;

  async function submit() {
    if (!form.name || !form.email || !form.phone) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);

    await addDoc(collection(db, "enquiries"), {
      productId: product.id,
      productTitle: product.title,
      vendorId: product.vendorId,

      buyerName: form.name,
      buyerEmail: form.email,
      buyerPhone: form.phone,
      buyerMessage: form.message,

      status: "NEW",
      createdAt: serverTimestamp(),
    });

    setLoading(false);
    onClose();
    alert("Enquiry sent successfully!");
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Contact Vendor</h2>

        <input
          placeholder="Your Name *"
          className="input"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email *"
          className="input"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone *"
          className="input"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <textarea
          rows={3}
          placeholder="Your requirement (optional)"
          className="input"
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 text-sm rounded-full bg-black text-white"
          >
            {loading ? "Sending..." : "Send Enquiry"}
          </button>
        </div>
      </div>
    </div>
  );
}
