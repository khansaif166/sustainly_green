"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";

type Vendor = {
  uid: string;
  company: string;
  registrationNumber?: string;
  businessType: string;
  primaryCategory?: string;
  country: string;
  city: string;

  businessEmail?: string;
  businessPhone?: string;

  hasCertifications?: boolean;
  certificationNames?: string[];
  certificates?: string[];

  description?: string;
  yearEstablished?: number;
  website?: string;

  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };

  approved: boolean;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchVendors() {
    const snap = await getDocs(collection(db, "vendors"));
    setVendors(snap.docs.map((d) => d.data() as Vendor));
    setLoading(false);
  }

  async function approveVendor(uid: string) {
    await updateDoc(doc(db, "vendors", uid), { approved: true });
    await updateDoc(doc(db, "users", uid), { vendorApproved: true });
    fetchVendors();
  }

  async function rejectVendor(uid: string) {
    await updateDoc(doc(db, "vendors", uid), { approved: false });
    fetchVendors();
  }

  useEffect(() => {
    fetchVendors();
  }, []);

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading vendors...</p>;
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Vendor Approvals
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve vendor registrations
        </p>
      </div>

      {vendors.length === 0 && (
        <p className="text-sm text-gray-500">No vendor registrations found.</p>
      )}

      <div className="space-y-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((v) => (
          <div
            key={v.uid}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col "
          >
            {/* HEADER */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {v.company}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {v.businessType} • {v.city}, {v.country}
                </p>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium
        ${
          v.approved
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
              >
                {v.approved ? "Approved" : "Pending"}
              </span>
            </div>

            {/* BUSINESS INFO */}
            <div className="text-sm text-gray-700 space-y-1 mb-3">
              <p>
                <b>Registration:</b> {v.registrationNumber || "—"}
              </p>
              <p>
                <b>Category:</b> {v.primaryCategory || "—"}
              </p>
              <p>
                <b>Established:</b> {v.yearEstablished || "—"}
              </p>

              {v.website && (
                <a
                  href={v.website}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-black hover:underline mt-1"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* CONTACT */}
            <div className="text-sm text-gray-700 space-y-1 mb-3">
              <p>
                <b>Email:</b> {v.businessEmail || "—"}
              </p>
              <p>
                <b>Phone:</b> {v.businessPhone || "—"}
              </p>

              {v.socialLinks && (
                <div className="space-y-0.5">
                  {Object.entries(v.socialLinks).map(
                    ([key, link]) =>
                      link && (
                        <a
                          key={key}
                          href={link}
                          target="_blank"
                          className="block text-[11px] text-gray-600 hover:underline"
                        >
                          {key}: {link}
                        </a>
                      )
                  )}
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            {v.description && (
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {v.description}
              </p>
            )}

            {/* CERTIFICATIONS */}
            {v.hasCertifications && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-900 mb-1">
                  Certifications
                </p>

                {v.certificationNames?.length ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {v.certificationNames.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full border text-[10px] text-gray-600"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No names provided</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {v.certificates?.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      className="px-3 py-1 rounded-full border text-[11px] hover:bg-gray-50"
                    >
                      View Certificate {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-2 mt-auto">
              {!v.approved && (
                <button
                  onClick={() => approveVendor(v.uid)}
                  className="inline-flex items-center gap-1 rounded-full bg-black text-white px-4 py-1.5 text-xs"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              )}

              <button
                onClick={() => rejectVendor(v.uid)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-1.5 text-xs text-gray-700"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
