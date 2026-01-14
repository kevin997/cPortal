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
    const bootcampId = searchParams.get("bootcampId");
    const studentId = searchParams.get("studentId");

    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(bootcampId && { bootcampSessionId: bootcampId }),
        ...(studentId && { studentId }),
      },
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
      orderBy: {
        enrollmentDate: "desc",
      },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
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
    const { studentId, bootcampSessionId, status, notes } = body;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if bootcamp exists and has capacity
    const bootcamp = await prisma.bootcampSession.findUnique({
      where: { id: bootcampSessionId },
    });

    if (!bootcamp) {
      return NextResponse.json({ error: "Bootcamp not found" }, { status: 404 });
    }

    if (bootcamp.currentCapacity >= bootcamp.targetCapacity) {
      return NextResponse.json(
        { error: "Bootcamp is at full capacity" },
        { status: 400 }
      );
    }

    // Check if student is already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_bootcampSessionId: {
          studentId,
          bootcampSessionId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Student is already enrolled in this bootcamp" },
        { status: 400 }
      );
    }

    // Create enrollment and update bootcamp capacity in a transaction
    const [enrollment] = await prisma.$transaction([
      prisma.enrollment.create({
        data: {
          studentId,
          bootcampSessionId,
          enrolledById: session.user.id,
          status: status || "enrolled",
          notes,
        },
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
      }),
      prisma.bootcampSession.update({
        where: { id: bootcampSessionId },
        data: {
          currentCapacity: {
            increment: 1,
          },
        },
      }),
    ]);

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}
