import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "www.sustainlygreen.com";

export const runtime = "experimental-edge";

const VENDOR_UUID_PATH =
  /^\/find-vendors\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/;

// Old /find-vendors/{uuid} links → /find-vendors/{slug} as a real 308. The
// page can't do this itself: app/loading.tsx makes it stream, so a redirect
// from the page arrives as a 200 with a meta refresh.
async function vendorSlugRedirect(request: NextRequest, vendorId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/vendors?select=slug&approved=eq.true&id=eq.${vendorId}&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<{ slug: string | null }>;
    const slug = rows[0]?.slug;
    if (!slug) return null;
    const url = request.nextUrl.clone();
    url.pathname = `/find-vendors/${encodeURIComponent(slug)}`;
    return NextResponse.redirect(url, 308);
  } catch {
    // Lookup failed: let the page render (it resolves uuids too).
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // On Cloudflare Workers, check both the URL and headers for the hostname
  const rawUrl = new URL(request.url);
  let hostname = rawUrl.hostname;

  // Fallback to headers if URL hostname is not available
  if (!hostname) {
    const hostHeader =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    hostname = hostHeader.split(",")[0].trim().split(":")[0];
  }

  // Redirect if hostname is the non-www version
  if (hostname === "sustainlygreen.com") {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Redirect if the pathname contains any uppercase character
  const pathname = rawUrl.pathname;
  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 301);
  }

  const vendorMatch = VENDOR_UUID_PATH.exec(pathname);
  if (vendorMatch) {
    const redirect = await vendorSlugRedirect(request, vendorMatch[1]);
    if (redirect) return redirect;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
