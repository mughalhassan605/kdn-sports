import { NextResponse, type NextRequest } from "next/server";

// German is served without a prefix: "/events" is rewritten to "/de/events".
// A typed "/de/…" redirects to the clean URL so each page has one address.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/de" || pathname.startsWith("/de/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return;

  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/de" : `/de${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|media|.*\\..*).*)"],
};
