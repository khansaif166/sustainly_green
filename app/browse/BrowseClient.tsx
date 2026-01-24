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
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import { ArrowLeft, Building2 } from "lucide-react";

/* ---------------- TYPES ---------------- */

type Product = {
  id: string;
  title?: string;
  images?: string[];
  listingType?: string[];
  categoryId?: string;
  priceType?: string;
};

type Vendor = {
  id: string;
  companyName?: string;
  description?: string;
  approved?: boolean;
};

type Category = {
  id: string;
  name: string;
};

/* ================= PAGE ================= */

export default function BrowsePage() {
  const router = useRouter();
  const params = useSearchParams();

  /* URL PARAMS (single source of truth) */
  const type = params.get("type") || "Product"; // Product | Vendor
  const category = params.get("category") || "";
  const search = params.get("q") || "";

  /* STATE */
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    async function load() {
      setLoading(true);

      /* ================= PRODUCTS ================= */
      if (type === "Product") {
        let qRef = query(
          collection(db, "products"),
          where("approved", "==", true),
          where("listingType", "array-contains", "Product"),
          orderBy("title"),
          limit(50)
        );

        if (category) {
          qRef = query(qRef, where("categoryId", "==", category));
        }

        const snap = await getDocs(qRef);
        let list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Product)
        );

        if (search) {
          const s = search.toLowerCase();
          list = list.filter((p) =>
            (p.title || "").toLowerCase().includes(s)
          );
        }

        setProducts(list);
        setVendors([]);
      }

      /* ================= VENDORS ================= */
      if (type === "Vendor") {
        const snap = await getDocs(collection(db, "vendors"));
        let list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Vendor)
        );

        if (search) {
          const s = search.toLowerCase();
          list = list.filter(
            (v) =>
              (v.companyName || "").toLowerCase().includes(s) ||
              (v.description || "").toLowerCase().includes(s)
          );
        }

        setVendors(list);
        setProducts([]);
      }

      setLoading(false);
    }

    load();
  }, [type, category, search]);

  /* ---------------- UPDATE URL ---------------- */
  function updateFilter(key: string, value: string) {
    const url = new URLSearchParams(params.toString());
    value ? url.set(key, value) : url.delete(key);
    router.push(`/browse?${url.toString()}`);
  }

  /* ================= UI ================= */

  return (
    <>
      <Header />

      <main className="max-w-full mx-auto px-6 py-8 space-y-6">
         <Link
        href="/"
        className="
          inline-flex items-center gap-2
          px-5 py-2.5
          rounded-full text-sm font-medium
          bg-[var(--color-bg-white)]
          text-[var(--color-ocean-blue)]
          border border-[var(--color-border)]
          hover:bg-[var(--color-ocean-blue)]
          hover:text-white
          transition
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Browse Marketplace
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Discover products and vendors focused on sustainability
          </p>
        </div>

        {/* ================= FILTER BAR ================= */}
        <div className="bg-[var(--color-bg-white)] border border-[var(--color-border)] rounded-2xl p-4 grid md:grid-cols-4 gap-4">
          {/* TYPE */}
          <select
            value={type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="input"
          >
            <option value="Product" className="w-[100px]">Products</option>
            <option value="Vendor" className="w-[100px]">Vendors</option>
          </select>

          {/* CATEGORY (only products) */}
          {type === "Product" ? (
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
          ) : (
            <div />
          )}

          {/* SEARCH */}
          <input
            placeholder={
              type === "Vendor"
                ? "Search vendors by name or description"
                : "Search products"
            }
            value={search}
            onChange={(e) => updateFilter("q", e.target.value)}
            className="input md:col-span-2"
          />
        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <p className="text-sm text-center text-[var(--color-text-muted)]">
            Loading results…
          </p>
        )}

        {/* ================= PRODUCTS ================= */}
        {!loading && type === "Product" && (
          <>
            {products.length === 0 ? (
              <p className="text-sm text-center text-[var(--color-text-muted)]">
                No products found.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="bg-[var(--color-bg-white)] rounded-2xl p-4 transition hover:shadow-lg"
                  >
                    <div className="h-80 bg-[var(--color-bg-soft)] rounded-xl mb-3 overflow-hidden">
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          className="h-full w-full object-cover"
                          alt={p.title || "Product"}
                        />
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2">
                      {p.title}
                    </h3>

                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {p.listingType?.join(", ")}
                    </p>

                    <p className="text-xs mt-2 text-[var(--color-text-primary)]">
                      {p.priceType || "Price on request"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ================= VENDORS ================= */}
        {!loading && type === "Vendor" && (
          <>
            {vendors.length === 0 ? (
              <p className="text-sm text-center text-[var(--color-text-muted)]">
                No vendors found.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {vendors.map((v) => (
                  <Link
                    key={v.id}
                    href={`/find-vendors/${v.id}`}
                    className="bg-[var(--color-bg-white)] rounded-2xl p-6 space-y-3 shadow hover:shadow-lg transition"
                  >
                    <div className="h-12 w-12 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-[var(--color-primary-green)]" />
                    </div>

                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {v.companyName || "Unnamed Vendor"}
                    </h3>

                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">
                      {v.description || "Sustainable vendor on Sustainly"}
                    </p>

                    <span className="text-xs font-medium text-[var(--color-primary-green)]">
                      View Vendor →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ================= INPUT STYLES ================= */}
        <style jsx global>{`
          .input {
            width: 100%;
            background: var(--color-bg-white);
            border: 1px solid var(--color-border);
            border-radius: 0.75rem;
            padding: 0.6rem 0.75rem;
            font-size: 0.875rem;
            color: var(--color-text-primary);
          }

          .input:focus {
            outline: none;
            border-color: var(--color-primary-green);
            box-shadow: 0 0 0 2px rgba(11, 110, 79, 0.15);
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}
