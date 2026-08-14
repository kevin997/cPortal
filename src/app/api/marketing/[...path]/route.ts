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

    // A non-admin can prepare and preview campaigns, but a large WhatsApp
    // audience requires an administrator's explicit launch approval.
    if (
      request.method === "POST" &&
      path.length === 3 &&
      path[0] === "campaigns" &&
      path[2] === "send-now" &&
      session.user.role !== "admin"
    ) {
      const previewResponse = await fetch(
        `${AUTOMATIONS_API_URL}/api/campaigns/${path[1]}/preview`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${AUTOMATIONS_API_TOKEN}` },
        }
      );
      const preview = await previewResponse.json().catch(() => null);
      if (!previewResponse.ok) {
        return NextResponse.json(preview ?? { error: "Aperçu indisponible" }, {
          status: previewResponse.status,
        });
      }
      if ((preview?.audience_count ?? 0) > 50) {
        return NextResponse.json(
          {
            error:
              "Cette campagne dépasse 50 destinataires et doit être lancée par un administrateur.",
          },
          { status: 403 }
        );
      }
    }

    // Relaunching re-sends to an entire saved list in one click, which is the
    // large-audience case the rule above exists for -- and it would not match
    // that check, whose shape is campaigns/{id}/send-now. Admin-only.
    if (
      request.method === "POST" &&
      path.length === 4 &&
      path[0] === "messaging" &&
      path[1] === "campaigns" &&
      path[3] === "relaunch" &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Le relancement d'une campagne doit être effectué par un administrateur." },
        { status: 403 }
      );
    }

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
