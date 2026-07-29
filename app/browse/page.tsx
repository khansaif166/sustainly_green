import { cache } from "react";
import type { Metadata } from "next";
import {
  fetchActiveCategories,
  fetchApprovedProducts,
  fetchApprovedVendors,
} from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import BrowseClient from "./BrowseClient";

export const revalidate = 900;

type BrowsePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

const getBrowseData = cache(
  async (typeValue: string, categoryValue: string, searchValue: string) => {
    const type =
      typeValue.toLowerCase() === "vendor"
        ? "Vendor"
        : typeValue.toLowerCase() === "service"
          ? "Service"
          : "Product";
    const categories = await fetchActiveCategories().catch(() => []);
    const selectedCategory = categories.find(
      (item) =>
        item.id === categoryValue ||
        item.slug?.toLowerCase() === categoryValue.toLowerCase(),
    );
    const categoryId = selectedCategory?.id || categoryValue || undefined;
    const query = searchValue.trim().toLowerCase();

    if (type === "Vendor") {
      let vendors = await fetchApprovedVendors().catch(() => []);
      if (query) {
        vendors = vendors.filter((vendor) =>
          [
            vendor.companyName,
            vendor.description,
            vendor.category,
            vendor.city,
            vendor.state,
            vendor.country,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
        );
      }
      return { type, categories, selectedCategory, products: [], vendors };
    }

    let products = await fetchApprovedProducts({
      listingType: type,
      categoryId,
      limit: 100,
    }).catch(() => []);
    if (query) {
      products = products.filter((product) =>
        [product.title, product.description, ...product.tagNames]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    return { type, categories, selectedCategory, products, vendors: [] };
  },
);

function browseCanonical(type: string, category: string, query: string) {
  const params = new URLSearchParams();
  if (type && type.toLowerCase() !== "product") {
    params.set("type", type.toLowerCase());
  }
  if (category) params.set("category", category.toLowerCase());
  if (query) params.set("q", query);
  const suffix = params.toString();
  return `${getSiteUrl()}/browse${suffix ? `?${suffix}` : ""}`;
}

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const values = await searchParams;
  const type = first(values.type) || "product";
  const category = first(values.category);
  const query = first(values.q);
  const data = await getBrowseData(type, category, query);
  const resultCount = data.products.length + data.vendors.length;
  const canonical = browseCanonical(type, category, query);
  const categoryName = data.selectedCategory?.name;
  const title = categoryName
    ? `Verified ${categoryName} Suppliers in India`
    : data.type === "Vendor"
      ? "Verified Sustainable Suppliers in India"
      : data.type === "Service"
        ? "Sustainable Business Services in India"
        : "Sustainable Products and Suppliers in India";
  const description = categoryName
    ? `Discover verified ${categoryName} suppliers, products, and sourcing solutions across India on Sustainly Green.`
    : "Browse sustainable products, responsible suppliers, and green business services across India on Sustainly Green.";

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: resultCount > 0 && !query, follow: true },
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

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const values = await searchParams;
  const type = first(values.type) || "product";
  const category = first(values.category);
  const query = first(values.q);
  const data = await getBrowseData(type, category, query);

  return (
    <BrowseClient
      initialProducts={data.products}
      initialVendors={data.vendors}
      initialCategories={data.categories}
    />
  );
}
