import "server-only";

import { supabaseServiceFetch } from "@/lib/supabaseServer";

type VendorFilesRow = {
  id?: string;
  logo_url: string | null;
  certificate_file_url: string | null;
  awards_image_url: string | null;
};

type ProductImageRow = {
  url: string | null;
  storage_path: string | null;
};

type ProductWithImagesRow = {
  vendor_id?: string;
  product_images: ProductImageRow[] | null;
};

type ImageUrlRow = {
  image_url: string | null;
};

const MARKETPLACE_FOLDERS = ["products/", "vendors/"];

function marketplacePathFromUrl(value: string | null) {
  if (!value) return null;

  try {
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!storageUrl) return null;

    const url = new URL(value);
    if (url.origin !== new URL(storageUrl).origin) return null;

    const marker = "/storage/v1/object/public/marketplace/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return MARKETPLACE_FOLDERS.some(folder => path.startsWith(folder)) && !path.includes("..")
      ? path
      : null;
  } catch {
    return null;
  }
}

function safeMarketplacePath(value: string | null) {
  if (!value || value.includes("..")) return null;
  return MARKETPLACE_FOLDERS.some(folder => value.startsWith(folder)) ? value : null;
}

export async function deleteVendorStorageFiles(vendorId: string) {
  const vendors = await supabaseServiceFetch<VendorFilesRow[]>(
    `/rest/v1/vendors?${new URLSearchParams({
      select: "logo_url,certificate_file_url,awards_image_url",
      id: `eq.${vendorId}`,
      limit: "1",
    })}`,
  );
  const vendor = vendors[0];
  if (!vendor) return 0;

  const products = await supabaseServiceFetch<ProductWithImagesRow[]>(
    `/rest/v1/products?${new URLSearchParams({
      select: "product_images(url,storage_path)",
      vendor_id: `eq.${vendorId}`,
      limit: "10000",
    })}`,
  );
  const productImages = products.flatMap(product => product.product_images || []);

  const paths = new Set<string>();
  [
    vendor.logo_url,
    vendor.certificate_file_url,
    vendor.awards_image_url,
    ...productImages.map(image => image.url),
  ].forEach(value => {
    const path = marketplacePathFromUrl(value);
    if (path) paths.add(path);
  });
  productImages.forEach(image => {
    const path = safeMarketplacePath(image.storage_path);
    if (path) paths.add(path);
  });

  if (!paths.size) return 0;

  // Never delete a physical object that another vendor or product still
  // references, even if the same URL/path was copied between records.
  const [otherVendors, otherProducts, categories, blogs] = await Promise.all([
    supabaseServiceFetch<VendorFilesRow[]>(
      `/rest/v1/vendors?${new URLSearchParams({
        select: "id,logo_url,certificate_file_url,awards_image_url",
        id: `neq.${vendorId}`,
        limit: "10000",
      })}`,
    ),
    supabaseServiceFetch<ProductWithImagesRow[]>(
      `/rest/v1/products?${new URLSearchParams({
        select: "vendor_id,product_images(url,storage_path)",
        vendor_id: `neq.${vendorId}`,
        limit: "10000",
      })}`,
    ),
    supabaseServiceFetch<ImageUrlRow[]>(
      "/rest/v1/categories?select=image_url&limit=10000",
    ),
    supabaseServiceFetch<ImageUrlRow[]>(
      "/rest/v1/blogs?select=image_url&limit=10000",
    ),
  ]);

  const protectedPaths = new Set<string>();
  otherVendors.forEach(otherVendor => {
    [otherVendor.logo_url, otherVendor.certificate_file_url, otherVendor.awards_image_url]
      .forEach(value => {
        const path = marketplacePathFromUrl(value);
        if (path) protectedPaths.add(path);
      });
  });
  otherProducts.flatMap(product => product.product_images || []).forEach(image => {
    const urlPath = marketplacePathFromUrl(image.url);
    const storedPath = safeMarketplacePath(image.storage_path);
    if (urlPath) protectedPaths.add(urlPath);
    if (storedPath) protectedPaths.add(storedPath);
  });
  [...categories, ...blogs].forEach(record => {
    const path = marketplacePathFromUrl(record.image_url);
    if (path) protectedPaths.add(path);
  });

  const allPaths = Array.from(paths).filter(path => !protectedPaths.has(path));
  for (let index = 0; index < allPaths.length; index += 100) {
    await supabaseServiceFetch<unknown>("/storage/v1/object/marketplace", {
      method: "DELETE",
      body: JSON.stringify({ prefixes: allPaths.slice(index, index + 100) }),
    });
  }

  return allPaths.length;
}
