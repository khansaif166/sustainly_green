import { cache } from "react";
import type { Metadata } from "next";
import {
  fetchActiveCategories,
  fetchActiveSubcategories,
  fetchActiveProductTypes,
  fetchApprovedProductsPage,
  fetchApprovedVendorsPage,
  fetchVendorSummaries,
  type PublicProduct,
  type PublicVendor,
} from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { resolveBrowseTaxonomy } from "@/lib/productTaxonomy";
import { browseSort, browseType, normalizeBrowseParams } from "@/lib/browseFilters";
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
  subcategory: string;
  productType: string;
  q: string;
  page: number;
  badge: string;
  loc: string;
  sort: string;
  claimStatus: string;
};

function readQuery(values: Record<string, string | string[] | undefined>): BrowseQuery {
  const raw = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    const text = first(value);
    if (text) raw.set(key, text);
  }
  const params = normalizeBrowseParams(raw);
  return {
    type: params.get("type") || "product",
    category: params.get("category") || "",
    subcategory: params.get("subcategory") || "",
    productType: params.get("product_type") || "",
    q: params.get("q") || "",
    page: pageNumber(params.get("page") || ""),
    badge: params.get("badge") || "",
    loc: params.get("loc") || "",
    sort: browseSort(params.get("sort")),
    claimStatus: params.get("claim_status") || "",
  };
}

// Only the rows on the requested page come back from the database, along
// with the total count used to build the page links.
const getBrowseData = cache(
  async (typeValue: string, categoryValue: string, subcategoryValue: string, productTypeValue: string, searchValue: string, page: number, badge: string, loc: string, sort: string, claimStatus: string) => {
    const type = browseType(typeValue);
    const data = {
      type,
      categories: [] as Awaited<ReturnType<typeof fetchActiveCategories>>,
      subcategories: [] as Awaited<ReturnType<typeof fetchActiveSubcategories>>,
      productTypes: [] as Awaited<ReturnType<typeof fetchActiveProductTypes>>,
      selectedCategory: undefined as ReturnType<typeof resolveBrowseTaxonomy>["category"],
      products: [] as PublicProduct[],
      vendors: [] as PublicVendor[],
      total: 0,
      page: 1,
      vendorSummaries: [] as Awaited<ReturnType<typeof fetchVendorSummaries>>,
      loadError: false,
    };
    try {
      data.categories = await fetchActiveCategories();
      const requestedCategory = categoryValue ? data.categories.find(item => item.id === categoryValue || item.slug?.toLowerCase() === categoryValue.toLowerCase()) : undefined;
      data.subcategories = requestedCategory && type !== "Vendor" ? await fetchActiveSubcategories(requestedCategory.id) : [];
      const requestedSubcategory = data.subcategories.find(item => item.id === subcategoryValue);
      data.productTypes = requestedSubcategory && type === "Product" ? await fetchActiveProductTypes(requestedSubcategory.id) : [];
      const hierarchy = resolveBrowseTaxonomy(type, { category: categoryValue, subcategory: subcategoryValue, productType: productTypeValue }, data.categories, data.subcategories, data.productTypes);
      data.selectedCategory = hierarchy.category;
      // An invalid hierarchy is a genuine no-match URL, not a fetch error.
      if (!hierarchy.valid) return data;

      if (type === "Vendor") {
        const result = await fetchApprovedVendorsPage({
          page, pageSize: BROWSE_PAGE_SIZE, search: searchValue,
          badge, location: loc, sort, claimStatus,
        });
        return { ...data, vendors: result.items, total: result.total, page: result.page };
      }

      const result = await fetchApprovedProductsPage({
        page, pageSize: BROWSE_PAGE_SIZE, listingType: type,
        categoryId: hierarchy.category?.id, subcategoryId: hierarchy.subcategory?.id,
        productTypeId: hierarchy.productType?.id, search: searchValue,
        ecoVerifiedOnly: badge === "eco_verified", sort,
      });
      // Missing optional vendor summaries must not hide otherwise valid products.
      const vendorSummaries = await fetchVendorSummaries(result.items.map(product => product.vendorId)).catch(() => []);
      return { ...data, products: result.items, total: result.total, page: result.page, vendorSummaries };
    } catch (error) {
      console.error("BROWSE_DATA_ERROR", error);
      return { ...data, loadError: true };
    }
  },
);

function loadBrowseData(query: BrowseQuery) {
  return getBrowseData(query.type, query.category, query.subcategory, query.productType, query.q, query.page, query.badge, query.loc, query.sort, query.claimStatus);
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
  const filtered = Boolean(query.q || query.badge || query.loc || query.sort !== "newest" || query.subcategory || query.productType || query.claimStatus);
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
      initialSubcategories={data.subcategories}
      initialProductTypes={data.productTypes}
      totalCount={data.total}
      page={data.page}
      pageSize={BROWSE_PAGE_SIZE}
      vendorSummaries={data.vendorSummaries}
      loadError={data.loadError}
    />
  );
}
