import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasContentCreationAccess } from "@/lib/access";

function parseOptionalDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.creativeRequest.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
        deliverables: {
          include: {
            owner: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: [{ scheduledFor: "asc" }],
        },
        assets: {
          orderBy: [{ createdAt: "desc" }],
        },
      },
      orderBy: [{ publicationDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching creative requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch creative requests" },
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
    const reference = body.reference?.trim();
    const requesterName = body.requesterName?.trim();
    const contentType = body.contentType?.trim();

    if (!reference || !requesterName || !contentType) {
      return NextResponse.json(
        { error: "reference, requesterName and contentType are required" },
        { status: 400 }
      );
    }

    const created = await prisma.creativeRequest.create({
      data: {
        reference,
        requestDate: parseOptionalDate(body.requestDate) ?? new Date(),
        requesterName,
        requesterFunction: body.requesterFunction?.trim() || null,
        servicePole: body.servicePole?.trim() || null,
        clientName: body.clientName?.trim() || null,
        accountManager: body.accountManager?.trim() || null,
        clientApproverContact: body.clientApproverContact?.trim() || null,
        contentType,
        platform: body.platform?.trim() || null,
        objective: body.objective?.trim() || null,
        campaignName: body.campaignName?.trim() || null,
        mainMessage: body.mainMessage?.trim() || null,
        callToAction: body.callToAction?.trim() || null,
        copyProvided: !!body.copyProvided,
        copywriterName: body.copywriterName?.trim() || null,
        desiredFormat: body.desiredFormat?.trim() || null,
        quantity: body.quantity ? Number(body.quantity) : null,
        language: body.language?.trim() || null,
        includeLogo: !!body.includeLogo,
        brandGuidelinesProvided: !!body.brandGuidelinesProvided,
        priceToDisplay: body.priceToDisplay?.trim() || null,
        dateToDisplay: body.dateToDisplay?.trim() || null,
        timeToDisplay: body.timeToDisplay?.trim() || null,
        locationToDisplay: body.locationToDisplay?.trim() || null,
        contactNumber: body.contactNumber?.trim() || null,
        linkUrl: body.linkUrl?.trim() || null,
        hashtags: body.hashtags?.trim() || null,
        legalMentions: body.legalMentions?.trim() || null,
        partnersSponsors: body.partnersSponsors?.trim() || null,
        mandatoryElements: body.mandatoryElements?.trim() || null,
        photosAvailable: !!body.photosAvailable,
        videosAvailable: !!body.videosAvailable,
        logoAvailable: !!body.logoAvailable,
        sourceTextAvailable: !!body.sourceTextAvailable,
        visualReferences: body.visualReferences?.trim() || null,
        referenceLinks: body.referenceLinks?.trim() || null,
        assetLocation: body.assetLocation?.trim() || null,
        creativeDueDate: parseOptionalDate(body.creativeDueDate),
        publicationDate: parseOptionalDate(body.publicationDate),
        publicationTime: body.publicationTime?.trim() || null,
        urgency: body.urgency || "normal",
        validationRequired: body.validationRequired || "internal_only",
        feedbackRounds: body.feedbackRounds ? Number(body.feedbackRounds) : null,
        requesterValidation: body.requesterValidation?.trim() || null,
        marketingValidation: body.marketingValidation?.trim() || null,
        clientValidation: body.clientValidation?.trim() || null,
        finalValidation: body.finalValidation?.trim() || null,
        additionalNotes: body.additionalNotes?.trim() || null,
        workflowStatus: body.workflowStatus || "brief_received",
        workflowResponsible: body.workflowResponsible?.trim() || null,
        workflowDate: parseOptionalDate(body.workflowDate),
        assignedToId: body.assignedToId || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
        deliverables: true,
        assets: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating creative request:", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "This reference already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create creative request" },
      { status: 500 }
    );
  }
}
