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
  id: string;
  title: string;
  description: string;
  images?: string[];
  categoryId: string;
  subCategoryId: string;
  tags?: string[];
  vendorId: string;
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
        pSnap.docs.map((d) => ({
          id: d.id,
          status: d.data().status || "PENDING",
          featured: d.data().featured || false,
          isAd: d.data().isAd || false,
          ...(d.data() as any),
        })),
      );

      setVendors(
        Object.fromEntries(vSnap.docs.map((d) => [d.id, d.data().company])),
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
    const approved = newStatus === "APPROVED";

    await updateDoc(doc(db, "products", id), {
      status: "APPROVED",
      approved: true,
      updatedAt: serverTimestamp(),
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
    );
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
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

  if (loading) {
    return (
      <p className="p-6 text-sm text-[var(--color-text-secondary)]">
        Loading products…
      </p>
    );
  }

  return (
    <main className="max-w-full mx-auto space-y-8">
      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Product Review
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Review and approve vendor product listings
        </p>
      </section>

      {/* ================= FILTER BAR ================= */}
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

      {/* ================= GRID ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] shadow flex flex-col overflow-hidden"
          >
            <div className="relative h-84">
              {p.images?.[0] ? (
                <img src={p.images[0]} className="h-full w-full object-cover" />
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
              <h2 className="text-sm font-semibold line-clamp-2">{p.title}</h2>
              {/* <p className="text-xs text-[var(--color-text-secondary)]">
                by {vendors[p.vendorId]}
              </p> */}
              <p className="text-sm font-medium truncate opacity-80">
                {p.description}
              </p>
            </div>

            <div className="p-4 border-t flex flex-wrap gap-2 relative">
              {/* FEATURE TOGGLE */}
              <button
                onClick={() => toggleFeatured(p.id, !!p.featured)}
                className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
      ${
        p.featured
          ? "bg-yellow-100 text-yellow-700 border-yellow-300"
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
      }
    `}
              >
                <Star
                  className={`h-4 w-4 ${p.featured ? "text-yellow-500" : ""}`}
                />
                {p.featured ? "Featured" : "Feature"}
              </button>

              {/* ADS TOGGLE */}
              <button
                onClick={() => toggleAd(p.id, !!p.isAd)}
                className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
      ${
        p.isAd
          ? "bg-purple-100 text-purple-700 border-purple-300"
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
      }
    `}
              >
                <Megaphone className="h-4 w-4" />
                {p.isAd ? "Ad Running" : "Run Ad"}
              </button>

              {/* APPROVE */}
              {p.status !== "APPROVED" && (
                <button
                  onClick={() => updateStatus(p.id, "APPROVED")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              )}

              {/* REJECT */}
              {p.status !== "REJECTED" && (
                <button
                  onClick={() => updateStatus(p.id, "REJECTED")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              )}

              {/* DELETE */}
              <button
                onClick={() => deleteProduct(p.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
              >
                <Trash2 className="h-4 w-4" />
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

function ActionBtn({ label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]"
    >
      {icon} {label}
    </button>
  );
}

function SecondaryBtn({ label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs border border-[var(--color-border)]"
    >
      {icon} {label}
    </button>
  );
}
