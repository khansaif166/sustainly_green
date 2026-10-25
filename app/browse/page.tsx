import { cache } from "react";
import type { Metadata } from "next";
import {
  fetchActiveCategories,
  fetchApprovedProductsPage,
  fetchApprovedVendorsPage,
  fetchVendorSummaries,
  type PublicProduct,
  type PublicVendor,
} from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import BrowseClient from "./BrowseClient";

export const revalidate = 900;

const BROWSE_PAGE_SIZE = 12;

type BrowsePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

type BrowseQuery = {
  type: string;
  category: string;
  q: string;
  page: number;
  badge: string;
  loc: string;
  sort: string;
};

function readQuery(values: Record<string, string | string[] | undefined>): BrowseQuery {
  return {
    type: first(values.type) || "product",
    category: first(values.category),
    q: first(values.q),
    page: pageNumber(first(values.page)),
    badge: first(values.badge),
    loc: first(values.loc),
    sort: first(values.sort),
  };
}

// Only the rows on the requested page come back from the database, along
// with the total count used to build the page links.
const getBrowseData = cache(
  async (typeValue: string, categoryValue: string, searchValue: string, page: number, badge: string, loc: string, sort: string) => {
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
    const empty = { items: [], total: 0, page: 1 };

    if (type === "Vendor") {
      const result = await fetchApprovedVendorsPage({
        page,
        pageSize: BROWSE_PAGE_SIZE,
        search: searchValue,
        badge,
        location: loc,
        sort,
      }).catch(() => empty);
      return {
        type,
        categories,
        selectedCategory,
        products: [] as PublicProduct[],
        vendors: result.items as PublicVendor[],
        total: result.total,
        page: result.page,
        vendorSummaries: [],
      };
    }

    const result = await fetchApprovedProductsPage({
      page,
      pageSize: BROWSE_PAGE_SIZE,
      listingType: type,
      categoryId,
      search: searchValue,
      ecoVerifiedOnly: badge === "eco_verified",
      sort,
    }).catch(() => empty);
    const products = result.items as PublicProduct[];
    // Vendor name + state for just the cards on this page.
    const vendorSummaries = await fetchVendorSummaries(products.map((product) => product.vendorId)).catch(() => []);

    return {
      type,
      categories,
      selectedCategory,
      products,
      vendors: [] as PublicVendor[],
      total: result.total,
      page: result.page,
      vendorSummaries,
    };
  },
);

function loadBrowseData(query: BrowseQuery) {
  return getBrowseData(query.type, query.category, query.q, query.page, query.badge, query.loc, query.sort);
}

function pageNumber(value: string) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 1 ? page : 1;
}

function browseCanonical(
  type: string,
  category: string,
  query: string,
  page = 1,
) {
  const params = new URLSearchParams();
  if (type && type.toLowerCase() !== "product") {
    params.set("type", type.toLowerCase());
  }
  if (category) params.set("category", category.toLowerCase());
  if (query) params.set("q", query);
  // Paginated pages are self-canonical: pointing ?page=N at page 1 would tell
  // Google to drop the only page that links to those products.
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `${getSiteUrl()}/browse${suffix ? `?${suffix}` : ""}`;
}

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const query = readQuery(await searchParams);
  const data = await loadBrowseData(query);
  const filtered = Boolean(query.q || query.badge || query.loc || query.sort);
  // ?category=<uuid> and ?category=<slug> render the same page; both declare
  // the slug form canonical, matching the sitemap and internal links.
  const canonical = browseCanonical(
    query.type,
    data.selectedCategory?.slug || query.category,
    query.q,
    data.page,
  );
  const page = data.page;
  const categoryName = data.selectedCategory?.name;
  const baseTitle = categoryName
    ? `Verified ${categoryName} Suppliers in India`
    : data.type === "Vendor"
      ? "Verified Sustainable Suppliers in India"
      : data.type === "Service"
        ? "Sustainable Business Services in India"
        : "Sustainable Products and Suppliers in India";
  const title = page > 1 ? `${baseTitle} – Page ${page}` : baseTitle;
  const description = categoryName
    ? `Discover verified ${categoryName} suppliers, products, and sourcing solutions across India on Sustainly Green.`
    : "Browse sustainable products, responsible suppliers, and green business services across India on Sustainly Green.";

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: data.total > 0 && !filtered, follow: true },
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
  const data = await loadBrowseData(readQuery(await searchParams));

  return (
    <BrowseClient
      initialProducts={data.products}
      initialVendors={data.vendors}
      initialCategories={data.categories}
      totalCount={data.total}
      page={data.page}
      pageSize={BROWSE_PAGE_SIZE}
      vendorSummaries={data.vendorSummaries}
    />
  );
}
