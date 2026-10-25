import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchApprovedProducts,
  fetchApprovedVendorById,
} from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { vendorHref } from "@/lib/slug";
import VendorProfileClient from "./VendorProfileClient";

export const revalidate = 900;

type VendorPageProps = {
  params: Promise<{ vendorId: string }>;
};

function compact(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

const getVendorData = cache(async (vendorId: string) => {
  try {
    const vendor = await fetchApprovedVendorById(vendorId);
    if (!vendor) return null;

    const products = await fetchApprovedProducts({
      vendorId: vendor.id,
      limit: 24,
    });
    return { vendor, products };
  } catch {
    return null;
  }
});

function isCompleteVendor(
  data: NonNullable<Awaited<ReturnType<typeof getVendorData>>>,
) {
  return Boolean(
    data.vendor.description?.trim() &&
      data.vendor.certifications?.length &&
      data.products.length,
  );
}

export async function generateMetadata({
  params,
}: VendorPageProps): Promise<Metadata> {
  const { vendorId } = await params;
  const data = await getVendorData(vendorId);
  // Always the readable /find-vendors/{slug} form, even when reached by uuid.
  const canonical = `${getSiteUrl()}${data ? vendorHref(data.vendor.id, data.vendor.slug) : `/find-vendors/${encodeURIComponent(vendorId)}`}`;

  if (!data) {
    return {
      title: "Vendor not found",
      robots: { index: false, follow: false },
      alternates: { canonical },
    };
  }

  const { vendor } = data;
  const category = vendor.category || "Sustainable Products";
  const city = vendor.city || vendor.state || "India";
  const title = compact(
    `${vendor.companyName} - ${category} Supplier in ${city} | ${SITE_NAME}`,
    60,
  );
  const description = compact(
    vendor.description ||
      `Explore products and sustainability information from ${vendor.companyName}, a ${category} supplier serving ${city}.`,
    155,
  );
  const image = vendor.logoUrl || "/logo.png";
  const indexable = isCompleteVendor(data);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index: indexable, follow: true },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image, alt: vendor.companyName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { vendorId } = await params;
  const data = await getVendorData(vendorId);

  if (!data) notFound();

  // Old /find-vendors/{uuid} links (and any other spelling) move to the
  // readable URL with a 308, so shared links and Google keep working.
  const href = vendorHref(data.vendor.id, data.vendor.slug);
  if (data.vendor.slug && decodeURIComponent(vendorId) !== data.vendor.slug) {
    permanentRedirect(href);
  }

  return (
    <VendorProfileClient
      initialVendor={data.vendor}
      initialProducts={data.products}
    />
  );
}
