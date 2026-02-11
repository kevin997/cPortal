import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });

  // /dashboard/* routes
  if (pathname.startsWith("/dashboard")) {
    // Not authenticated → login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Admin without 2FA → verify-2fa
    if (token.role !== "referrer" && !token.twoFactorVerified) {
      return NextResponse.redirect(new URL("/verify-2fa", request.url));
    }

    return NextResponse.next();
  }

  // /verify-2fa route
  if (pathname === "/verify-2fa") {
    // Not authenticated → login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Referrer → referral dashboard
    if (token.role === "referrer") {
      return NextResponse.redirect(new URL("/referral/dashboard", request.url));
    }

    // Already verified → dashboard
    if (token.twoFactorVerified) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/verify-2fa"],
};
