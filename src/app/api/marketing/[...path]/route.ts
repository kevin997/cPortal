import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasMarketingAccess } from "@/lib/access";

// Catch-all proxy to the external Marketing Automations FastAPI service.
// This is the ONLY place AUTOMATIONS_API_TOKEN is used — it must never reach the browser.
const AUTOMATIONS_API_URL = process.env.AUTOMATIONS_API_URL;
const AUTOMATIONS_API_TOKEN = process.env.AUTOMATIONS_API_TOKEN;

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth();
    if (!session || !hasMarketingAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!AUTOMATIONS_API_URL || !AUTOMATIONS_API_TOKEN) {
      console.error("AUTOMATIONS_API_URL / AUTOMATIONS_API_TOKEN not configured");
      return NextResponse.json(
        { error: "Service automations indisponible" },
        { status: 502 }
      );
    }

    const { path } = await params;
    const targetUrl = new URL(`${AUTOMATIONS_API_URL}/api/${path.join("/")}`);
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const isBodyMethod = !["GET", "HEAD"].includes(request.method);
    const contentType = request.headers.get("content-type");

    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers: {
        Authorization: `Bearer ${AUTOMATIONS_API_TOKEN}`,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
    };

    if (isBodyMethod) {
      // Stream the body through (multipart uploads for /imports included) rather than
      // buffering it, and preserve the original content-type (incl. multipart boundary).
      init.body = request.body;
      init.duplex = "half";
    }

    const upstreamResponse = await fetch(targetUrl.toString(), init);

    const responseContentType = upstreamResponse.headers.get("content-type") || "";
    if (responseContentType.includes("application/json")) {
      const data = await upstreamResponse.json();
      return NextResponse.json(data, { status: upstreamResponse.status });
    }

    const text = await upstreamResponse.text();
    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: { "content-type": responseContentType || "text/plain" },
    });
  } catch (error) {
    console.error("Error proxying marketing request:", error);
    return NextResponse.json(
      { error: "Service automations indisponible" },
      { status: 502 }
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
