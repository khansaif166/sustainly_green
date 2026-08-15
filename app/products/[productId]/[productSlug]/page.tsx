import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchApprovedProductById } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { productHref } from "@/lib/slug";
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
    product.tagNames[0] ||
    product.sustainabilityTags[0] ||
    product.listingType ||
    "Sustainable Product";
  const title = compact(
    `${product.title} - ${keySpec} | ${product.vendorName} | ${SITE_NAME}`,
    60,
  );
  const description = compact(
    product.description ||
      `Discover ${product.title} from ${product.vendorName} on ${SITE_NAME}, India's B2B sustainability marketplace.`,
    155,
  );
  const image = product.images[0] || "/logo.png";

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
  const hasPrice = typeof product.price === "number" && product.price > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.images.length ? product.images : undefined,
    sku: product.id,
    category: product.tagNames[0] || product.listingType || undefined,
    brand: {
      "@type": "Brand",
      name: product.vendorName,
    },
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            url: canonical,
            priceCurrency: product.currency,
            price: product.price,
            availability: "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: product.vendorName,
            },
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) notFound();

  const canonical = `${getSiteUrl()}${productHref(productId, product.title)}`;
  const structuredData = productStructuredData(product, canonical);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
