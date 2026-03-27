import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["pending", "paid", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.upcomingPayment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Upcoming payment not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payment = await prisma.upcomingPayment.update({
      where: { id },
      data: { status },
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
    if (!session) {
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
