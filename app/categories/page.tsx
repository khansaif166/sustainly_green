import { cache } from "react";
import type { Metadata } from "next";
import { fetchActiveCategories } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import CategoriesClient from "./CategoriesClient";

export const revalidate = 3600;

const getCategories = cache(async () => {
  try {
    return await fetchActiveCategories();
  } catch {
    return [];
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories();
  const canonical = `${getSiteUrl()}/categories`;
  const title = "Verified Sustainable Supplier Categories in India";
  const description =
    "Browse sustainable sourcing categories and discover responsible products, services, and suppliers across India on Sustainly Green.";

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: categories.length > 0, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: "/logo.png", alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.png"],
    },
  };
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient categories={categories} />;
}
