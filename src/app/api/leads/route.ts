import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET all leads (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const promotionId = searchParams.get("promotionId");

    const leads = await prisma.lead.findMany({
      where: {
        ...(status && { status }),
        ...(promotionId && { promotionId }),
      },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        promotion: {
          select: {
            id: true,
            name: true,
            rewardAmount: true,
            discountPercent: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
