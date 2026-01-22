import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET all promotions (public for active ones, all for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    // If not authenticated, only return active promotions
    const whereClause = !session || activeOnly ? { isActive: true } : undefined;

    const promotions = await prisma.promotion.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

// POST - Create new promotion (sales team only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has sales team or admin role (not referrer)
    const allowedRoles = ["admin", "sales_agent", "sales_rep", "sales_manager"];
    if (!allowedRoles.includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, rewardAmount, discountPercent, isActive } = body;

    if (!name || rewardAmount === undefined || discountPercent === undefined) {
      return NextResponse.json(
        { error: "Name, reward amount, and discount percent are required" },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        rewardAmount: parseInt(rewardAmount),
        discountPercent: parseInt(discountPercent),
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error("Error creating promotion:", error);
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    );
  }
}
