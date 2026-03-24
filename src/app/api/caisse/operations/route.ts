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
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const operations = await prisma.cashOperation.findMany({
      where: {
        userId: session.user.id,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(operations);
  } catch (error) {
    console.error("Error fetching cash operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations" },
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
    const { type, amount, category, description, date } = body;

    if (!type || !["in", "out"].includes(type)) {
      return NextResponse.json({ error: "Invalid operation type" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const operation = await prisma.cashOperation.create({
      data: {
        type,
        amount: Math.round(Number(amount)),
        category,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        userId: session.user.id,
      },
    });

    return NextResponse.json(operation, { status: 201 });
  } catch (error) {
    console.error("Error creating cash operation:", error);
    return NextResponse.json(
      { error: "Failed to create operation" },
      { status: 500 }
    );
  }
}
