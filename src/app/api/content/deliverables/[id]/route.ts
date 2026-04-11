import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasContentCreationAccess } from "@/lib/access";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.creativeDeliverable.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Creative deliverable not found" }, { status: 404 });
    }

    const updated = await prisma.creativeDeliverable.update({
      where: { id },
      data: {
        title: body.title?.trim() || existing.title,
        platform: body.platform === undefined ? undefined : body.platform?.trim() || null,
        format: body.format === undefined ? undefined : body.format?.trim() || null,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        status: body.status || existing.status,
        notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
        ownerId: body.ownerId === undefined ? undefined : body.ownerId || null,
      },
      include: {
        request: {
          select: {
            id: true,
            reference: true,
            clientName: true,
            contentType: true,
            publicationDate: true,
          },
        },
        owner: {
          select: { id: true, name: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating creative deliverable:", error);
    return NextResponse.json(
      { error: "Failed to update creative deliverable" },
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
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.creativeDeliverable.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Creative deliverable not found" }, { status: 404 });
    }

    await prisma.creativeDeliverable.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting creative deliverable:", error);
    return NextResponse.json(
      { error: "Failed to delete creative deliverable" },
      { status: 500 }
    );
  }
}
