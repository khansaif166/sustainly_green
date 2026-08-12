import { cache } from "react";
import type { Metadata } from "next";
import { fetchActiveCareers } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import CareersClient from "./CareersClient";

export const revalidate = 900;

const title = "Careers";
const description = `Join ${SITE_NAME} in building a sustainable, eco-friendly B2B marketplace. Explore current job openings and apply.`;
const canonical = `${getSiteUrl()}/careers`;

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

const getJobs = cache(async () => {
  try {
    return await fetchActiveCareers();
  } catch (error) {
    console.error("Failed to load Supabase careers", error);
    return [];
  }
});

export default async function CareersPage() {
  const jobs = await getJobs();
  return <CareersClient jobs={jobs} />;
}
