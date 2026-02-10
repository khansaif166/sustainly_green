"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Users,
  Store,
  Package,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";

/* ================= PAGE ================= */

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);

  const [recentRFQs, setRecentRFQs] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [
      userSnap,
      vendorSnap,
      productSnap,
      rfqSnap,
      categorySnap,
      recentRFQsSnap,
      recentProductsSnap,
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "vendors")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "rfqs")),
      getDocs(collection(db, "categories")),
      getDocs(
        query(collection(db, "rfqs"), orderBy("createdAt", "desc"), limit(5)),
      ),
      getDocs(
        query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          limit(5),
        ),
      ),
    ]);

    setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setVendors(vendorSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setRfqs(rfqSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    setRecentRFQs(recentRFQsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setRecentProducts(
      recentProductsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    );

    setCategories(
      Object.fromEntries(categorySnap.docs.map((d) => [d.id, d.data().name])),
    );

    setLoading(false);
  }

  /* ================= METRICS ================= */

  const pendingVendors = vendors.filter((v) => !v.approved).length;
  const approvedVendors = vendors.filter((v) => v.approved).length;

  const pendingProducts = products.filter((p) => p.status === "PENDING").length;
  const approvedProducts = products.filter(
    (p) => p.status === "APPROVED",
  ).length;

  /* ================= PRODUCT BY CATEGORY ================= */

  const productsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      if (!p.categoryId) return;
      map[p.categoryId] = (map[p.categoryId] || 0) + 1;
    });

    return Object.entries(map).map(([id, count]) => ({
      name: categories[id] || "Unknown",
      value: count,
    }));
  }, [products, categories]);

  /* ================= GROWTH BAR ================= */

  const growthData = [
    { name: "Users", count: users.length },
    { name: "Vendors", count: vendors.length },
    { name: "Products", count: products.length },
    { name: "RFQs", count: rfqs.length },
  ];

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading dashboard…</p>;
  }

  return (
    <main className="max-w-full mx-auto space-y-10">
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
      <section>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time system overview & analytics
        </p>
      </section>

      {/* ================= TOP STATS ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Users" value={users.length} icon={<Users />} />
        <StatCard title="Vendors" value={vendors.length} icon={<Store />} />
        <StatCard title="Products" value={products.length} icon={<Package />} />
        <StatCard title="RFQs" value={rfqs.length} icon={<ClipboardList />} />
      </section>

      {/* ================= STATUS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MiniCard
          title="Pending Vendors"
          value={pendingVendors}
          icon={<AlertCircle />}
        />
        <MiniCard
          title="Approved Vendors"
          value={approvedVendors}
          icon={<CheckCircle />}
        />
        <MiniCard
          title="Pending Products"
          value={pendingProducts}
          icon={<Clock />}
        />
        <MiniCard
          title="Approved Products"
          value={approvedProducts}
          icon={<CheckCircle />}
        />
      </section>

      {/* ================= CHARTS ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-sm font-semibold mb-4">Platform Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0b6e4f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-sm font-semibold mb-4">Products by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productsByCategory}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                >
                  {productsByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ================= RECENT RFQS ================= */}
      <section className="rounded-2xl border bg-white shadow border-gray-200 overflow-hidden">
        <div className="p-5 border-b  border-gray-200 border-b-2 font-semibold">
          Recent RFQs
        </div>
        <div className="divide-y divide-gray-200 text-sm">
          {recentRFQs.map((r) => (
            <div key={r.id} className="px-5 py-4 space-y-2">
              {/* Top row */}
              <div className="flex justify-between items-center">
                <p className="font-small">
                  <span>Requirement:</span> {r.requirementTitle || "RFQ"}
                </p>
                <span
                  className={`
          text-xs px-2 py-1 rounded-full font-medium
          ${
            r.status === "ACCEPTED"
              ? "bg-green-100 text-green-700"
              : r.status === "REJECTED"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }
        `}
                >
                  {r.status || "OPEN"}
                </span>
              </div>

              {/* Buyer info */}
              <p className="text-xs text-gray-600">
                <span className="text-black">Buyer:</span> {r.buyerName} •{" "}
                {r.buyerEmail}
              </p>

              {/* Requirement details */}
              <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                <span>
                  <span className="text-black">Qty: </span>{" "}
                  {r.estimatedQuantity || "-"}
                </span>
                <span>
                  <span className="text-black">Country:</span>{" "}
                  {r.deliveryCountry || "-"}
                </span>
                <span>
                  <span className="text-black">Timeline:</span>{" "}
                  {r.requiredTimeline || "-"}
                </span>
              </div>

              {/* Vendor response */}
              {r.vendorResponse?.price && (
                <div className="text-xs text-gray-700 mt-1">
                  Vendor Quote: {r.vendorResponse.currency}{" "}
                  {r.vendorResponse.price}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= RECENT PRODUCTS ================= */}
      <section className="rounded-2xl border  border-gray-200 bg-white shadow overflow-hidden">
        <div className="p-5 border-b border-gray-100 font-semibold">
          Recent Products
        </div>
        <div className="divide-y divide-gray-200 text-sm">
          {recentProducts.map((p) => (
            <div
              key={p.id}
              className="px-5 py-3 flex items-center justify-between gap-4"
            >
              {/* LEFT */}
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{p.title}</span>

                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>₹{p.price || 0}</span>
                  <span>{p.listingType}</span>

                  {p.isAd && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                      Ad
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT STATUS */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium
            ${
              p.status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
                >
                  {p.status}
                </span>

                {p.isAd && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium
              ${
                p.adActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
                  >
                    {p.adActive ? "Running" : "Paused"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {recentProducts.length === 0 && (
            <div className="p-5 text-gray-500">No products found</div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ================= UI ================= */

function StatCard({ title, value, icon }: any) {
  return (
    <div className="rounded-2xl p-5 text-white shadow bg-gradient-to-br from-[var(--color-primary-green)] to-[#a2c945]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-90">{icon}</div>
      </div>
    </div>
  );
}

function MiniCard({ title, value, icon }: any) {
  return (
    <div className="rounded-2xl bg-white  shadow p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-[var(--color-primary-green)]">{icon}</div>
    </div>
  );
}

const COLORS = ["#0b6e4f", "#a2c945", "#6bcf9b", "#f4c430", "#e6d8a3"];
