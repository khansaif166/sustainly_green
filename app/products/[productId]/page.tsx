"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { CheckCircle, Package, Globe, Tag } from "lucide-react";
import ContactVendorModal from "../../components/ContactVendorModal";
import BuyerRFQModal from "../../components/ContactVendorModal";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState<any>(null);

  useEffect(() => {
    async function fetchVendor() {
      if (!product?.vendorId) return;

      const snap = await getDoc(doc(db, "vendors", product.vendorId));
      if (snap.exists()) {
        setVendor(snap.data());
      }
    }

    fetchVendor();
  }, [product]);
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      const snap = await getDoc(doc(db, "products", productId as string));
      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Product not found
      </div>
    );
  }

  return (
   <main className="min-h-screen bg-gray-50 px-4 py-8">
  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

    {/* ================= IMAGES ================= */}
    <div>
      {Array.isArray(product.images) && product.images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {product.images.map((img: string, i: number) => (
            <img
              key={i}
              src={img}
              alt={product.title}
              className="rounded-xl border object-cover w-full h-56"
            />
          ))}
        </div>
      ) : (
        <div className="h-56 bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
          No Images
        </div>
      )}
    </div>

    {/* ================= DETAILS ================= */}
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {product.title}
        </h1>

        <div className="flex items-center gap-2 mt-2">
          {product.approved && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3" />
              Verified
            </span>
          )}

          <span className="text-xs text-gray-500">
            {product.listingType?.join(", ")}
          </span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <p className="text-sm text-gray-700 leading-relaxed">
        {product.description}
      </p>

      {/* META INFO */}
      <div className="grid grid-cols-2 gap-4 text-sm">
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

      {/* PRICE */}
      <div className="bg-white border rounded-2xl p-4">
        <p className="text-sm text-gray-500">Price</p>

        {product.priceType === "Price on Request" ? (
          <p className="text-lg font-semibold text-gray-900">
            Price on Request
          </p>
        ) : (
          <p className="text-lg font-semibold text-gray-900">
            {product.currency} {product.price}
            {product.priceType === "Starts From" && "+"}
          </p>
        )}

        {product.moq && (
          <p className="text-xs text-gray-500 mt-1">
            MOQ: {product.moq}
          </p>
        )}
      </div>

      {/* TAGS */}
      {product.sustainabilityTags?.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">
            Sustainability
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sustainabilityTags.map((t: string) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs"
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
        className="rounded-full bg-black text-white px-6 py-2"
      >
        Contact Vendor
      </button>
    </div>
  </div>

  {/* ================= RFQ MODAL (ONLY ONCE) ================= */}
  <BuyerRFQModal
    open={open}
    onClose={() => setOpen(false)}
    vendorId={product.vendorId}
    productId={product.id}
  />
</main>

  );
}

/* ================= SMALL COMPONENT ================= */

function MetaItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-gray-500 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}
