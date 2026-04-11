import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditSocialMediaPlans, hasContentCreationAccess } from "@/lib/access";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const where = month
      ? (() => {
          const from = new Date(`${month}-01T00:00:00`);
          const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
          return {
            scheduledFor: {
              gte: from,
              lt: to,
            },
          };
        })()
      : {};

    const plans = await prisma.socialMediaPlan.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching social media plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch social media plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !canEditSocialMediaPlans(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      clientName,
      platform,
      campaignName,
      scheduledFor,
      status,
      captionHtml,
      adCopyHtml,
      briefHtml,
    } = body;

    if (!title?.trim() || !scheduledFor) {
      return NextResponse.json(
        { error: "title and scheduledFor are required" },
        { status: 400 }
      );
    }

    const plan = await prisma.socialMediaPlan.create({
      data: {
        title: title.trim(),
        clientName: clientName?.trim() || null,
        platform: platform?.trim() || null,
        campaignName: campaignName?.trim() || null,
        scheduledFor: new Date(scheduledFor),
        status: status || "planned",
        captionHtml: captionHtml?.trim() || null,
        adCopyHtml: adCopyHtml?.trim() || null,
        briefHtml: briefHtml?.trim() || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating social media plan:", error);
    return NextResponse.json(
      { error: "Failed to create social media plan" },
      { status: 500 }
    );
  }
}
