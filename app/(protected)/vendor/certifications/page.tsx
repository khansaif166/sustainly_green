"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

type Certification = {
  id: string;
  certificationType?: string;
  status?: string;
  vendorId?: string;
};

export default function VendorCertifications() {

  const [data, setData] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function load() {

      const uid = auth.currentUser?.uid;

      if (!uid) {
        setLoading(false);
        return;
      }

      try {

        const q = query(
          collection(db, "certificationRequests"),
          where("vendorId", "==", uid)
        );

        const snap = await getDocs(q);

        const list: Certification[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Certification, "id">)
        }));

        setData(list);

      } catch (err) {
        console.error("Error loading certifications:", err);
      }

      setLoading(false);
    }

    load();

  }, []);

  return (
    <main className="p-10">

      <h1 className="text-2xl font-semibold mb-6">
        My Certifications
      </h1>

      {loading && (
        <p className="text-gray-500">Loading certifications...</p>
      )}

      {!loading && data.length === 0 && (
        <p className="text-gray-500">No certifications found</p>
      )}

      <div className="space-y-4">

        {data.map((r) => (
          <div
            key={r.id}
            className="bg-white p-6 rounded-2xl border shadow-sm"
          >

            <p>
              <span className="font-medium">Certification:</span>{" "}
              {r.certificationType}
            </p>

            <p>
              <span className="font-medium">Status:</span>{" "}
              {r.status}
            </p>

          </div>
        ))}

      </div>

    </main>
  );
}