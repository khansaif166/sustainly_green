import { cache } from "react";
import type { Metadata } from "next";
import { fetchApprovedVendors } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import FindVendorsClient from "./FindVendorsClient";

export const revalidate = 900;

const title = "Find Vendors";
const description = `Discover sustainable vendors and verified suppliers worldwide on ${SITE_NAME}, India's B2B sustainability marketplace.`;
const canonical = `${getSiteUrl()}/find-vendors`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    type: "website",
    title,
    description,
    url: canonical,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const getVendors = cache(async () => {
  try {
    return await fetchApprovedVendors();
  } catch (error) {
    console.error("Failed to load Supabase vendors", error);
    return [];
  }
});

export default async function FindVendorsPage() {
  const vendors = await getVendors();
  return <FindVendorsClient vendors={vendors} />;
}
