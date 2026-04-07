import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("authorization");

  const isAtlasRoute = request.nextUrl.pathname.startsWith("/atlas");

  // Protect atlas routes
  if (isAtlasRoute && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/atlas/:path*"],
};
