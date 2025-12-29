"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string;
  images?: string[];
  categoryId: string;
  subCategoryId: string;
  tags?: string[];
  vendorId: string;
  approved: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [subCategories, setSubCategories] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH ALL DATA ---------------- */
  useEffect(() => {
    async function load() {
      const [pSnap, vSnap, cSnap, sSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "vendors")),
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "subcategories")),
      ]);

      setProducts(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

      setVendors(
        Object.fromEntries(vSnap.docs.map((d) => [d.id, d.data().company]))
      );

      setCategories(
        Object.fromEntries(cSnap.docs.map((d) => [d.id, d.data().name]))
      );

      setSubCategories(
        Object.fromEntries(sSnap.docs.map((d) => [d.id, d.data().name]))
      );

      setLoading(false);
    }

    load();
  }, []);

  /* ---------------- APPROVE ---------------- */
  async function approveProduct(id: string) {
    await updateDoc(doc(db, "products", id), { approved: true });

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, approved: true } : p))
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading products...</p>;
  }

  return (
    <main className="max-w-7xl p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Product Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve vendor product listings
        </p>
      </div>

      {products.length === 0 && (
        <p className="text-sm text-gray-500">No products found.</p>
      )}
      <div className="flex justify-between ">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col"
            >
              {/* HEADER */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 leading-snug">
                    {p.title}
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Vendor: {vendors[p.vendorId] || "Unknown"}
                  </p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium
            ${
              p.approved
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
                >
                  {p.approved ? "Approved" : "Pending"}
                </span>
              </div>

              {/* IMAGES */}
              {Array.isArray(p.images) && p.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {p.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={p.title}
                      className="h-20 w-20 rounded-lg border object-cover"
                    />
                  ))}
                </div>
              )}

              {/* DESCRIPTION (2 lines only) */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {p.description}
              </p>

              {/* META */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                <span className="px-2 py-0.5 rounded-full border text-[10px] text-gray-600">
                 <strong>Category:</strong> {categories[p.categoryId] || "—"}
                </span>

                <span className="px-2 py-0.5 rounded-full border text-[10px] text-gray-600">
                  <strong> Sub Categories: </strong>{subCategories[p.subCategoryId] || "—"}
                </span>

                {p.tags?.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full bg-gray-100 border text-[10px] text-gray-500"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* ACTION */}
              {!p.approved && (
                <button
                  onClick={() => approveProduct(p.id)}
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-black text-white px-4 py-2 text-xs hover:bg-gray-900"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Product
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
