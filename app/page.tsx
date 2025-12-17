"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";

type Product = {
  id: string;
  title: string;
  description: string;
  images?: string[];
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(
          collection(db, "products"),
          where("approved", "==", true),
          orderBy("createdAt", "desc"),
          limit(6)
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        setProducts(list);
      } catch (err) {
        console.error("HOME_PRODUCTS_ERROR", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ---------- HERO ---------- */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block mb-3 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
              Sustainable B2B Marketplace
            </span>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Discover Verified <br />
              <span className="text-black">Sustainable Products</span> <br />
              From Trusted Vendors
            </h1>

            <p className="mt-4 text-gray-600 text-sm max-w-xl">
              Sustainly connects buyers with verified eco-friendly vendors
              worldwide.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/register"
                className="rounded-full bg-black text-white px-5 py-2 text-sm font-medium"
              >
                Join as Vendor
              </Link>

              <Link
                href="/explore"
                className="rounded-full border border-gray-200 bg-white text-gray-700 px-5 py-2 text-sm font-medium"
              >
                Browse Products
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="h-40 bg-gray-100 rounded-lg mb-3" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURED PRODUCTS ---------- */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-900">
            Featured Products
          </h2>

          <Link
            href="/explore"
            className="text-sm text-gray-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">
            No approved products yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="h-36 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {p.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {p.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------- CTA ---------- */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="bg-black rounded-2xl p-8 text-center">
          <h3 className="text-white text-xl font-semibold">
            Ready to join the sustainable economy?
          </h3>
          <p className="text-gray-300 text-sm mt-2">
            Create your account and start connecting today.
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 text-white px-5 py-2 text-sm font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-900">
            © {new Date().getFullYear()} Sustainly. All rights reserved.
          </p>

          <div className="flex gap-4 text-xs text-gray-900">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
