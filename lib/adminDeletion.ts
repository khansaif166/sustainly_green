import "server-only";

import { supabaseServiceFetch } from "@/lib/supabaseServer";

type VendorFilesRow = {
  logo_url: string | null;
  certificate_file_url: string | null;
  awards_image_url: string | null;
};

type ProductImageRow = {
  url: string | null;
  storage_path: string | null;
};

type ProductWithImagesRow = {
  product_images: ProductImageRow[] | null;
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

  const allPaths = Array.from(paths);
  for (let index = 0; index < allPaths.length; index += 100) {
    await supabaseServiceFetch<unknown>("/storage/v1/object/marketplace", {
      method: "DELETE",
      body: JSON.stringify({ prefixes: allPaths.slice(index, index + 100) }),
    });
  }

  return paths.size;
}
