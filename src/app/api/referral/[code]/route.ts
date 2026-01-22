import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET referrer info by code (public endpoint for lead capture)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const promotionId = searchParams.get("promotionId");

    // Find the referrer by referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: {
        id: true,
        name: true,
        referralCode: true,
      },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    // If promotion ID is provided, get promotion details
    let promotion = null;
    if (promotionId) {
      promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
        select: {
          id: true,
          name: true,
          description: true,
          discountPercent: true,
          isActive: true,
        },
      });

      if (!promotion || !promotion.isActive) {
        return NextResponse.json(
          { error: "Invalid or inactive promotion" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      referrer: {
        name: referrer.name,
        referralCode: referrer.referralCode,
      },
      promotion,
    });
  } catch (error) {
    console.error("Error fetching referrer info:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrer info" },
      { status: 500 }
    );
  }
}
