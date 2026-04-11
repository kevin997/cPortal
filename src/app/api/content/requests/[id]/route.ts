import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasContentCreationAccess } from "@/lib/access";

function parseOptionalDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasContentCreationAccess(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.creativeRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Creative request not found" }, { status: 404 });
    }

    const socialMediaPlanId =
      body.socialMediaPlanId === undefined ? existing.socialMediaPlanId : body.socialMediaPlanId || null;
    const selectedPlan = socialMediaPlanId
      ? await prisma.socialMediaPlan.findUnique({
          where: { id: socialMediaPlanId },
        })
      : null;

    const updated = await prisma.creativeRequest.update({
      where: { id },
      data: {
        reference: body.reference?.trim() || existing.reference,
        requestDate: body.requestDate ? new Date(body.requestDate) : undefined,
        requesterName: body.requesterName?.trim() || existing.requesterName,
        requesterFunction: body.requesterFunction?.trim() || null,
        servicePole: body.servicePole?.trim() || null,
        clientName: body.clientName?.trim() || null,
        accountManager: body.accountManager?.trim() || null,
        clientApproverContact: body.clientApproverContact?.trim() || null,
        contentType: body.contentType?.trim() || existing.contentType,
        platform: body.platform?.trim() || null,
        objective: body.objective?.trim() || null,
        campaignName: body.campaignName?.trim() || null,
        mainMessage: body.mainMessage?.trim() || null,
        callToAction: body.callToAction?.trim() || null,
        copyProvided: body.copyProvided === undefined ? existing.copyProvided : !!body.copyProvided,
        copywriterName: body.copywriterName?.trim() || null,
        desiredFormat: body.desiredFormat?.trim() || null,
        quantity: body.quantity ? Number(body.quantity) : null,
        language: body.language?.trim() || null,
        includeLogo: body.includeLogo === undefined ? existing.includeLogo : !!body.includeLogo,
        brandGuidelinesProvided:
          body.brandGuidelinesProvided === undefined
            ? existing.brandGuidelinesProvided
            : !!body.brandGuidelinesProvided,
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
        photosAvailable: body.photosAvailable === undefined ? existing.photosAvailable : !!body.photosAvailable,
        videosAvailable: body.videosAvailable === undefined ? existing.videosAvailable : !!body.videosAvailable,
        logoAvailable: body.logoAvailable === undefined ? existing.logoAvailable : !!body.logoAvailable,
        sourceTextAvailable:
          body.sourceTextAvailable === undefined ? existing.sourceTextAvailable : !!body.sourceTextAvailable,
        visualReferences: body.visualReferences?.trim() || null,
        referenceLinks: body.referenceLinks?.trim() || null,
        assetLocation: body.assetLocation?.trim() || null,
        creativeDueDate:
          body.creativeDueDate === undefined ? undefined : parseOptionalDate(body.creativeDueDate),
        publicationDate:
          body.publicationDate === undefined ? undefined : parseOptionalDate(body.publicationDate),
        publicationTime: body.publicationTime?.trim() || null,
        urgency: body.urgency || existing.urgency,
        validationRequired: body.validationRequired || existing.validationRequired,
        feedbackRounds: body.feedbackRounds ? Number(body.feedbackRounds) : null,
        requesterValidation: body.requesterValidation?.trim() || null,
        marketingValidation: body.marketingValidation?.trim() || null,
        clientValidation: body.clientValidation?.trim() || null,
        finalValidation: body.finalValidation?.trim() || null,
        additionalNotes: body.additionalNotes?.trim() || null,
        workflowStatus: body.workflowStatus || existing.workflowStatus,
        workflowResponsible: body.workflowResponsible?.trim() || null,
        workflowDate:
          body.workflowDate === undefined ? undefined : parseOptionalDate(body.workflowDate),
        assignedToId: body.assignedToId === undefined ? undefined : body.assignedToId || null,
        socialMediaPlanId,
        socialMediaPlanTitle: selectedPlan?.title || null,
        socialMediaCaptionHtml: selectedPlan?.captionHtml || null,
        socialMediaAdCopyHtml: selectedPlan?.adCopyHtml || null,
      },
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
        socialMediaPlan: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating creative request:", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "This reference already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update creative request" },
      { status: 500 }
    );
  }
}
