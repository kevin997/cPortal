import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasCaisseAccess } from "@/lib/access";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !hasCaisseAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forecasts = await prisma.cashForecast.findMany({
      where: { userId: session.user.id },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(forecasts);
  } catch (error) {
    console.error("Error fetching cash forecasts:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecasts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasCaisseAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { department, quantity, unitPrice, deadline, report } = body;
    const parsedQuantity = Number(quantity);
    const parsedUnitPrice = Number(unitPrice);

    if (!department?.trim()) {
      return NextResponse.json({ error: "Department is required" }, { status: 400 });
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0) {
      return NextResponse.json({ error: "Invalid unit price" }, { status: 400 });
    }
    if (!deadline) {
      return NextResponse.json({ error: "Deadline is required" }, { status: 400 });
    }

    const quantityValue = Math.round(parsedQuantity);
    const unitPriceValue = Math.round(parsedUnitPrice);
    const forecast = await prisma.cashForecast.create({
      data: {
        department: department.trim(),
        quantity: quantityValue,
        unitPrice: unitPriceValue,
        total: quantityValue * unitPriceValue,
        deadline: new Date(deadline),
        report: report?.trim() || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(forecast, { status: 201 });
  } catch (error) {
    console.error("Error creating cash forecast:", error);
    return NextResponse.json(
      { error: "Failed to create forecast" },
      { status: 500 }
    );
  }
}
