import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        leads: {
          include: {
            referrer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotion" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has sales team or admin role
    const allowedRoles = ["admin", "sales_agent", "sales_rep", "sales_manager"];
    if (!allowedRoles.includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, rewardAmount, discountPercent, isActive } = body;

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name,
        description,
        rewardAmount: rewardAmount !== undefined ? parseInt(rewardAmount) : undefined,
        discountPercent: discountPercent !== undefined ? parseInt(discountPercent) : undefined,
        isActive,
      },
    });

    return NextResponse.json(promotion);
  } catch (error: any) {
    console.error("Error updating promotion:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has sales team or admin role
    const allowedRoles = ["admin", "sales_agent", "sales_rep", "sales_manager"];
    if (!allowedRoles.includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.promotion.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Promotion deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting promotion:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete promotion" },
      { status: 500 }
    );
  }
}
