"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredSession } from "@/lib/supabaseAuth";

type Certification = {
  id: string;
  certificationType?: string;
  status?: string;
  vendorId?: string;
};

export default function VendorCertifications() {
  const router = useRouter();

  const [data, setData] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    async function load() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/vendor/certifications", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error?.message || "Unable to load certifications.",
          );
        }

        setData(payload.certifications || []);

      } catch (err) {
        console.error("Error loading certifications:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load certifications.",
        );
      }

      setLoading(false);
    }

    load();

  }, [router]);

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

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
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
