import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "referrer") {
    return NextResponse.json({ error: "2FA not required for referrers" }, { status: 400 });
  }

  const body = await request.json();
  const { code } = body;

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      twoFactorCode: true,
      twoFactorExpiry: true,
      twoFactorAttempts: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if max attempts reached
  if (user.twoFactorAttempts >= 5) {
    // Clear code to force resend
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorCode: null,
        twoFactorExpiry: null,
      },
    });

    return NextResponse.json(
      { error: "Too many attempts. Please request a new code.", remainingAttempts: 0 },
      { status: 429 }
    );
  }

  // Check if code exists
  if (!user.twoFactorCode || !user.twoFactorExpiry) {
    return NextResponse.json(
      { error: "No active code. Please request a new one." },
      { status: 400 }
    );
  }

  // Check if code expired
  if (new Date() > user.twoFactorExpiry) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorCode: null,
        twoFactorExpiry: null,
        twoFactorAttempts: 0,
      },
    });

    return NextResponse.json(
      { error: "Code expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Check if code matches
  if (code !== user.twoFactorCode) {
    const newAttempts = user.twoFactorAttempts + 1;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorAttempts: newAttempts },
    });

    const remaining = 5 - newAttempts;

    if (remaining <= 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorCode: null,
          twoFactorExpiry: null,
        },
      });

      return NextResponse.json(
        { error: "Too many attempts. Please request a new code.", remainingAttempts: 0 },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Invalid code", remainingAttempts: remaining },
      { status: 400 }
    );
  }

  // Code matches — mark as verified and clear 2FA fields
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorCode: null,
      twoFactorExpiry: null,
      twoFactorAttempts: 0,
      twoFactorVerifiedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
