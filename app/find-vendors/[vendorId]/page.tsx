"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import {
  fetchApprovedProducts,
  fetchApprovedVendorById,
  submitVendorClaim,
  type PublicVendor,
} from "@/lib/supabasePublic";

/* ---------------- TYPES ---------------- */

type Vendor = PublicVendor;

type Product = {
  id: string;
  title: string;
  images?: string[];
  priceType?: string;
};

/* ================= PAGE ================= */

export default function VendorProfilePage() {
  const params = useParams();

  // ✅ FIX: force vendorId to be string
  const vendorId = Array.isArray(params.vendorId)
    ? params.vendorId[0]
    : params.vendorId;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimForm, setClaimForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    requesterDesignation: "",
    companyEmail: "",
    companyWebsite: "",
    proofType: "GST",
    proofDetails: "",
    message: "",
  });

  const loadVendor = async () => {
    if (!vendorId) return;

    setLoading(true);
    try {
      /* ---- Vendor ---- */
      const publicVendor = await fetchApprovedVendorById(vendorId);

      if (!publicVendor) {
        setVendor(null);
        setProducts([]);
        return;
      }

      setVendor(publicVendor);

      /* ---- Products ---- */
      const vendorProducts = await fetchApprovedProducts({
        vendorId: publicVendor.id,
        limit: 24,
      });
      setProducts(vendorProducts);
    } catch (error) {
      console.error("Failed to load Supabase vendor", error);
      setVendor(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateClaimField = (field: keyof typeof claimForm, value: string) => {
    setClaimForm((current) => ({ ...current, [field]: value }));
  };

  const handleClaimSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vendor) return;

    setClaimSubmitting(true);
    setClaimError("");

    try {
      await submitVendorClaim({
        vendorId: vendor.id,
        ...claimForm,
      });
      setClaimSuccess(true);
      setClaimOpen(false);
      await loadVendor();
    } catch (error) {
      console.error("Failed to submit vendor claim", error);
      setClaimError(
        "We could not submit this claim. It may already be under review.",
      );
    } finally {
      setClaimSubmitting(false);
    }
  };

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading vendor profile…
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Vendor not found
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <>
      <Header />

      <main className="max-w-full mx-auto px-6 py-12 space-y-10">
        {/* ================= VENDOR INFO ================= */}
        <section className="bg-white rounded-3xl p-8 shadow-sm space-y-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt={vendor.companyName || "Vendor"} className="w-16 h-16 rounded-full object-cover border border-gray-200 bg-white" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center font-bold text-2xl text-gray-500 border border-gray-200 shrink-0 uppercase">
                {vendor.companyName ? vendor.companyName.charAt(0) : "V"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {vendor.companyName || "Vendor"}
              </h1>
              {vendor.isUnclaimed && (
                <span className="inline-flex mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                  Listed business · unclaimed
                </span>
              )}
              {vendor.isClaimRequested && (
                <span className="inline-flex mt-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  Claim under review
                </span>
              )}
              {vendor.isClaimed && (
                <span className="inline-flex mt-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  Claimed business
                </span>
              )}
              {vendor.location && (
                <p className="text-sm text-gray-500 mt-1">{vendor.location}</p>
              )}
            </div>
            </div>

            <div className="md:text-right">
              {vendor.isUnclaimed && (
                <button
                  type="button"
                  onClick={() => setClaimOpen(true)}
                  className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Claim this business
                </button>
              )}
              {vendor.isClaimRequested && (
                <button
                  type="button"
                  disabled
                  className="rounded-full bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-500"
                >
                  Claim under review
                </button>
              )}
            </div>
          </div>

          {vendor.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {vendor.description}
            </p>
          )}

          {vendor.email && (
            <p className="text-sm text-gray-500">
              Contact: {vendor.email}
            </p>
          )}

          {vendor.isUnclaimed && (
            <p className="text-sm text-gray-500">
              This public listing can be claimed by the business owner after verification.
            </p>
          )}

          {claimSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Claim request submitted. Our team will verify the ownership proof before giving dashboard access.
            </div>
          )}
        </section>

        {/* ================= PRODUCTS ================= */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Products from this vendor
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-gray-500">
              No products available yet.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                >
                  <div className="h-86 bg-gray-100 rounded-xl mb-3 overflow-hidden">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {p.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {p.priceType || "Price on request"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {claimOpen && vendor.isUnclaimed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Claim this business
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Submit ownership proof for {vendor.companyName}. Admin approval is required before access is granted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClaimOpen(false)}
                className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Full name *
                  <input
                    required
                    value={claimForm.requesterName}
                    onChange={(event) => updateClaimField("requesterName", event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Work email *
                  <input
                    required
                    type="email"
                    value={claimForm.requesterEmail}
                    onChange={(event) => updateClaimField("requesterEmail", event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Phone
                  <input
                    value={claimForm.requesterPhone}
                    onChange={(event) => updateClaimField("requesterPhone", event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Designation
                  <input
                    value={claimForm.requesterDesignation}
                    onChange={(event) => updateClaimField("requesterDesignation", event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Company email
                  <input
                    type="email"
                    value={claimForm.companyEmail}
                    onChange={(event) => updateClaimField("companyEmail", event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Company website
                  <input
                    value={claimForm.companyWebsite}
                    onChange={(event) => updateClaimField("companyWebsite", event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Proof type *
                  <select
                    required
                    value={claimForm.proofType}
                    onChange={(event) => updateClaimField("proofType", event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="GST">GST</option>
                    <option value="CIN">CIN</option>
                    <option value="Website Email">Website Email</option>
                    <option value="Business Document">Business Document</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium text-gray-700">
                  Proof details *
                  <input
                    required
                    value={claimForm.proofDetails}
                    onChange={(event) => updateClaimField("proofDetails", event.target.value)}
                    placeholder="GST/CIN number, official email domain, document reference, etc."
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm font-medium text-gray-700">
                Message to admin
                <textarea
                  rows={4}
                  value={claimForm.message}
                  onChange={(event) => updateClaimField("message", event.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>

              {claimError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {claimError}
                </p>
              )}

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  Submitting does not grant ownership automatically. Sustainly will review the proof first.
                </p>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {claimSubmitting ? "Submitting..." : "Submit claim request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
