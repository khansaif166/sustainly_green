"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { PlusCircle, Clock, CheckCircle } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string;
  images?: string[];
  approved: boolean;
};

export default function VendorProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH + LOAD PRODUCTS ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const q = query(
        collection(db, "products"),
        where("vendorId", "==", user.uid)
      );

      const snap = await getDocs(q);
      setProducts(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <p className="p-6 text-sm text-[var(--color-text-secondary)]">
        Loading your products…
      </p>
    );
  }

  return (
    <main className="space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            My Products
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            View and manage your listed products
          </p>
        </div>

        <button
          onClick={() => router.push("/vendor/products/new")}
          className="
            inline-flex items-center gap-2
            rounded-full px-4 py-2 text-sm font-medium text-white
            bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
            hover:opacity-90
          "
        >
          <PlusCircle className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {products.length === 0 && (
        <div className="
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          rounded-3xl p-10 text-center
        ">
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            You haven’t added any products yet.
          </p>
          <button
            onClick={() => router.push("/vendor/products/new")}
            className="
              inline-flex items-center gap-2
              rounded-full px-5 py-2 text-sm font-medium text-white
              bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
            "
          >
            <PlusCircle className="h-4 w-4" />
            Add your first product
          </button>
        </div>
      )}

      {/* ================= PRODUCTS GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="
              bg-[var(--color-bg-white)]
              rounded-3xl
              border border-[var(--color-border)]
              shadow-[0_10px_30px_rgba(0,0,0,0.06)]
              overflow-hidden
              flex flex-col
            "
          >
            {/* IMAGE */}
            {p.images?.length ? (
              <img
                src={p.images[0]}
                alt={p.title}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="
                h-44
                bg-[var(--color-bg-soft)]
                flex items-center justify-center
                text-xs text-[var(--color-text-secondary)]
              ">
                No Image
              </div>
            )}

            {/* CONTENT */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-2 gap-2">
                <h2 className="
                  text-sm font-semibold
                  text-[var(--color-text-primary)]
                  line-clamp-1
                ">
                  {p.title}
                </h2>

                {p.approved ? (
                  <span className="
                    inline-flex items-center gap-1
                    text-[11px] px-2 py-0.5 rounded-full
                    bg-[var(--color-primary-green)]/10
                    text-[var(--color-primary-green)]
                  ">
                    <CheckCircle className="h-3 w-3" />
                    Approved
                  </span>
                ) : (
                  <span className="
                    inline-flex items-center gap-1
                    text-[11px] px-2 py-0.5 rounded-full
                    bg-[var(--color-solar-yellow)]/25
                    text-[var(--color-solar-yellow)]
                  ">
                    <Clock className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>

              <p className="
                text-sm text-[var(--color-text-secondary)]
                line-clamp-2 mb-4
              ">
                {p.description}
              </p>

              {/* ACTION */}
              <div className="mt-auto flex justify-end">
                <button
                  onClick={() =>
                    router.push(`/vendor/products/${p.id}`)
                  }
                  className="
                    text-xs font-medium
                    text-[var(--color-ocean-blue)]
                    hover:underline
                  "
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
