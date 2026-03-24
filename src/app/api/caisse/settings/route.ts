import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  annualTarget: 50_000_000,
  monthlyTarget: 4_000_000,
  telegramBotToken: null,
  telegramChatId: null,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.cashSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Auto-create defaults on first access
    if (!settings) {
      settings = await prisma.cashSettings.create({
        data: { userId: session.user.id, ...DEFAULT_SETTINGS },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching cash settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { annualTarget, monthlyTarget, telegramBotToken, telegramChatId } = body;

    const settings = await prisma.cashSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        annualTarget: annualTarget ?? DEFAULT_SETTINGS.annualTarget,
        monthlyTarget: monthlyTarget ?? DEFAULT_SETTINGS.monthlyTarget,
        telegramBotToken: telegramBotToken ?? null,
        telegramChatId: telegramChatId ?? null,
      },
      update: {
        ...(annualTarget !== undefined && { annualTarget: Number(annualTarget) }),
        ...(monthlyTarget !== undefined && { monthlyTarget: Number(monthlyTarget) }),
        ...(telegramBotToken !== undefined && { telegramBotToken: telegramBotToken || null }),
        ...(telegramChatId !== undefined && { telegramChatId: telegramChatId || null }),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating cash settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
