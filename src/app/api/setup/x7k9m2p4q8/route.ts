import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Secret setup endpoint for creating users
// POST /api/setup/x7k9m2p4q8
// Header: x-setup-key: cPortal-Setup-2024!Secret

const SETUP_KEY = "cPortal-Setup-2024!Secret";

interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: "sales_agent" | "sales_rep" | "sales_manager" | "admin";
}

interface BulkCreateRequest {
  users: CreateUserRequest[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify setup key
    const setupKey = request.headers.get("x-setup-key");
    if (setupKey !== SETUP_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check if bulk or single user creation
    if (body.users && Array.isArray(body.users)) {
      // Bulk creation
      const { users } = body as BulkCreateRequest;
      const createdUsers = [];

      for (const userData of users) {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          createdUsers.push({ email: userData.email, status: "already_exists" });
          continue;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            role: userData.role,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });

        createdUsers.push({ ...user, status: "created" });
      }

      return NextResponse.json({
        message: "Bulk user creation completed",
        users: createdUsers,
      });
    } else {
      // Single user creation
      const { email, name, password, role } = body as CreateUserRequest;

      if (!email || !name || !password || !role) {
        return NextResponse.json(
          { error: "Missing required fields: email, name, password, role" },
          { status: 400 }
        );
      }

      const validRoles = ["sales_agent", "sales_rep", "sales_manager", "admin"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        message: "User created successfully",
        user,
      });
    }
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create user(s)" },
      { status: 500 }
    );
  }
}

// GET - List all users (for verification)
export async function GET(request: NextRequest) {
  try {
    const setupKey = request.headers.get("x-setup-key");
    if (setupKey !== SETUP_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
