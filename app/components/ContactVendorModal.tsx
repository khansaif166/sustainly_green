"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, LockKeyhole, PackageCheck, UserPlus, X } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";


export default function BuyerRFQModal({
  open,
  onClose,
  vendorId,
  productId,
  productTitle,
  productImage,
  vendorName,
  listingType,
}: {
  open: boolean;
  onClose: () => void;
  vendorId: string;
  productId?: string;
  productTitle?: string;
  productImage?: string | null;
  vendorName?: string;
  listingType?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const previousStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousStyles.overflow;
      document.body.style.position = previousStyles.position;
      document.body.style.top = previousStyles.top;
      document.body.style.width = previousStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !productTitle) return;

    const normalizedType = listingType?.toUpperCase().includes("SERVICE")
      ? "SERVICE"
      : listingType?.toUpperCase().includes("CONSULT")
        ? "CONSULTANCY"
        : "PRODUCT";

    setForm((current) => ({
      ...current,
      requirementTitle: productTitle,
      requirementType: normalizedType,
    }));
  }, [listingType, open, productTitle]);

  useEffect(() => {
    if (!open) return;

    const session = getStoredSession();
    if (!session) return;
    let cancelled = false;
    const accessToken = session.accessToken;
    const accountEmail = session.user.email || "";

    const metadata = session.user.user_metadata || {};
    const accountName =
      typeof metadata.name === "string"
        ? metadata.name
        : typeof metadata.full_name === "string"
          ? metadata.full_name
          : "";

    setForm((current) => ({
      ...current,
      buyerName: current.buyerName || accountName,
      buyerEmail: current.buyerEmail || accountEmail,
    }));

    async function loadBuyerContact() {
      try {
        const response = await fetch("/api/buyer/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json();
        if (!response.ok || cancelled) return;

        const profile = payload?.profile || {};
        const companyInfo = payload?.buyer?.companyInfo || {};

        setForm((current) => ({
          ...current,
          buyerName:
            !current.buyerName || current.buyerName === accountName
              ? companyInfo.contactPerson || profile.name || accountName
              : current.buyerName,
          buyerEmail:
            !current.buyerEmail || current.buyerEmail === accountEmail
              ? companyInfo.email ||
                profile.email ||
                accountEmail
              : current.buyerEmail,
          buyerPhone:
            current.buyerPhone ||
            companyInfo.mobile ||
            companyInfo.alternatePhone ||
            "",
        }));
      } catch {
        // Account metadata already provides the safe name/email fallback.
      }
    }

    void loadBuyerContact();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;
  const session = getStoredSession();
  const returnPath = productId
    ? `/products/${productId}?contact=1`
    : "/";
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?role=BUYER&next=${encodeURIComponent(returnPath)}`;

  async function submitRFQ() {
    setError("");

    // ✅ FIXED VALIDATION (only fields that exist in UI)
    if (
      !(productTitle || form.requirementTitle).trim() ||
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
          requirementTitle: productTitle || form.requirementTitle,
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
    <div
      className="fixed inset-0 z-[1000] bg-black/55 flex items-center justify-center overscroll-contain p-3 sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`bg-white w-full ${session ? "max-w-2xl" : "max-w-md"} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[92dvh]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-vendor-modal-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center gap-4 px-5 sm:px-6 py-4 border-b shrink-0">
          <h2 id="contact-vendor-modal-title" className="text-lg font-semibold">
            {session ? "Request a Quote" : "Sign in to contact this vendor"}
          </h2>
          <button onClick={onClose} type="button" aria-label="Close contact vendor dialog" className="shrink-0 rounded-full p-1.5 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {!session ? (
          <div className="px-6 py-7 sm:px-8 sm:py-8 text-center overflow-y-auto">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <LockKeyhole className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">A buyer account is required</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">
              Log in or create a free buyer account to send your requirement and receive a quote from this vendor.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href={loginHref} className="auth-modal-primary" onClick={onClose}>
                Log in
              </Link>
              <Link href={registerHref} className="auth-modal-secondary" onClick={onClose}>
                <UserPlus className="h-4 w-4" />
                Sign up
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="min-h-0 space-y-6 overflow-y-auto p-5 sm:p-6">
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                {productImage ? (
                  <img
                    src={productImage}
                    alt=""
                    className="h-16 w-20 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
                    <PackageCheck className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Selected product
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-gray-950">
                    {productTitle || form.requirementTitle}
                  </p>
                  {vendorName && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      Supplied by {vendorName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-950">Tell us what you need</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Add the order details the vendor needs to prepare an accurate quote.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Estimated quantity" required>
                  <input
                    className="input"
                    placeholder="e.g. 100 units"
                    value={form.estimatedQuantity}
                    onChange={(event) =>
                      setForm({ ...form, estimatedQuantity: event.target.value })
                    }
                  />
                </Field>

                <Field label="Delivery location" required>
                  <input
                    className="input"
                    placeholder="City, state or country"
                    value={form.deliveryCountry}
                    onChange={(event) =>
                      setForm({ ...form, deliveryCountry: event.target.value })
                    }
                  />
                </Field>

                <Field label="Required timeline" required>
                  <select
                    className="input"
                    value={form.requiredTimeline}
                    onChange={(event) =>
                      setForm({ ...form, requiredTimeline: event.target.value })
                    }
                  >
                    <option value="">Select a timeline</option>
                    <option value="URGENT_0_7_DAYS">Urgent (0–7 days)</option>
                    <option value="WITHIN_1_MONTH">Within 1 month</option>
                    <option value="1_3_MONTHS">1–3 months</option>
                    <option value="3_MONTHS_PLUS">3 months+</option>
                  </select>
                </Field>

                <Field label="Additional requirements" className="sm:col-span-2">
                  <textarea
                    rows={3}
                    className="input resize-none"
                    placeholder="Specifications, certifications or other expectations (optional)"
                    value={form.additionalDetails}
                    onChange={(event) =>
                      setForm({ ...form, additionalDetails: event.target.value })
                    }
                  />
                </Field>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-950">Contact details</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Pre-filled from your buyer profile and still editable.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" required>
                    <input
                      className="input"
                      autoComplete="name"
                      value={form.buyerName}
                      onChange={(event) =>
                        setForm({ ...form, buyerName: event.target.value })
                      }
                    />
                  </Field>

                  <Field label="Email" required>
                    <input
                      className="input"
                      type="email"
                      autoComplete="email"
                      value={form.buyerEmail}
                      onChange={(event) =>
                        setForm({ ...form, buyerEmail: event.target.value })
                      }
                    />
                  </Field>

                  <Field label="Phone / WhatsApp" className="sm:col-span-2">
                    <input
                      className="input"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Optional"
                      value={form.buyerPhone}
                      onChange={(event) =>
                        setForm({ ...form, buyerPhone: event.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t flex flex-wrap justify-end gap-3 shrink-0 bg-white">
              <button type="button" onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRFQ}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Sending request..." : "Send quote request"}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          background: white;
          padding: 0.7rem 0.8rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }
        .label {
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: block;
        }
        .btn-primary {
          background: #047857;
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 700;
        }
        .btn-primary:hover:not(:disabled) {
          background: #065f46;
        }
        .btn-primary:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
        .btn-outline {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }
        .auth-modal-primary,
        .auth-modal-secondary {
          min-height: 44px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.65rem 1.1rem;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
        }
        .auth-modal-primary {
          background: #15803d;
          color: white;
        }
        .auth-modal-primary:hover {
          background: #166534;
        }
        .auth-modal-secondary {
          border: 1px solid #d1d5db;
          background: white;
          color: #166534;
        }
        .auth-modal-secondary:hover {
          background: #f0fdf4;
          border-color: #86efac;
        }
        @media (max-width: 640px) {
          .input {
            font-size: 16px;
          }
          .btn-primary,
          .btn-outline {
            flex: 1 1 auto;
            min-height: 42px;
          }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required = false,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
