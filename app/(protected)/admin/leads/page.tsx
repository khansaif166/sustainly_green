"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import * as XLSX from "xlsx";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const pageSize = 15;

  useEffect(() => {
    loadLeads(false);
  }, []);

  async function loadLeads(next = false) {
  if (loading) return;

  setLoading(true);

  try {
    let q;

    if (next && lastDoc) {
      q = query(
        collection(db, "rfqs"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, "rfqs"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
    }

    const snap = await getDocs(q);

    const newLeads = snap.docs.map((doc) => normalizeRFQ(doc));

    setLeads((prev) => {
      const merged = next ? [...prev, ...newLeads] : newLeads;

      // remove duplicates
      return Array.from(
        new Map(merged.map((i) => [i.id, i])).values()
      );
    });

    setLastDoc(snap.docs[snap.docs.length - 1] || null);
  } catch (e) {
    console.error("Leads load error:", e);
  } finally {
    setLoading(false);
  }
}

  function normalizeRFQ(doc: any) {
    const d = doc.data();
    const isGlobal = d.type === "GLOBAL";

    return {
      id: doc.id,
      type: isGlobal ? "GLOBAL" : "DIRECT",
      name: isGlobal ? d.name : d.buyerName,
      email: isGlobal ? d.email : d.buyerEmail,
      phone: d.buyerPhone || "",
      title: isGlobal ? d.message : d.requirementTitle,
      quantity: isGlobal ? d.quantity : d.estimatedQuantity,
      country: d.deliveryCountry || "",
      vendorId: d.vendorId || "",
      status: d.status,
      createdAt: d.createdAt?.toDate().toLocaleDateString(),
      rawDate: d.createdAt?.toDate(),
    };
  }

  /* ---------------- FILTERING ---------------- */

  useEffect(() => {
    let data = [...leads];

    if (activeTab !== "ALL") {
      data = data.filter((l) => l.type === activeTab);
    }

    if (dateFrom) {
      data = data.filter(
        (l) => l.rawDate >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      data = data.filter(
        (l) => l.rawDate <= new Date(dateTo)
      );
    }

    setFiltered(data);
  }, [activeTab, dateFrom, dateTo, leads]);

  /* ---------------- EXPORT EXCEL ---------------- */

  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "leads.xlsx");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Customers / Leads</h1>

      {/* Tabs */}
      <div className="flex gap-3">
        {["ALL", "GLOBAL", "DIRECT"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTab === t
                ? "bg-black text-white"
                : "border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      {/* Table */}
     <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      
      {/* HEADER */}
      <thead className="bg-[var(--color-bg-soft)] text-left sticky top-0 z-10">
        <tr className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">
          <th className="p-4">Customer</th>
          <th>Email</th>
          <th>Requirement</th>
          <th>Qty</th>
          <th>Country</th>
          <th>Type</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody>
        {filtered.map((l, i) => (
          <tr
            key={l.id}
            className={`
              hover:bg-[var(--color-bg-soft)]
              transition
              ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}
            `}
          >
            <td className="p-4 font-medium text-[var(--color-text-primary)]">
              {l.name}
            </td>

            <td className="text-[var(--color-text-secondary)]">
              {l.email}
            </td>

            <td className="max-w-[240px] truncate">
              {l.title}
            </td>

            <td>{l.quantity}</td>

            <td className="capitalize">{l.country}</td>

            {/* TYPE BADGE */}
            <td>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium
                  ${
                    l.type === "GLOBAL"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
              >
                {l.type}
              </span>
            </td>

            {/* STATUS BADGE */}
            <td>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium
                  ${
                    l.status === "OPEN"
                      ? "bg-orange-100 text-orange-700"
                      : l.status === "RFQ_REQUESTED"
                      ? "bg-purple-100 text-purple-700"
                      : l.status === "ACCEPTED"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
              >
                {l.status}
              </span>
            </td>

            <td className="text-xs text-gray-500">
              {l.createdAt}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* EMPTY STATE */}
  {filtered.length === 0 && !loading && (
    <div className="p-10 text-center text-sm text-gray-500">
      No leads found
    </div>
  )}

  {/* LOADING */}
  {loading && (
    <div className="p-8 text-center text-sm text-gray-500">
      Loading leads...
    </div>
  )}
</div>

      {/* Pagination */}
      <button
        onClick={() => loadLeads(true)}
        className="px-5 py-2 border rounded"
      >
        Load More
      </button>
    </div>
  );
}