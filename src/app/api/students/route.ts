import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PAYMENT_STATUSES = ["paid", "partially_paid", "pending", "overdue", "cancelled"];
const PAYMENT_STATUS_SEARCH: Record<string, string> = {
  paye: "paid",
  payé: "paid",
  partiel: "partially_paid",
  partiellement: "partially_paid",
  attente: "pending",
  pending: "pending",
  retard: "overdue",
  overdue: "overdue",
  annule: "cancelled",
  annulé: "cancelled",
  cancelled: "cancelled",
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const paymentStatus = PAYMENT_STATUS_SEARCH[search.toLowerCase()];

    const students = await prisma.student.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search } },
              { email: { contains: search } },
              { phoneNumber: { contains: search } },
              ...(paymentStatus ? [{ paymentStatus }] : []),
            ],
          }
        : undefined,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
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

    const student = await prisma.student.create({
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
        createdById: session.user.id,
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

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("Error creating student:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A student with this email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
