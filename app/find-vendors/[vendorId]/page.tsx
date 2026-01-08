"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";

/* ---------------- TYPES ---------------- */

type Vendor = {
  id: string;
  companyName?: string;
  description?: string;
  email?: string;
  location?: string;
};

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

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    async function loadVendor() {
      if (!vendorId) return;

      /* ---- Vendor ---- */
      const vendorSnap = await getDoc(doc(db, "vendors", vendorId));

      if (!vendorSnap.exists()) {
        setVendor(null);
        setLoading(false);
        return;
      }

      setVendor({ id: vendorSnap.id, ...(vendorSnap.data() as any) });

      /* ---- Products ---- */
      const q = query(
        collection(db, "products"),
        where("vendorId", "==", vendorSnap.id),
        where("approved", "==", true)
      );

      const prodSnap = await getDocs(q);
      setProducts(
        prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
      );

      setLoading(false);
    }

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
          <h1 className="text-2xl font-semibold text-gray-900">
            {vendor.companyName || "Vendor"}
          </h1>

          {vendor.location && (
            <p className="text-sm text-gray-500">{vendor.location}</p>
          )}

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

      <Footer />
    </>
  );
}
