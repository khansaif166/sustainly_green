"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  Package,
  PlusCircle,
  CheckCircle,
  Clock,
  Building2,
  AlertCircle,
} from "lucide-react";

export default function VendorDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
  });

  /* ---------------- AUTH + LOAD DATA ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      const vendorSnap = await getDoc(doc(db, "vendors", u.uid));
      if (!vendorSnap.exists()) {
        router.push("/vendor/onboarding");
        return;
      }

      setVendor(vendorSnap.data());

      /* Fetch product stats */
      const q = query(
        collection(db, "products"),
        where("vendorId", "==", u.uid)
      );
      const snap = await getDocs(q);

      const products = snap.docs.map((d) => d.data());
      setStats({
        total: products.length,
        approved: products.filter((p) => p.approved).length,
        pending: products.filter((p) => !p.approved).length,
      });

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading dashboard…
      </div>
    );
  }

  const isApproved = vendor?.approved === true;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Vendor Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, <span className="font-medium">{vendor.company}</span>
          </p>
        </div>

        {/* ================= STATUS ================= */}
        <div className="bg-white rounded-2xl border p-6 flex items-start gap-4">
          {isApproved ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  Account Approved
                </p>
                <p className="text-sm text-gray-600">
                  Your vendor account is verified. You can publish products and
                  services.
                </p>
              </div>
            </>
          ) : (
            <>
              <Clock className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  Approval Pending
                </p>
                <p className="text-sm text-gray-600">
                  Our team is reviewing your profile. You can prepare listings,
                  but publishing will be enabled after approval.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Listings"
            value={stats.total}
            icon={Package}
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Pending Review"
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* PRODUCTS */}
          <ActionCard
            title="Your Products"
            description="View, edit, and track all your listings"
            icon={Package}
            actionLabel="View Products"
            onClick={() => router.push("/vendor/products")}
          />

          {/* ADD PRODUCT */}
          <ActionCard
            title="Add New Listing"
            description="Create a new product or service listing"
            icon={PlusCircle}
            disabled={!isApproved}
            actionLabel="Add Listing"
            onClick={() => router.push("/vendor/products/new")}
          />

          {/* PROFILE */}
          <ActionCard
            title="Company Profile"
            description="Manage business info and certificates"
            icon={Building2}
            actionLabel="Edit Profile"
            onClick={() => router.push("/vendor/onboarding")}
          />
        </div>

        {/* ================= NEXT STEPS ================= */}
        {!isApproved && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-700 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                What happens next?
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Our admin team is reviewing your business details and
                certificates. This usually takes 24–48 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function StatCard({
  label,
  value,
  icon: Icon,
  color = "gray",
}: any) {
  const colorMap: any = {
    gray: "text-gray-700",
    green: "text-green-600",
    yellow: "text-yellow-600",
  };

  return (
    <div className="bg-white rounded-2xl border p-5 flex items-center gap-4">
      <Icon className={`h-6 w-6 ${colorMap[color]}`} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  onClick,
  disabled,
}: any) {
  return (
    <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between">
      <div className="flex items-start gap-3 mb-4">
        <Icon className="h-6 w-6 text-gray-900 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        </div>
      </div>

      <button
        disabled={disabled}
        onClick={onClick}
        className={`rounded-full px-4 py-2 text-sm w-full
          ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-900"
          }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
