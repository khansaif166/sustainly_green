"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Filter,
  Star,
  Megaphone,
} from "lucide-react";

/* ================= TYPES ================= */

type Product = {
  vendorName: string;
  id: string;
  title: string;
  description: string;
  images?: string[];
  categoryId: string;
  subCategoryId: string;
  vendorId: string;
  price?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  featured?: boolean;
  isAd?: boolean;
};

/* ================= PAGE ================= */

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [subCategories, setSubCategories] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [category, setCategory] = useState("ALL");

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    async function load() {
      const [pSnap, vSnap, cSnap, sSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "vendors")),
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "subcategories")),
      ]);

      setProducts(
        pSnap.docs.map((d) => {
          const data = d.data() as any;

          return {
            id: d.id,
            ...data,
            status:
              data.status || (data.approved ? "APPROVED" : "PENDING"),
            featured: !!data.featured,
            isAd: !!data.isAd,
          };
        }),
      );

      // FIXED: use companyName instead of company
      setVendors(
        Object.fromEntries(
          vSnap.docs.map((d) => [d.id, d.data().companyName]),
        ),
      );

      setCategories(
        Object.fromEntries(cSnap.docs.map((d) => [d.id, d.data().name])),
      );

      setSubCategories(
        Object.fromEntries(sSnap.docs.map((d) => [d.id, d.data().name])),
      );

      setLoading(false);
    }

    load();
  }, []);

  /* ================= ACTIONS ================= */

  async function updateStatus(id: string, newStatus: Product["status"]) {
    let approved = false;
    let visibleToBuyers = false;

    if (newStatus === "APPROVED") {
      approved = true;
      visibleToBuyers = true;
    }

    if (newStatus === "REJECTED") {
      approved = false;
      visibleToBuyers = false;
    }

    if (newStatus === "PENDING") {
      approved = false;
      visibleToBuyers = false;
    }

    await updateDoc(doc(db, "products", id), {
      status: newStatus,
      approved,
      visibleToBuyers,
      updatedAt: serverTimestamp(),
    });

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: newStatus }
          : p,
      ),
    );
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function toggleFeatured(id: string, current: boolean) {
    await updateDoc(doc(db, "products", id), {
      featured: !current,
      updatedAt: serverTimestamp(),
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !current } : p)),
    );
  }

  async function toggleAd(id: string, current: boolean) {
    await updateDoc(doc(db, "products", id), {
      isAd: !current,
      updatedAt: serverTimestamp(),
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAd: !current } : p)),
    );
  }

  /* ================= FILTER ================= */

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        vendors[p.vendorId]?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = status === "ALL" || p.status === status;
      const matchCategory = category === "ALL" || p.categoryId === category;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [products, search, status, category, vendors]);

  if (loading) {
    return (
      <p className="p-6 text-sm text-[var(--color-text-secondary)]">
        Loading products…
      </p>
    );
  }

  return (
    <main className="max-w-full mx-auto space-y-8">
      {/* HEADER */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Product Review
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Review and approve vendor product listings
        </p>
      </section>

      {/* FILTER BAR */}
      <section className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border)] p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or vendor"
            className="w-full rounded-xl border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm"
          />
        </div>

        <div className="relative w-full md:w-44">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full rounded-xl border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="relative w-full md:w-48">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(categories).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] shadow flex flex-col overflow-hidden"
          >
            <div className="relative h-84">
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full bg-[var(--color-bg-soft)] flex items-center justify-center text-xs">
                  No Image
                </div>
              )}
              <div className="absolute top-3 right-3">
                <StatusBadge status={p.status} />
              </div>
            </div>

            <div className="p-5 flex flex-col gap-2 flex-1">
              <h2 className="text-sm font-semibold line-clamp-2">
                {p.title}
              </h2>

              <p className="text-xs text-[var(--color-text-secondary)]">
                by {p.vendorName || "Unknown vendor"}
              </p>

              <p className="text-sm font-medium truncate opacity-80">
                {p.description}
              </p>

              {p.price && (
                <p className="text-sm font-semibold text-[var(--color-primary-green)]">
                  ₹{p.price}
                </p>
              )}
            </div>

            <div className="p-4 border-t flex flex-wrap gap-2">
              <button
                onClick={() => toggleFeatured(p.id, !!p.featured)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  p.featured
                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                <Star className="h-4 w-4 inline mr-1" />
                {p.featured ? "Featured" : "Feature"}
              </button>

              <button
                onClick={() => toggleAd(p.id, !!p.isAd)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  p.isAd
                    ? "bg-purple-100 text-purple-700 border-purple-300"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                <Megaphone className="h-4 w-4 inline mr-1" />
                {p.isAd ? "Ad Running" : "Run Ad"}
              </button>

              {p.status !== "APPROVED" && (
                <button
                  onClick={() => updateStatus(p.id, "APPROVED")}
                  className="px-3 py-1.5 rounded-full text-xs bg-green-600 text-white"
                >
                  Approve
                </button>
              )}

              {p.status !== "REJECTED" && (
                <button
                  onClick={() => updateStatus(p.id, "REJECTED")}
                  className="px-3 py-1.5 rounded-full text-xs bg-red-100 text-red-700"
                >
                  Reject
                </button>
              )}

              <button
                onClick={() => deleteProduct(p.id)}
                className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

/* ================= UI ================= */

function StatusBadge({ status }: { status: Product["status"] }) {
  const styles = {
    APPROVED:
      "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]",
    PENDING:
      "bg-[var(--color-solar-yellow)]/25 text-[var(--color-solar-yellow)]",
    REJECTED: "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
