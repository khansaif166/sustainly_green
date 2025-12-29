"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    vendors: 0,
    pendingVendors: 0,
    products: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const usersSnap = await getDocs(collection(db, "users"));
      const vendorsSnap = await getDocs(collection(db, "vendors"));
      const productsSnap = await getDocs(collection(db, "products"));

      const pending = vendorsSnap.docs.filter(
        (d) => !d.data().approved
      ).length;

      setStats({
        users: usersSnap.size,
        vendors: vendorsSnap.size,
        pendingVendors: pending,
        products: productsSnap.size,
      });
    }

    loadStats();
  }, []);

  const Card = ({ label, value }: any) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );

  return (
    <div className="max-w-7xl p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Total Users" value={stats.users} />
        <Card label="Vendors" value={stats.vendors} />
        <Card label="Pending Approvals" value={stats.pendingVendors} />
        <Card label="Products" value={stats.products} />
      </div>
    </div>
  );
}
