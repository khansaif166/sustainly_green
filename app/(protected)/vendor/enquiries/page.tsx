"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function VendorEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [vendorId, setVendorId] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setVendorId(u.uid);

      const q = query(
        collection(db, "enquiries"),
        where("vendorId", "==", u.uid)
      );

      const snap = await getDocs(q);
      setEnquiries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  async function markResponded(id: string) {
    await updateDoc(doc(db, "enquiries", id), {
      status: "RESPONDED",
    });

    setEnquiries((e) =>
      e.map((x) => (x.id === id ? { ...x, status: "RESPONDED" } : x))
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-semibold">Buyer Enquiries</h1>

      {enquiries.map((e) => (
        <div
          key={e.id}
          className="bg-white border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex justify-between mb-2">
            <h2 className="font-medium">{e.productTitle}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
              {e.status}
            </span>
          </div>

          <p className="text-sm"><b>Name:</b> {e.buyerName}</p>
          <p className="text-sm"><b>Email:</b> {e.buyerEmail}</p>
          <p className="text-sm"><b>Phone:</b> {e.buyerPhone}</p>

          {e.buyerMessage && (
            <p className="text-sm mt-2">{e.buyerMessage}</p>
          )}

          {e.status === "NEW" && (
            <button
              onClick={() => markResponded(e.id)}
              className="mt-3 text-sm px-4 py-1.5 rounded-full border"
            >
              Mark as Responded
            </button>
          )}
        </div>
      ))}
    </main>
  );
}
