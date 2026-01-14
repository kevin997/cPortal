import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bootcamp = await prisma.bootcampSession.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            student: true,
            enrolledBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!bootcamp) {
      return NextResponse.json({ error: "Bootcamp not found" }, { status: 404 });
    }

    return NextResponse.json(bootcamp);
  } catch (error) {
    console.error("Error fetching bootcamp:", error);
    return NextResponse.json(
      { error: "Failed to fetch bootcamp" },
      { status: 500 }
    );
  }
}

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
    const {
      name,
      description,
      startDate,
      endDate,
      targetCapacity,
      status,
      location,
      imageUrl,
    } = body;

    const bootcamp = await prisma.bootcampSession.update({
      where: { id },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetCapacity: parseInt(targetCapacity),
        status,
        location,
        imageUrl,
      },
    });

    return NextResponse.json(bootcamp);
  } catch (error: any) {
    console.error("Error updating bootcamp:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Bootcamp not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update bootcamp" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.bootcampSession.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bootcamp deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting bootcamp:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Bootcamp not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete bootcamp" },
      { status: 500 }
    );
  }
}
