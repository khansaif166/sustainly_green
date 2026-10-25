import { cache } from "react";
import type { Metadata } from "next";
import { fetchApprovedVendorsPage } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import FindVendorsClient from "./FindVendorsClient";

export const revalidate = 900;

const title = "Find Vendors";
const description = `Discover sustainable vendors and verified suppliers worldwide on ${SITE_NAME}, India's B2B sustainability marketplace.`;
const baseCanonical = `${getSiteUrl()}/find-vendors`;

const PAGE_SIZE = 24;

type FindVendorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function pageNumber(value: string) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 1 ? page : 1;
}

// One page of vendors straight from the database, plus the total count.
const getVendors = cache(async (search: string, page: number) => {
  try {
    return await fetchApprovedVendorsPage({ search, page, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error("Failed to load Supabase vendors", error);
    return { items: [], total: 0, page: 1 };
  }
});

export async function generateMetadata({ searchParams }: FindVendorsPageProps): Promise<Metadata> {
  const values = await searchParams;
  const search = first(values.q).trim();
  const { page, total } = await getVendors(search, pageNumber(first(values.page)));
  // Each page is its own canonical URL so Google can reach every vendor.
  const canonical = page > 1 ? `${baseCanonical}?page=${page}` : baseCanonical;
  const pageTitle = page > 1 ? `${title} – Page ${page}` : title;

  return {
    title: pageTitle,
    description,
    alternates: { canonical },
    robots: { index: total > 0 && !search, follow: true },
    openGraph: {
      type: "website",
      title: pageTitle,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
  };
}

export default async function FindVendorsPage({ searchParams }: FindVendorsPageProps) {
  const values = await searchParams;
  const search = first(values.q).trim();
  const result = await getVendors(search, pageNumber(first(values.page)));
  return (
    <FindVendorsClient
      vendors={result.items}
      total={result.total}
      page={result.page}
      pageSize={PAGE_SIZE}
    />
  );
}
