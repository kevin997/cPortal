import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageCollaborators, COLLABORATOR_ROLES } from "@/lib/access";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !canManageCollaborators(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collaborators = await prisma.user.findMany({
      where: {
        role: { in: [...COLLABORATOR_ROLES] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(collaborators);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !canManageCollaborators(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, phone } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      phone?: string;
    };

    if (!name?.trim() || !email?.trim() || !password?.trim() || !role) {
      return NextResponse.json(
        { error: "name, email, password and role are required" },
        { status: 400 }
      );
    }

    if (!COLLABORATOR_ROLES.includes(role as (typeof COLLABORATOR_ROLES)[number])) {
      return NextResponse.json({ error: "Invalid collaborator role" }, { status: 400 });
    }

    if (password.trim().length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    const collaborator = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        password: hashedPassword,
        role,
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(collaborator, { status: 201 });
  } catch (error) {
    console.error("Error creating collaborator:", error);
    return NextResponse.json(
      { error: "Failed to create collaborator" },
      { status: 500 }
    );
  }
}
