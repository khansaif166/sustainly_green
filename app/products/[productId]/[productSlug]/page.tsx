import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchApprovedProductById,
  fetchApprovedProducts,
} from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { fitTitle } from "@/lib/seoTitle";
import { categoryHref, productHref } from "@/lib/slug";
import ProductDetailClient from "../ProductDetailClient";

export const revalidate = 900;

type ProductPageProps = {
  // productSlug is decorative only — productId is the real lookup key, so a
  // stale/incorrect slug in the URL still resolves the product correctly.
  // The canonical tag always points at the current, correct slug.
  params: Promise<{ productId: string; productSlug: string }>;
};

function compact(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

const getProduct = cache(async (productId: string) => {
  try {
    return await fetchApprovedProductById(productId);
  } catch {
    return null;
  }
});

const getOtherProducts = cache(async (vendorId: string, currentProductId: string) => {
  try {
    const list = await fetchApprovedProducts({ vendorId, limit: 12 });
    return list.filter((p) => p.id !== currentProductId).slice(0, 4);
  } catch {
    return [];
  }
});

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
      alternates: { canonical: `${getSiteUrl()}/products/${encodeURIComponent(productId)}` },
    };
  }

  // Canonical always points at the current, correct slug — regardless of
  // what slug was actually requested in the URL (e.g. an outdated one from
  // a renamed product) — so SEO signals consolidate correctly either way.
  const canonical = `${getSiteUrl()}${productHref(productId, product.title)}`;

  const keySpec =
    product.tagNames?.[0] ||
    product.sustainabilityTags?.[0] ||
    product.listingType ||
    "Sustainable Product";
  const title = fitTitle([
    `${product.title} - ${keySpec} | ${product.vendorName} | ${SITE_NAME}`,
    `${product.title} - ${keySpec} | ${SITE_NAME}`,
    `${product.title} - ${keySpec}`,
    `${product.title} | ${SITE_NAME}`,
    product.title,
  ]);
  const description = compact(
    product.description ||
      `Discover ${product.title} from ${product.vendorName} on ${SITE_NAME}, India's B2B sustainability marketplace.`,
    155,
  );
  const image = product.images?.[0] || "/logo.png";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image, alt: product.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function productStructuredData(
  product: NonNullable<Awaited<ReturnType<typeof getProduct>>>,
  canonical: string,
) {
  // Google requires a Product snippet to carry offers, review or
  // aggregateRating. "Price on Request" listings have none of these, and
  // inventing a rating would breach Google's guidelines, so they get no
  // Product markup at all rather than an invalid one.
  // Must match hasPublicPrice in ProductDetailClient: if the page hides the
  // price, the markup must not advertise one (Google flags the mismatch).
  const hasPrice =
    typeof product.price === "number" &&
    product.price > 0 &&
    product.priceType !== "Price on Request";
  if (!hasPrice) return null;

  return {
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.images?.length ? product.images : undefined,
    sku: product.id,
    // Only the real catalogue category. listingType ("Product") and the
    // sustainability claim are not categories.
    category: product.categoryName || undefined,
    brand: {
      "@type": "Brand",
      name: product.vendorName,
    },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: product.currency,
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: product.vendorName,
      },
    },
  };
}

function breadcrumbStructuredData(
  product: NonNullable<Awaited<ReturnType<typeof getProduct>>>,
  canonical: string,
) {
  const siteUrl = getSiteUrl();
  const items: Array<{ name: string; item: string }> = [
    { name: "Home", item: siteUrl },
    { name: "Browse", item: `${siteUrl}/browse` },
  ];
  if (product.categoryName && product.categorySlug) {
    items.push({
      name: product.categoryName,
      item: `${siteUrl}${categoryHref(product.categoryId || "", product.categorySlug)}`,
    });
  }
  items.push({ name: product.title, item: canonical });

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...entry,
    })),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) notFound();

  const otherProducts = await getOtherProducts(product.vendorId, product.id);

  const canonical = `${getSiteUrl()}${productHref(productId, product.title)}`;
  const productData = productStructuredData(product, canonical);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      ...(productData ? [productData] : []),
      breadcrumbStructuredData(product, canonical),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <ProductDetailClient product={product} otherProducts={otherProducts} />
    </>
  );
}