import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "www.sustainlygreen.com";

export const runtime = "experimental-edge";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const requestHost = forwardedHost.split(",")[0].trim().split(":")[0];
  let redirect = false;

  if (
    url.hostname === "sustainlygreen.com" ||
    requestHost === "sustainlygreen.com"
  ) {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    redirect = true;
  }

  const lowercasePath = url.pathname.toLowerCase();
  if (url.pathname !== lowercasePath) {
    url.pathname = lowercasePath;
    redirect = true;
  }

  if (url.pathname === "/browse") {
    const type = url.searchParams.get("type");
    if (type && type !== type.toLowerCase()) {
      url.searchParams.set("type", type.toLowerCase());
      redirect = true;
    }
  }

  return redirect
    ? NextResponse.redirect(url, 301)
    : NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
