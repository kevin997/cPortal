import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditSocialMediaPlans, hasContentCreationAccess } from "@/lib/access";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !canEditSocialMediaPlans(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.socialMediaPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Social media plan not found" }, { status: 404 });
    }

    const updated = await prisma.socialMediaPlan.update({
      where: { id },
      data: {
        title: body.title?.trim() || existing.title,
        platform: body.platform === undefined ? undefined : body.platform?.trim() || null,
        campaignName: body.campaignName === undefined ? undefined : body.campaignName?.trim() || null,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        status: body.status || existing.status,
        captionHtml: body.captionHtml === undefined ? undefined : body.captionHtml?.trim() || null,
        adCopyHtml: body.adCopyHtml === undefined ? undefined : body.adCopyHtml?.trim() || null,
        briefHtml: body.briefHtml === undefined ? undefined : body.briefHtml?.trim() || null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating social media plan:", error);
    return NextResponse.json(
      { error: "Failed to update social media plan" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const plan = await prisma.socialMediaPlan.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Social media plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching social media plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch social media plan" },
      { status: 500 }
    );
  }
}
