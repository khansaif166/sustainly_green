"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Package,
  BarChart3,
  Eye,
  MessageSquare,
  FileDown,
  ArrowLeft,
} from "lucide-react";

import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";

// 🔥 EXPORT LIBRARIES
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

/* ================= TYPES ================= */

export type Product = {
  id: string;
  title: string;
  approved: boolean;
  active?: boolean;
  views?: number;
};

type Enquiry = {
  status: string;
};

/* ================= PAGE ================= */

export default function VendorReportsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= LOAD REPORT DATA ================= */
  useEffect(() => {
    async function loadReports() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
        };

        const [productsResponse, enquiriesResponse] = await Promise.all([
          fetch("/api/vendor/products", { headers }),
          fetch("/api/vendor/rfqs", { headers }),
        ]);
        const [productsPayload, enquiriesPayload] = await Promise.all([
          productsResponse.json(),
          enquiriesResponse.json(),
        ]);

        if (!productsResponse.ok) {
          throw new Error(
            productsPayload?.error?.message || "Unable to load products report.",
          );
        }

        if (!enquiriesResponse.ok) {
          throw new Error(
            enquiriesPayload?.error?.message || "Unable to load enquiries report.",
          );
        }

        setProducts(productsPayload.products || []);
        setEnquiries(enquiriesPayload.rfqs || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load vendor reports.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [router]);

  /* ================= AGGREGATIONS ================= */

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.approved).length;
  const inactiveProducts = totalProducts - activeProducts;

  const totalEnquiries = enquiries.length;
  const responded = enquiries.filter(
    (e) => e.status !== "RFQ_REQUESTED",
  ).length;
  const pending = totalEnquiries - responded;

  const mostViewed = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  /* ================= EXCEL EXPORT ================= */

  const exportExcel = () => {
    // ---- PRODUCTS SHEET ----
    const productData = products.map((p, i) => ({
      "S.No": i + 1,
      "Product ID": p.id,
      "Product Name": p.title,
      Approved: p.approved ? "Yes" : "No",
      Active: p.active ? "Yes" : "No",
      Views: p.views || 0,
    }));

    // ---- ENQUIRIES SHEET ----
    const enquiryData = enquiries.map((e, i) => ({
      "S.No": i + 1,
      Status: e.status,
    }));

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(productData);
    const ws2 = XLSX.utils.json_to_sheet(enquiryData);

    XLSX.utils.book_append_sheet(wb, ws1, "Products Report");
    XLSX.utils.book_append_sheet(wb, ws2, "Enquiries Report");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      fileData,
      `Vendor_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  /* ================= PDF EXPORT ================= */

  const exportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Vendor Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table data
    const tableData = mostViewed.map((p, i) => [i + 1, p.title, p.views || 0]);

    // Create table
    autoTable(doc, {
      startY: 40,
      head: [["#", "Product Name", "Views"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] }, // emerald
    });

    // Save
    doc.save("vendor-report.pdf");
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading vendor reports…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-soft)] p-4 space-y-8">
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

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Vendor Reports
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Live product & enquiry analytics
          </p>
        </div>

        <div className="flex gap-3">
          {/* Excel */}
          <button
            onClick={exportExcel}
            className="
      flex items-center gap-2
      px-5 py-2.5
      rounded-full
      bg-white
      border border-gray-300
      text-gray-700
      font-medium
      shadow-sm
      hover:bg-gray-100
      hover:shadow
      transition
    "
          >
            <FileDown className="h-4 w-4 text-green-600" />
            Export Excel
          </button>

          {/* PDF */}
          <button
            onClick={exportPDF}
            className="
      flex items-center gap-2
      px-5 py-2.5
      rounded-full
      bg-emerald-700
      text-white
      font-medium
      shadow
      hover:bg-emerald-800
      transition
    "
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
     <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <KPI
    icon={Package}
    label="Total Products"
    value={totalProducts}
  />

  <KPI
    icon={BarChart3}
    label="Active Products"
    value={activeProducts}
    highlight   // 🔥 highlight this one if you want
  />

  <KPI
    icon={Eye}
    label="Inactive Products"
    value={inactiveProducts}
  />

  <KPI
    icon={MessageSquare}
    label="Total Enquiries"
    value={totalEnquiries}
  />
</div>


      {/* STATUS BARS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ReportCard title="Product Status">
          <Progress
            label="Active"
            value={activeProducts}
            total={totalProducts}
            color="bg-green-500"
          />
          <Progress
            label="Inactive"
            value={inactiveProducts}
            total={totalProducts}
            color="bg-red-400"
          />
        </ReportCard>

        <ReportCard title="Enquiry Response">
          <Progress
            label="Responded"
            value={responded}
            total={totalEnquiries}
            color="bg-blue-500"
          />
          <Progress
            label="Pending"
            value={pending}
            total={totalEnquiries}
            color="bg-yellow-400"
          />
        </ReportCard>
      </div>

      {/* MOST VIEWED */}
      <ReportCard title="Most Viewed Products">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Views</th>
            </tr>
          </thead>
          <tbody>
            {mostViewed.map((p) => (
              <tr key={p.id} className="border-t border-gray-200">
                <td className="py-3">{p.title}</td>
                <td className="py-3 text-right font-semibold">
                  {p.views || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportCard>
    </main>
  );
}

/* ================= COMPONENTS ================= */
function KPI({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: any;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl p-4
        bg-white
        shadow-[0_6px_24px_rgba(0,0,0,0.06)]
        flex items-center justify-between
        transition hover:shadow-lg
        ${highlight ? "ring-2 ring-yellow-400" : ""}
      `}
    >
      {/* LEFT TEXT */}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900 mt-1">
          {value}
        </p>
      </div>

      {/* RIGHT ICON */}
      <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
        <Icon className="h-5 w-5 text-emerald-600" />
      </div>
    </div>
  );
}


function ReportCard({ title, children }: any) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Progress({ label, value, total, color }: any) {
  const percent = total ? (value / total) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
