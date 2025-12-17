"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function VendorMyProfilePage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const snap = await getDoc(doc(db, "vendors", user.uid));

      if (!snap.exists()) {
        router.push("/vendor/onboarding");
        return;
      }

      const data = snap.data();

      if (!data.approved) {
        router.push("/vendor/pending");
        return;
      }

      setVendor(data);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading your profile…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">{vendor.companyName}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {vendor.businessType} · {vendor.primaryCategory}
        </p>

        <div className="mt-6 space-y-3 text-sm">
          <p><strong>Email:</strong> {vendor.businessEmail}</p>
          <p><strong>Phone:</strong> {vendor.phone}</p>
          <p><strong>Location:</strong> {vendor.city}, {vendor.country}</p>
        </div>
      </div>
    </main>
  );
}
