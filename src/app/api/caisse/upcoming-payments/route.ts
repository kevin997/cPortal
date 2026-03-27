import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const payments = await prisma.upcomingPayment.findMany({
      where: {
        userId: session.user.id,
        ...(status && status !== "all" ? { status } : {}),
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching upcoming payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { beneficiaryName, beneficiaryType, amount, dueDate, notes } = body;

    if (!beneficiaryName?.trim()) {
      return NextResponse.json({ error: "Beneficiary name is required" }, { status: 400 });
    }
    if (!beneficiaryType || !["vendor", "investor", "partner", "other"].includes(beneficiaryType)) {
      return NextResponse.json({ error: "Invalid beneficiary type" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!dueDate) {
      return NextResponse.json({ error: "Due date is required" }, { status: 400 });
    }

    const payment = await prisma.upcomingPayment.create({
      data: {
        beneficiaryName: beneficiaryName.trim(),
        beneficiaryType,
        amount: Math.round(Number(amount)),
        dueDate: new Date(dueDate),
        notes: notes || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating upcoming payment:", error);
    return NextResponse.json(
      { error: "Failed to create upcoming payment" },
      { status: 500 }
    );
  }
}
