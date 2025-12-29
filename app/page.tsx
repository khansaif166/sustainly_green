"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ---------------- TYPES ---------------- */
type Product = {
  id: string;
  title: string;
  description: string;
  images?: string[];
};

type Category = {
  id: string;
  name: string;
  imageUrl?: string; // ✅ FIXED
};

export default function HomePage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  /* ---------------- LOAD CATEGORIES ---------------- */
  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(
          collection(db, "categories"),
          where("active", "==", true),
          limit(10)
        );

        const snap = await getDocs(q);
        setCategories(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
        );
      } catch (err) {
        console.error("HOME_CATEGORIES_ERROR", err);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (dir: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  /* ---------------- LOAD PRODUCTS ---------------- */
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
        setProducts(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          }))
        );
      } catch (err) {
        console.error("HOME_PRODUCTS_ERROR", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto rounded-2xl pt-16 pb-12">
        <section className="relative overflow-hidden  rounded-4xl">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-top bg-white/80 backdrop-blur-sm"
            style={{
              backgroundImage: "url('/bgg.jpg')",
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-0" />

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* LEFT CONTENT */}
              <div>
                <span className="inline-block mb-3 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                  Sustainable B2B Marketplace
                </span>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  Discover Verified <br />
                  <span className="text-black">Sustainable Products</span>{" "}
                  <br />
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
                    href="/browse"
                    className="rounded-full border border-gray-200 bg-white text-gray-700 px-5 py-2 text-sm font-medium"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>

              {/* RIGHT PREVIEW CARD */}
              {/* <div className="hidden md:block">
                <div className="bg-white/90 rounded-2xl border border-gray-100 shadow-sm p-6 backdrop-blur">
                  <div className="h-40 bg-gray-100 rounded-lg mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div> */}
            </div>
          </div>
        </section>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Browse by Category
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Explore products & services by category
            </p>
          </div>

          {/* Desktop arrows */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scrollCategories("left")}
              className="p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollCategories("right")}
              className="p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loadingCategories ? (
          <p className="text-sm text-gray-500">Loading categories...</p>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
          >
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/browse?category=${c.id}`)}
                className="flex-shrink-0 flex flex-col items-center group"
              >
                {/* Circle Image */}
                <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center transition-shadow group-hover:shadow-md">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </div>

                {/* Category Name */}
                <p className="mt-3 text-sm font-medium text-gray-900 text-center whitespace-nowrap">
                  {c.name}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-900">
            Featured Products
          </h2>

          <Link
            href="/browse"
            className="text-sm text-gray-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {loadingProducts ? (
          <p className="text-sm text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">No approved products yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="h-88 object-contain bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
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

      {/* ================= CTA ================= */}
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
    </main>
  );
}
