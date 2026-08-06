import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasMarketingAccess } from "@/lib/access";

// Catch-all proxy to the Eshu messaging platform (bulk SMS + WhatsApp).
// This is the ONLY place ESHU_API_KEY is used — it must never reach the browser.
const ESHU_API_URL = process.env.ESHU_API_URL;
const ESHU_API_KEY = process.env.ESHU_API_KEY;

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth();
    if (!session || !hasMarketingAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ESHU_API_URL || !ESHU_API_KEY) {
      console.error("ESHU_API_URL / ESHU_API_KEY not configured");
      return NextResponse.json(
        { error: "Service de messagerie indisponible" },
        { status: 502 }
      );
    }

    const { path } = await params;
    const targetUrl = new URL(`${ESHU_API_URL}/api/v1/${path.join("/")}`);
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const isBodyMethod = !["GET", "HEAD"].includes(request.method);

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: {
        Authorization: `Bearer ${ESHU_API_KEY}`,
        "Content-Type": "application/json",
      },
      ...(isBodyMethod ? { body: await request.text() } : {}),
    });

    const data = await upstreamResponse.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: upstreamResponse.status });
  } catch (error) {
    console.error("Error proxying Eshu request:", error);
    return NextResponse.json(
      { error: "Service de messagerie indisponible" },
      { status: 502 }
    );
  }
}

export { handler as GET, handler as POST };
