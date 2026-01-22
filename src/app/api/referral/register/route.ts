import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Validate referral code format (alphanumeric, 4-20 chars, uppercase)
function isValidReferralCode(code: string): boolean {
  const regex = /^[A-Z0-9]{4,20}$/;
  return regex.test(code);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, promotionId, referralCode } = body;

    if (!name || !email || !password || !referralCode) {
      return NextResponse.json(
        { error: "Name, email, password, and referral code are required" },
        { status: 400 }
      );
    }

    // Normalize referral code to uppercase
    const normalizedCode = referralCode.trim().toUpperCase();

    // Validate referral code format
    if (!isValidReferralCode(normalizedCode)) {
      return NextResponse.json(
        { error: "Referral code must be 4-20 alphanumeric characters (letters and numbers only)" },
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

    // Check if referral code is already taken
    const existingCode = await prisma.user.findUnique({
      where: { referralCode: normalizedCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "This referral code is already taken. Please choose another." },
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

    // Create user with referrer role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "referrer",
        referralCode: normalizedCode,
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
