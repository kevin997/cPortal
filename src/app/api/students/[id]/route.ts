import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PAYMENT_STATUSES = ["paid", "partially_paid", "pending", "overdue", "cancelled"];

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
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            bootcampSession: true,
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

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
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
      fullName,
      email,
      phoneNumber,
      neighbourhood,
      address,
      dateOfBirth,
      gender,
      paymentStatus,
      totalAmountDue,
      amountPaid,
      notes,
    } = body;

    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }
    if (totalAmountDue !== undefined && (!Number.isFinite(Number(totalAmountDue)) || Number(totalAmountDue) < 0)) {
      return NextResponse.json({ error: "Invalid total amount due" }, { status: 400 });
    }
    if (amountPaid !== undefined && (!Number.isFinite(Number(amountPaid)) || Number(amountPaid) < 0)) {
      return NextResponse.json({ error: "Invalid amount paid" }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        fullName,
        email,
        phoneNumber,
        neighbourhood,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        paymentStatus: paymentStatus || "pending",
        totalAmountDue: Math.round(Number(totalAmountDue || 0)),
        amountPaid: Math.round(Number(amountPaid || 0)),
        notes,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(student);
  } catch (error: any) {
    console.error("Error updating student:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A student with this email already exists" },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update student" },
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
    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting student:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
