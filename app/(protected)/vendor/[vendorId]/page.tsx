"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type VendorProfile = {
  companyName: string;
  businessType?: string;
  primaryCategory?: string;
  approved: boolean;
  description?: string;
  hasCertifications: boolean;
  certifications: string[];
  certificateFiles: string[];
  businessEmail?: string;
  phone?: string;
  city?: string;
  country?: string;
  yearEstablished?: string;
};

function mapVendor(row: Record<string, any>): VendorProfile {
  return {
    companyName: row.company_name || "Unnamed Vendor",
    businessType: row.business_type || "",
    primaryCategory: row.primary_category || "",
    approved: Boolean(row.approved),
    description: row.short_description || row.registered_address || "",
    hasCertifications: Boolean(row.primary_sustainability_cert || row.certificate_file_url),
    certifications: row.primary_sustainability_cert
      ? [row.primary_sustainability_cert]
      : [],
    certificateFiles: row.certificate_file_url ? [row.certificate_file_url] : [],
    businessEmail: row.business_email || "",
    phone: row.whatsapp || row.alternate_phone || "",
    city: row.city || "",
    country: row.country || "",
    yearEstablished: row.year_of_incorporation || "",
  };
}

export default function VendorProfilePage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendor() {
      if (!vendorId) return;

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        select:
          "company_name,business_type,primary_category,approved,short_description,registered_address,primary_sustainability_cert,certificate_file_url,business_email,whatsapp,alternate_phone,city,country,year_of_incorporation",
        id: `eq.${vendorId as string}`,
        limit: "1",
      });

      const response = await fetch(`${SUPABASE_URL}/rest/v1/vendors?${params}`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows) && rows[0]) setVendor(mapVendor(rows[0]));
      }
      setLoading(false);
    }
    fetchVendor();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading vendor profile…
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Vendor not found
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {vendor.companyName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {vendor.businessType} · {vendor.primaryCategory}
              </p>
            </div>

            <div>
              {vendor.approved ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1.5 text-xs font-medium text-green-700">
                  ✅ Verified Vendor
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1.5 text-xs font-medium text-orange-700">
                  ⏳ Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="md:col-span-2 space-y-6">

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                About the Company
              </h2>
              <p className="text-sm text-gray-600">
                {vendor.description || "No description provided."}
              </p>
            </div>

            {/* Certifications */}
            {vendor.hasCertifications && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Sustainability Certifications
                </h2>

                <div className="flex flex-wrap gap-2 mb-3">
                  {vendor.certifications?.map((c: string) => (
                    <span
                      key={c}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="space-y-1">
                  {vendor.certificateFiles?.map((url: string, i: number) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      className="block text-sm text-black underline"
                    >
                      View Certificate {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Contact Information
              </h2>

              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Email:</strong> {vendor.businessEmail}</p>
                <p><strong>Phone:</strong> {vendor.phone}</p>
                <p><strong>Location:</strong> {vendor.city}, {vendor.country}</p>
              </div>

              <Link
                href={`/rfq/${vendorId}`}
                className="mt-4 inline-block w-full text-center rounded-full bg-black text-white py-2 text-sm"
              >
                Contact Vendor
              </Link>
            </div>

            {/* Meta */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Company Details
              </h2>

              <div className="space-y-1 text-sm text-gray-600">
                <p>Year Established: {vendor.yearEstablished || "—"}</p>
                {vendor.website && (
                  <a
                    href={vendor.website}
                    target="_blank"
                    className="block text-black underline"
                  >
                    Website
                  </a>
                )}
              </div>

              <div className="mt-3 flex gap-3">
                {vendor.socialLinks?.linkedin && (
                  <a href={vendor.socialLinks.linkedin} target="_blank">LinkedIn</a>
                )}
                {vendor.socialLinks?.twitter && (
                  <a href={vendor.socialLinks.twitter} target="_blank">Twitter</a>
                )}
                {vendor.socialLinks?.instagram && (
                  <a href={vendor.socialLinks.instagram} target="_blank">Instagram</a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
