"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

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

  const [form, setForm] = useState({
    price: "",
    currency: "INR",
    deliveryTimeline: "",
    message: "",
  });

  /* ================= SUBMIT QUOTE ================= */
  async function submitQuote() {
    setError("");

    if (!form.price || !form.deliveryTimeline) {
      setError("Please fill price and delivery timeline");
      return;
    }

    setLoading(true);

    try {
      const session = getStoredSession();
      if (!session) {
        setError("Please login again before sending a quote.");
        return;
      }

      const response = await fetch(`/api/vendor/rfqs/${rfq.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: Number(form.price),
          currency: form.currency,
          deliveryTimeline: form.deliveryTimeline,
          message: form.message,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Failed to send quote.");
      }

      onSent();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send quote. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-[var(--color-bg-white)] w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Send Quotation
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              RFQ:{" "}
              <span className="font-medium">
                {rfq.requirementTitle}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-bg-soft)] transition"
          >
            <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* BUYER SUMMARY */}
          <div className="grid sm:grid-cols-2 gap-4 bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-2xl p-4 text-sm">
            {[
              ["Buyer", rfq.buyerName],
              ["Delivery Location", rfq.deliveryCountry],
              ["Quantity", rfq.estimatedQuantity],
              [
                "Required Timeline",
                rfq.requiredTimeline?.replaceAll("_", " "),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {label}
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* BUYER REQUIREMENT */}
          {rfq.additionalDetails && (
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Buyer Requirement
              </p>
              <div className="bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-xl p-4 text-sm text-[var(--color-text-secondary)]">
                {rfq.additionalDetails}
              </div>
            </div>
          )}

          {/* QUOTATION INPUTS */}
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Your Quotation
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  label: "Price *",
                  value: form.price,
                  placeholder: "Eg: 1,25,000",
                  onChange: (v: string) =>
                    setForm({ ...form, price: v }),
                },
                {
                  label: "Delivery Timeline *",
                  value: form.deliveryTimeline,
                  placeholder: "Eg: 15–20 days",
                  onChange: (v: string) =>
                    setForm({ ...form, deliveryTimeline: v }),
                },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    {f.label}
                  </label>
                  <input
                    value={f.value}
                    placeholder={f.placeholder}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="
                      w-full rounded-xl border border-[var(--color-border)]
                      bg-[var(--color-bg-white)]
                      px-3 py-2 text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[var(--color-ocean-blue)]/30
                    "
                  />
                </div>
              ))}

              {/* CURRENCY */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                  className="
                    w-full rounded-xl border border-[var(--color-border)]
                    bg-[var(--color-bg-white)]
                    px-3 py-2 text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[var(--color-ocean-blue)]/30
                  "
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* MESSAGE */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Message to Buyer{" "}
              <span className="opacity-60">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              className="
                w-full rounded-xl border border-[var(--color-border)]
                bg-[var(--color-bg-white)]
                px-3 py-2 text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-ocean-blue)]/30
              "
            />
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-sm text-red-600 font-medium">
              {error}
            </p>
          )}

          {/* INFO */}
          <div className="bg-[var(--color-solar-yellow)]/15 border border-[var(--color-solar-yellow)]/30 rounded-xl p-3 text-xs text-[var(--color-text-primary)]">
            Buyer contact details will be shared only after the buyer accepts your quote.
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-soft)]">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm border border-[var(--color-border)] hover:bg-[var(--color-bg-soft)]"
          >
            Cancel
          </button>

          <button
            onClick={submitQuote}
            disabled={loading}
            className="
              inline-flex items-center gap-2
              rounded-full px-5 py-2 text-sm font-semibold text-white
              bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
              hover:opacity-90 disabled:opacity-60
            "
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}
