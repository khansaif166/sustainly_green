"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Globe2,
  MessageSquareText,
  Package,
  Tag,
  type LucideIcon,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import BuyerRFQModal from "../../components/ContactVendorModal";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  fetchApprovedProductById,
  type PublicProduct,
} from "@/lib/supabasePublic";

type Product = PublicProduct;

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

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

  useEffect(() => {
    const shouldOpenContact =
      new URLSearchParams(window.location.search).get("contact") === "1";
    if (shouldOpenContact && getStoredSession()) setOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Product not found
      </div>
    );
  }

  const listingLabel = Array.isArray(product.listingType)
    ? product.listingType.join(" · ")
    : product.listingType || "Product";
  const hasPublicPrice =
    typeof product.price === "number" &&
    product.price > 0 &&
    product.priceType !== "Price on Request";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f7f9f8] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-12">
            <section className="min-w-0 space-y-4" aria-label="Product images">
              <div className="aspect-[3/2] overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No image
                  </div>
                )}
              </div>

              {(product.images?.length ?? 0) > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {(product.images ?? []).map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      aria-label={`View product image ${index + 1}`}
                      aria-pressed={activeImage === image}
                      className={`shrink-0 overflow-hidden rounded-xl border-2 bg-white p-0.5 transition ${
                        activeImage === image
                          ? "border-emerald-600 shadow-sm"
                          : "border-transparent hover:border-emerald-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-16 w-20 rounded-lg object-cover sm:h-20 sm:w-24"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="min-w-0 lg:sticky lg:top-24">
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {listingLabel}
                  </span>
                  {product.ecoVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <img
                        src="/eco-verified-badge.png"
                        alt=""
                        className="h-5 w-5 object-contain"
                      />
                      Eco Verified
                    </span>
                  )}
                  {product.approved && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      <BadgeCheck className="h-4 w-4" strokeWidth={2.25} />
                      Approved listing
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-950 sm:text-4xl">
                  {product.title}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Supplied by{" "}
                  <Link
                    href={`/find-vendors/${product.vendorId}`}
                    className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    {product.vendorName}
                  </Link>
                </p>

                {product.description && (
                  <p className="mt-4 text-[15px] leading-7 text-gray-600">
                    {product.description}
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <MetaItem
                    icon={Package}
                    label="Available for"
                    value={product.availableFor?.join(", ") || "Not specified"}
                  />
                  <MetaItem
                    icon={Globe2}
                    label="Service area"
                    value={product.shipRegions?.join(", ") || "Not specified"}
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-gray-50 p-5 ring-1 ring-inset ring-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Pricing
                  </p>
                  {hasPublicPrice ? (
                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {product.currency} {product.price}
                      {product.priceType === "Starts From" && "+"}
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-2xl font-bold text-gray-950">
                        Contact for pricing
                      </p>
                      <p className="mt-1 text-sm leading-5 text-gray-500">
                        Pricing is shared privately based on quantity and delivery requirements.
                      </p>
                    </>
                  )}
                  {typeof product.moq === "number" && product.moq > 0 && (
                    <p className="mt-1 text-sm text-gray-600">
                      Minimum order:{" "}
                      <span className="font-semibold text-gray-800">
                        {product.moq}
                      </span>
                    </p>
                  )}
                </div>

                {(product.tagNames?.length ?? 0) > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Sustainability highlights
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(product.tagNames ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-800"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-7 border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <MessageSquareText className="h-5 w-5" />
                    Request pricing from vendor
                  </button>
                  <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                    Share your quantity and delivery needs directly with the
                    verified supplier.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <BuyerRFQModal
          open={open}
          onClose={() => setOpen(false)}
          vendorId={product.vendorId}
          productId={product.id}
          productTitle={product.title}
          productImage={activeImage}
          vendorName={product.vendorName}
          listingType={product.listingType}
        />
      </main>
      <Footer />
    </>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-5 text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}
