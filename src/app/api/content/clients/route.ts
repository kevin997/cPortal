import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasContentCreationAccess } from "@/lib/access";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.creativeRequest.findMany({
      where: {
        clientName: {
          not: null,
        },
      },
      select: {
        clientName: true,
      },
      orderBy: {
        clientName: "asc",
      },
    });

    const clients = Array.from(
      new Set(
        requests
          .map((request) => request.clientName?.trim())
          .filter((client): client is string => Boolean(client))
      )
    );

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching content clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch content clients" },
      { status: 500 }
    );
  }
}
