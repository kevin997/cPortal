import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasCaisseAccess } from "@/lib/access";

const PAYMENT_STATUSES = ["pending", "paid", "partially_paid", "overdue", "cancelled"];

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
    const body = await request.json();
    const { status, beneficiaryName, beneficiaryType, amount, dueDate, notes } = body;

    const existing = await prisma.upcomingPayment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Upcoming payment not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data — status-only update or full edit
    const data: Record<string, unknown> = {};

    if (status) {
      if (!PAYMENT_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = status;
    }
    if (beneficiaryName !== undefined) data.beneficiaryName = beneficiaryName;
    if (beneficiaryType !== undefined) {
      if (!["vendor", "investor", "partner", "other"].includes(beneficiaryType)) {
        return NextResponse.json({ error: "Invalid beneficiary type" }, { status: 400 });
      }
      data.beneficiaryType = beneficiaryType;
    }
    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      data.amount = amount;
    }
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (notes !== undefined) data.notes = notes || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const payment = await prisma.upcomingPayment.update({
      where: { id },
      data,
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error("Error updating upcoming payment:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Upcoming payment not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update upcoming payment" },
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

    const existing = await prisma.upcomingPayment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Upcoming payment not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.upcomingPayment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting upcoming payment:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Upcoming payment not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete upcoming payment" },
      { status: 500 }
    );
  }
}
