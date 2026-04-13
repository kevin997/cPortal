import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasContentCreationAccess } from "@/lib/access";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hours = Number(searchParams.get("hours") || 0);
    const now = new Date();
    const until = hours > 0 ? new Date(now.getTime() + hours * 60 * 60 * 1000) : null;

    const deliverables = await prisma.creativeDeliverable.findMany({
      where: {
        ...(until
          ? {
              scheduledFor: {
                gte: now,
                lte: until,
              },
            }
          : {}),
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
        socialMediaPlan: {
          select: {
            id: true,
            title: true,
            clientName: true,
            platform: true,
            scheduledFor: true,
          },
        },
        owner: {
          select: { id: true, name: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error("Error fetching creative deliverables:", error);
    return NextResponse.json(
      { error: "Failed to fetch creative deliverables" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      requestId,
      title,
      platform,
      format,
      scheduledFor,
      status,
      notes,
      ownerId,
      socialMediaPlanId,
    } = body as {
      requestId?: string;
      title?: string;
      platform?: string;
      format?: string;
      scheduledFor?: string;
      status?: string;
      notes?: string;
      ownerId?: string;
      socialMediaPlanId?: string | null;
    };

    if (!requestId || !title?.trim() || !scheduledFor) {
      return NextResponse.json(
        { error: "requestId, title and scheduledFor are required" },
        { status: 400 }
      );
    }

    const selectedPlan = socialMediaPlanId
      ? await prisma.socialMediaPlan.findUnique({
          where: { id: socialMediaPlanId },
        })
      : null;

    const deliverable = await prisma.creativeDeliverable.create({
      data: {
        requestId,
        title: title.trim(),
        platform: platform?.trim() || null,
        format: format?.trim() || null,
        scheduledFor: new Date(scheduledFor),
        status: status || "planned",
        notes: notes?.trim() || null,
        socialMediaPlanId: socialMediaPlanId || null,
        socialMediaPlanTitle: selectedPlan?.title || null,
        socialMediaCaptionHtml: selectedPlan?.captionHtml || null,
        socialMediaAdCopyHtml: selectedPlan?.adCopyHtml || null,
        ownerId: ownerId || session.user.id,
        createdById: session.user.id,
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
        socialMediaPlan: {
          select: {
            id: true,
            title: true,
            clientName: true,
            platform: true,
            scheduledFor: true,
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

    return NextResponse.json(deliverable, { status: 201 });
  } catch (error) {
    console.error("Error creating creative deliverable:", error);
    return NextResponse.json(
      { error: "Failed to create creative deliverable" },
      { status: 500 }
    );
  }
}
