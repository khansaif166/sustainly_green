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
import Header from "./components/Header";
import Footer from "./components/layouts/Footer";

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
  imageUrl?: string;
};

export default function HomePage() {
  const router = useRouter();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

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
          limit(10),
        );

        const snap = await getDocs(q);
        setCategories(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })),
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
  /* ---------------- LOAD FEATURED PRODUCTS ---------------- */
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const q = query(
          collection(db, "products"),
          where("approved", "==", true),
          where("featured", "==", true),
          orderBy("createdAt", "desc"),
          limit(6),
        );

        const snap = await getDocs(q);

        setFeaturedProducts(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          })),
        );
      } catch (err) {
        console.error("HOME_FEATURED_ERROR", err);
      }
    }

    fetchFeatured();
  }, []);

  /* ---------------- LOAD ALL PRODUCTS ---------------- */
  useEffect(() => {
    async function fetchAllProducts() {
      try {
        const q = query(
          collection(db, "products"),
          where("approved", "==", true),
          orderBy("createdAt", "desc"),
          limit(8),
        );

        const snap = await getDocs(q);

        setAllProducts(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          })),
        );
      } catch (err) {
        console.error("HOME_ALL_PRODUCTS_ERROR", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchAllProducts();
  }, []);

  return (
    <main className="bg-gray-50 min-h-screen w-full">
      <Header />
      {/* ================= HERO ================= */}
      <section className="max-w-full mx-auto rounded-2xl pt-5 pb-12  px-4">
        <section className="relative overflow-hidden  rounded-4xl h-125">
          {/* Background Image */}
          <div className="absolute inset-0">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-top"
              style={{
                backgroundImage: "url('/bgg.jpg')",
              }}
            />

            {/* Black Overlay */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0" />

          {/* Content */}
          <div className="relative  mx-auto px-6 pt-16 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* LEFT CONTENT */}
              <div>
                <span className="inline-block mb-3 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                  Sustainable B2B Marketplace
                </span>

                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Discover Verified <br />
                  <span className="text-white">Sustainable Products</span>{" "}
                  <br />
                  From Trusted Vendors
                </h1>

                <p className="mt-4 text-white text-sm max-w-xl">
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
      <section className="max-w-full px-10 mx-auto">
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
      <section className="max-w-full mx-auto px-10 py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-yellow-600">
              Handpicked
            </p>
            <h2 className="text-xl font-semibold text-gray-900">
              Featured Products
            </h2>
          </div>

          <Link
            href="/browse"
            className="text-sm font-medium text-[var(--color-ocean-blue)] hover:underline"
          >
            View all →
          </Link>
        </div>

        {loadingProducts ? (
          <p className="text-sm text-gray-500">Loading products...</p>
        ) : featuredProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No featured products yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {featuredProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="
            group bg-white rounded-3xl border border-gray-100 
            p-4 transition-all duration-300
            hover:shadow-xl hover:-translate-y-1 h-full
          "
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100 rounded-2xl mb-4 overflow-hidden h-[300px]">
                  {/* Featured badge */}
                  <span className="absolute top-3 left-3 z-10 bg-yellow-400 text-black text-xs font-semibold px-3 py-1 rounded-full shadow">
                    Featured
                  </span>

                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="
                  h-full w-full object-cover
                  transition-transform duration-500
                  group-hover:scale-105
                "
                    />
                  )}
                </div>

                {/* Content */}
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

      <section className="max-w-full mx-auto px-10 py-14 bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              New Arrivals
            </p>
            <h2 className="text-xl font-semibold text-gray-900">
              Latest Products
            </h2>
          </div>

          <Link
            href="/browse"
            className="text-sm font-medium text-[var(--color-ocean-blue)] hover:underline"
          >
            Browse all →
          </Link>
        </div>

        {loadingProducts ? (
          <p className="text-sm text-gray-500">Loading products...</p>
        ) : allProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No products found.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {allProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="
              group bg-white rounded-3xl border border-gray-100 
              p-4 transition-all duration-300
              hover:shadow-lg hover:-translate-y-1
            "
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100 rounded-2xl mb-4 overflow-hidden h-[300px]">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="
                    h-full w-full object-cover
                    transition-transform duration-500
                    group-hover:scale-105
                  "
                      />
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {p.title}
                  </h3>

                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {p.description}
                  </p>
                </Link>
              ))}
            </div>

            {/* Browse All Button */}
            <div className="mt-10 flex justify-center">
              <Link
                href="/browse"
                className="
            rounded-full px-8 py-3
            bg-[var(--color-primary-green)]
            text-white text-sm font-semibold
            shadow-lg hover:shadow-xl hover:brightness-95
            transition
          "
              >
                Browse All Products
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ================= CTA ================= */}
      <section className="max-w-full mx-auto px-6 py-16">
        <div
          className="
      relative overflow-hidden
      rounded-3xl p-10 text-center
      bg-gradient-to-r
      from-[var(--color-primary-green)]
      to-[var(--color-ocean-blue)]
      shadow-[0_30px_80px_rgba(0,0,0,0.18)]
    "
        >
          {/* Soft overlay for depth */}
          <div
            className="
        absolute inset-0
        bg-white/5
        backdrop-blur-sm
        pointer-events-none
      "
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-white text-2xl font-semibold">
              Ready to join the sustainable economy?
            </h3>

            <p className="text-white/90 text-sm mt-2">
              Create your account and start connecting with verified buyers &
              vendors worldwide.
            </p>

            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="
            rounded-full
            bg-[var(--color-solar-yellow)]
            text-black
            px-6 py-2.5
            text-sm font-semibold
            hover:brightness-95
            transition
          "
              >
                Create Account
              </Link>

              <Link
                href="/login"
                className="
            rounded-full
            border border-white/40
            text-white
            px-6 py-2.5
            text-sm font-medium
            hover:bg-white/10
            transition
          "
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
