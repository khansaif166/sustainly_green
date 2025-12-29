"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ---------------- TYPES ---------------- */
type Product = {
  id: string;
  title: string;
  images?: string[];
  listingType: string[];
  categoryId: string;
  subCategoryId?: string;
  priceType?: string;
};

type Category = {
  id: string;
  name: string;
};

/* ================= PAGE ================= */
export default function BrowsePage() {
  const router = useRouter();
  const params = useSearchParams();

  const type = params.get("type") || "Product";
  const category = params.get("category") || "";
  const search = params.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD CATEGORIES ---------------- */
  useEffect(() => {
    async function loadCategories() {
      const snap = await getDocs(collection(db, "categories"));
      setCategories(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
      );
    }
    loadCategories();
  }, []);

  /* ---------------- LOAD PRODUCTS ---------------- */
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);

      let q = query(
        collection(db, "products"),
        where("approved", "==", true),
        where("listingType", "array-contains", type),
        orderBy("title"),
        limit(50)
      );

      if (category) {
        q = query(q, where("categoryId", "==", category));
      }

      const snap = await getDocs(q);
      let list = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Product)
      );

      if (search) {
        list = list.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      setProducts(list);
      setLoading(false);
    }

    loadProducts();
  }, [type, category, search]);

  /* ---------------- UPDATE URL ---------------- */
  function updateFilter(key: string, value: string) {
    const url = new URLSearchParams(params.toString());
    value ? url.set(key, value) : url.delete(key);
    router.push(`/browse?${url.toString()}`);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Browse Marketplace
        </h1>
        <p className="text-sm text-gray-500">
          Discover products & services from verified vendors
        </p>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white border rounded-2xl p-4 grid md:grid-cols-4 gap-4">
        {/* TYPE */}
        <select
          value={type}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="input"
        >
          <option value="Product">Products</option>
          <option value="Service">Services</option>
        </select>

        {/* CATEGORY */}
        <select
          value={category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="input"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* SEARCH */}
        <input
          placeholder="Search products or services"
          value={search}
          onChange={(e) => updateFilter("q", e.target.value)}
          className="input md:col-span-2"
        />
      </div>

      {/* ================= RESULTS ================= */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading listings...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">
          No listings found.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="bg-white border rounded-2xl p-4 hover:shadow-md transition"
            >
              {/* IMAGE */}
              <div className="h-40 bg-gray-100 rounded-xl mb-3 overflow-hidden">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    className="h-full w-full object-cover"
                    alt={p.title}
                  />
                )}
              </div>

              {/* TITLE */}
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                {p.title}
              </h3>

              {/* META */}
              <p className="text-xs text-gray-500 mt-1">
                {p.listingType.join(", ")}
              </p>

              <p className="text-xs mt-2 text-gray-700">
                {p.priceType || "Price on request"}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* ================= STYLES ================= */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </main>
  );
}
