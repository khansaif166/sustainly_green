"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Megaphone,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Filter,
  Eye,
  MousePointerClick,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ================= TYPES ================= */

type Ad = {
  id: string;
  title: string;
  vendorId: string;
  images?: string[];

  // ad system
  isAd: boolean;
  adStatus: "PENDING" | "APPROVED" | "REJECTED";
  adActive?: boolean;

  // stats
  impressions?: number;
  clicks?: number;
  budget?: number;
};

/* ================= PAGE ================= */

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // pagination
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    setLoading(true);

    // 🔥 Ads are products where isAd == true
    const snap = await getDocs(collection(db, "products"));

    const list = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((p) => p.isAd === true);

    setAds(list);
    setLoading(false);
  }

  /* ================= STATS ================= */

  const totalAds = ads.length;
  const activeAds = ads.filter((a) => a.adActive && a.adStatus === "APPROVED").length;
  const pendingAds = ads.filter((a) => a.adStatus === "PENDING").length;

  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    return ads.filter((a) => {
      const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "ALL" || a.adStatus === status;
      return matchSearch && matchStatus;
    });
  }, [ads, search, status]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ================= ACTIONS ================= */

  async function updateStatus(id: string, newStatus: Ad["adStatus"]) {
    const adActive = newStatus === "APPROVED";

    await updateDoc(doc(db, "products", id), {
      adStatus: newStatus,
      adActive,
      updatedAt: serverTimestamp(),
    });

    setAds((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, adStatus: newStatus, adActive } : a,
      ),
    );
  }

  async function toggleActive(id: string, current: boolean) {
    await updateDoc(doc(db, "products", id), {
      adActive: !current,
      updatedAt: serverTimestamp(),
    });

    setAds((prev) =>
      prev.map((a) => (a.id === id ? { ...a, adActive: !current } : a)),
    );
  }

  async function deleteAd(id: string) {
    if (!confirm("Delete this ad permanently?")) return;

    await updateDoc(doc(db, "products", id), {
      isAd: false,
      adStatus: "REJECTED",
      adActive: false,
    });

    setAds((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading ads…</p>;
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-soft)] p-6 space-y-10">

      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Ads Management
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Approve, monitor and control promoted product ads
        </p>
      </section>

      {/* ================= KPI ================= */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI icon={Megaphone} label="Total Ads" value={totalAds} />
        <KPI icon={CheckCircle} label="Active Ads" value={activeAds} highlight />
        <KPI icon={Eye} label="Impressions" value={totalImpressions} />
        <KPI icon={MousePointerClick} label="Clicks" value={totalClicks} />
      </div>

      {/* ================= FILTER BAR ================= */}
      <section className="rounded-2xl bg-[var(--color-bg-white)] border border-[var(--color-border)] p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ad by product title"
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
      </section>

      {/* ================= ADS GRID ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginated.map((a) => (
          <div
            key={a.id}
            className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] shadow flex flex-col overflow-hidden"
          >
            <div className="relative h-52">
              {a.images?.[0] ? (
                <img src={a.images[0]} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full bg-[var(--color-bg-soft)] flex items-center justify-center text-xs">
                  No Image
                </div>
              )}

              <div className="absolute top-3 right-3">
                <StatusBadge status={a.adStatus} />
              </div>
            </div>

            <div className="p-5 flex flex-col gap-2 flex-1">
              <h2 className="text-sm font-semibold line-clamp-2">{a.title}</h2>

              <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                <span>👁 {a.impressions || 0}</span>
                <span>🖱 {a.clicks || 0}</span>
                {a.budget && <span>₹ {a.budget}</span>}
              </div>
            </div>

            <div className="p-4 border-t flex flex-wrap gap-2">

              {/* TOGGLE ACTIVE */}
              {a.adStatus === "APPROVED" && (
                <button
                  onClick={() => toggleActive(a.id, !!a.adActive)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                    ${
                      a.adActive
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  {a.adActive ? "Running" : "Paused"}
                </button>
              )}

              {/* APPROVE */}
              {a.adStatus !== "APPROVED" && (
                <button
                  onClick={() => updateStatus(a.id, "APPROVED")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              )}

              {/* REJECT */}
              {a.adStatus !== "REJECTED" && (
                <button
                  onClick={() => updateStatus(a.id, "REJECTED")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              )}

              {/* DELETE */}
              <button
                onClick={() => deleteAd(a.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg border disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}

/* ================= UI COMPONENTS ================= */

function KPI({ icon: Icon, label, value, highlight = false }: any) {
  return (
    <div
      className={`
        rounded-2xl p-4
        bg-[var(--color-bg-white)]
        shadow-[0_6px_24px_rgba(0,0,0,0.06)]
        flex items-center justify-between
        transition hover:shadow-lg
        ${highlight ? "ring-2 ring-[var(--color-solar-yellow)]" : ""}
      `}
    >
      <div>
        <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
        <p className="text-xl font-semibold text-[var(--color-text-primary)] mt-1">
          {value}
        </p>
      </div>

      <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center">
        <Icon className="h-5 w-5 text-[var(--color-primary-green)]" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles = {
    APPROVED:
      "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]",
    PENDING:
      "bg-[var(--color-solar-yellow)]/25 text-[var(--color-solar-yellow)]",
    REJECTED: "bg-red-100 text-red-600",
  };

  return (
    // <span
    //   className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    // >
    //   {status}
    // </span>
    <></>
  );
}
