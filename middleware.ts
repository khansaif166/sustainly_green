import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "www.sustainlygreen.com";

export const runtime = "experimental-edge";

export function middleware(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
