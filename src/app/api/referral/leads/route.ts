import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET leads for the authenticated referrer
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const leads = await prisma.lead.findMany({
      where: {
        referrerId: session.user?.id,
        ...(status && { status }),
      },
      include: {
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

// POST - Create a new lead (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, referralCode, promotionId } = body;

    if (!name || !phone || !referralCode || !promotionId) {
      return NextResponse.json(
        { error: "Name, phone, referral code, and promotion are required" },
        { status: 400 }
      );
    }

    // Find the referrer by referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    // Verify promotion exists and is active
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion || !promotion.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive promotion" },
        { status: 400 }
      );
    }

    // Check for duplicate lead (same phone and promotion)
    const existingLead = await prisma.lead.findFirst({
      where: {
        phone,
        promotionId,
      },
    });

    if (existingLead) {
      return NextResponse.json(
        { error: "This phone number is already registered for this promotion" },
        { status: 400 }
      );
    }

    // Prevent self-referral by checking if the phone belongs to the referrer
    if (referrer.phone === phone) {
      return NextResponse.json(
        { error: "Self-referral is not allowed" },
        { status: 400 }
      );
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        referrerId: referrer.id,
        promotionId,
        status: "pending",
      },
      include: {
        promotion: {
          select: {
            name: true,
            discountPercent: true,
          },
        },
        referrer: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Lead created successfully",
        lead: {
          id: lead.id,
          name: lead.name,
          promotionName: lead.promotion.name,
          discount: lead.promotion.discountPercent,
          referrerName: lead.referrer.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
