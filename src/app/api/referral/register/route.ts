import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// Generate unique referral code
function generateReferralCode(): string {
  return nanoid(8).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, promotionId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Verify promotion exists and is active
    if (promotionId) {
      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
      });

      if (!promotion || !promotion.isActive) {
        return NextResponse.json(
          { error: "Invalid or inactive promotion" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let codeExists = await prisma.user.findUnique({
      where: { referralCode },
    });

    // Ensure uniqueness
    while (codeExists) {
      referralCode = generateReferralCode();
      codeExists = await prisma.user.findUnique({
        where: { referralCode },
      });
    }

    // Create user with referrer role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "referrer",
        referralCode,
        walletBalance: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        walletBalance: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error registering referrer:", error);
    return NextResponse.json(
      { error: "Failed to register referrer" },
      { status: 500 }
    );
  }
}
