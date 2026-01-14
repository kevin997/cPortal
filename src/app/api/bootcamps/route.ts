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
    const status = searchParams.get("status");

    const bootcamps = await prisma.bootcampSession.findMany({
      where: status ? { status } : undefined,
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json(bootcamps);
  } catch (error) {
    console.error("Error fetching bootcamps:", error);
    return NextResponse.json(
      { error: "Failed to fetch bootcamps" },
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
      name,
      description,
      startDate,
      endDate,
      targetCapacity,
      status,
      location,
      imageUrl,
    } = body;

    const bootcamp = await prisma.bootcampSession.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetCapacity: parseInt(targetCapacity),
        status: status || "upcoming",
        location,
        imageUrl,
        currentCapacity: 0,
      },
    });

    return NextResponse.json(bootcamp, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bootcamp:", error);
    return NextResponse.json(
      { error: "Failed to create bootcamp" },
      { status: 500 }
    );
  }
}
