import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    // Ensure the operation belongs to the requesting user
    const existing = await prisma.cashOperation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Operation not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.cashOperation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting cash operation:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Operation not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete operation" },
      { status: 500 }
    );
  }
}
