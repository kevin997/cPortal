import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: params.id },
      include: {
        student: true,
        bootcampSession: true,
        enrolledBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;

    const enrollment = await prisma.enrollment.update({
      where: { id: params.id },
      data: {
        status,
        notes,
      },
      include: {
        student: true,
        bootcampSession: true,
      },
    });

    return NextResponse.json(enrollment);
  } catch (error: any) {
    console.error("Error updating enrollment:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get enrollment to update bootcamp capacity
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: params.id },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Delete enrollment and update bootcamp capacity
    await prisma.$transaction([
      prisma.enrollment.delete({
        where: { id: params.id },
      }),
      prisma.bootcampSession.update({
        where: { id: enrollment.bootcampSessionId },
        data: {
          currentCapacity: {
            decrement: 1,
          },
        },
      }),
    ]);

    return NextResponse.json({ message: "Enrollment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting enrollment:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}
