import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canManageCollaborators, hasCaisseAccess } from "@/lib/access";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  // /dashboard/* routes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.user.role !== "referrer" && !session.user.twoFactorVerified) {
      return NextResponse.redirect(new URL("/verify-2fa", request.url));
    }

    if (pathname.startsWith("/dashboard/caisse") && !hasCaisseAccess(session.user.role)) {
      return NextResponse.redirect(new URL("/dashboard/creation-contenu", request.url));
    }

    if (
      pathname.startsWith("/dashboard/collaborators") &&
      !canManageCollaborators(session.user.role)
    ) {
      return NextResponse.redirect(new URL("/dashboard/creation-contenu", request.url));
    }

    return NextResponse.next();
  }

  // /verify-2fa route
  if (pathname === "/verify-2fa") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.user.role === "referrer") {
      return NextResponse.redirect(new URL("/referral/dashboard", request.url));
    }

    if (session.user.twoFactorVerified) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/verify-2fa"],
};
