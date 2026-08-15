import { NextResponse } from "next/server";
import { fetchApprovedProductById } from "@/lib/supabasePublic";
import { productHref } from "@/lib/slug";

// The old /products/{id} URL (pre-slug). Permanently redirects to the
// current /products/{id}/{slug} URL, preserving any query string (e.g.
// ?contact=1 from ContactVendorModal, which doesn't have the product title
// in scope and always links to this id-only form).
export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const { productId } = await context.params;
  const product = await fetchApprovedProductById(productId).catch(() => null);

  if (!product) {
    return new NextResponse("Product not found", { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const target = new URL(productHref(productId, product.title), requestUrl.origin);
  target.search = requestUrl.search;

  return NextResponse.redirect(target, 301);
}
