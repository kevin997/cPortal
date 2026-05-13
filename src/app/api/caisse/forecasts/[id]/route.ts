import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasCaisseAccess } from "@/lib/access";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasCaisseAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.cashForecast.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const forecast = await prisma.cashForecast.update({
      where: { id },
      data: {
        department: department.trim(),
        quantity: quantityValue,
        unitPrice: unitPriceValue,
        total: quantityValue * unitPriceValue,
        deadline: new Date(deadline),
        report: report?.trim() || null,
      },
    });

    return NextResponse.json(forecast);
  } catch (error: any) {
    console.error("Error updating cash forecast:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update forecast" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasCaisseAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.cashForecast.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.cashForecast.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting cash forecast:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete forecast" },
      { status: 500 }
    );
  }
}
