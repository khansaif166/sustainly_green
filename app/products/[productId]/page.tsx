"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApprovedProductById, type PublicProduct } from "@/lib/supabasePublic";
import { CheckCircle, Package, Globe, Tag, ArrowLeft } from "lucide-react";
import BuyerRFQModal from "../../components/ContactVendorModal";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import Link from "next/link";

/* ================= TYPES ================= */

type Product = PublicProduct;

/* ================= PAGE ================= */

export default function ProductDetailPage() {
  const { productId } = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  /* ---------- FETCH PRODUCT ---------- */
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      try {
        const data = await fetchApprovedProductById(productId as string);
        setProduct(data);
        setActiveImage(data?.images?.[0] || null);
      } catch (error) {
        console.error("Failed to load Supabase product", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-(--color-text-muted)">
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-(--color-text-muted)">
        Product not found
      </div>
    );
  }

  function MetaItem({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-(--color-border) bg-white p-4">
        {/* Icon */}
        <div className="mt-0.5 rounded-lg bg-(--color-bg-soft) p-2">
          <Icon className="h-4 w-4 text-(--color-ocean-blue)" />
        </div>

        {/* Text */}
        <div>
          {/* Label */}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-(--color-ocean-blue)">
            {label}
          </p>

          {/* Value */}
          <p className="mt-1 text-sm font-medium text-(--color-text-primary)">
            {value}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-(--color-bg-soft) px-4 py-5">
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
          transition left-4 mb-6 
        "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ================= IMAGE GALLERY ================= */}
          <div className="space-y-4">
            {/* MAIN IMAGE */}
            <div className="bg-(--color-bg-white) border border-(--color-border) rounded-3xl overflow-hidden">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-(--color-text-muted)">
                  No image
                </div>
              )}
            </div>

            {/* THUMBNAILS */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`shrink-0 rounded-xl border-2 overflow-hidden transition
                    ${
                      activeImage === img
                        ? "border-(--color-primary-green)"
                        : "border-(--color-border) hover:border-(--color-primary-green)"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title}-${i}`}
                      className="h-20 w-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= DETAILS ================= */}
          <div className="space-y-8">
            {/* TITLE + BADGES */}
            <div>
              <h1 className="text-3xl font-semibold text-(--color-text-primary)">
                {product.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {product.approved && (
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                  bg-(--color-leaf-green)/20 text-(--color-primary-green) text-xs font-medium"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Verified Vendor
                  </span>
                )}

                <span className="text-xs text-(--color-text-secondary)">
                  {Array.isArray(product.listingType)
                    ? product.listingType.join(", ")
                    : product.listingType}
                </span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <p className="text-sm leading-relaxed text-(--color-text-secondary)">
              {product.description}
            </p>

            {/* META INFO */}
            <div className="grid sm:grid-cols-2 gap-4">
              <MetaItem
                icon={Package}
                label="Available For"
                value={product.availableFor?.join(", ") || "—"}
              />
              <MetaItem
                icon={Globe}
                label="Ships To"
                value={product.shipRegions?.join(", ") || "—"}
              />
            </div>

            {/* PRICE CARD */}
            <div className="bg-(--color-bg-white) border border-(--color-border) rounded-2xl p-5">
              <p className="text-xs text-(--color-text-muted)">Price</p>

              {product.priceType === "Price on Request" ? (
                <p className="text-xl font-semibold text-(--color-text-primary)">
                  Price on Request
                </p>
              ) : (
                <p className="text-xl font-semibold text-(--color-text-primary)">
                  {product.currency} {product.price}
                  {product.priceType === "Starts From" && "+"}
                </p>
              )}

              {product.moq && (
                <p className="text-xs text-(--color-text-muted) mt-1">
                  MOQ: {product.moq}
                </p>
              )}
            </div>

            {/* SUSTAINABILITY */}
            {(product.sustainabilityTags?.length ?? 0) > 0 && (
              <div>
                <p className="text-sm font-medium text-(--color-text-primary) mb-3">
                  Sustainability
                </p>

                <div className="flex flex-wrap gap-2">
                  {(product.tagNames ?? []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full
      bg-(--color-bg-soft) text-xs text-(--color-text-secondary)"
                    >
                      <Tag className="h-3 w-3" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center
              rounded-full px-8 py-3
              bg-(--color-solar-yellow) text-black
              font-semibold text-sm
              hover:brightness-95 transition"
            >
              Contact Vendor
            </button>
          </div>
        </div>

        {/* ================= MODAL ================= */}
        <BuyerRFQModal
          open={open}
          onClose={() => setOpen(false)}
          vendorId={product.vendorId}
          productId={product.id}
        />
      </main>
      <Footer />
    </>
  );
}

/* ================= SMALL COMPONENT ================= */

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-(--color-bg-white) border border-(--color-border) rounded-xl p-4 flex gap-3">
      <Icon className="h-5 w-5 text-(--color-ocean-blue)" />
      <div>
        <p className="text-xs text-(--color-text-muted)">{label}</p>
        <p className="text-sm font-medium text-(--color-text-primary)">
          {value}
        </p>
      </div>
    </div>
  );
}
