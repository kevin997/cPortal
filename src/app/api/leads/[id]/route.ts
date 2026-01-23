import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyLeadStatusChanged } from "@/lib/telegram";

// GET single lead
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
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            walletBalance: true,
          },
        },
        promotion: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PUT - Update lead status (admin can convert and credit referrer)
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
    const { status, notes } = body;

    // Get current lead
    const currentLead = await prisma.lead.findUnique({
      where: { id },
      include: {
        promotion: true,
        referrer: true,
      },
    });

    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // If converting lead, credit the referrer
    const wasConverted = currentLead.status !== "converted" && status === "converted";

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status,
        notes,
        ...(wasConverted && { convertedAt: new Date() }),
      },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            walletBalance: true,
          },
        },
        promotion: true,
      },
    });

    // Credit the referrer if lead was converted
    if (wasConverted) {
      await prisma.user.update({
        where: { id: lead.referrerId },
        data: {
          walletBalance: {
            increment: lead.promotion.rewardAmount,
          },
        },
      });
    }

    // Send Telegram notification for status change (non-blocking)
    if (currentLead.status !== status) {
      notifyLeadStatusChanged({
        leadName: currentLead.name,
        referrerName: currentLead.referrer.name,
        oldStatus: currentLead.status,
        newStatus: status,
        promotionName: lead.promotion.name,
      });
    }

    return NextResponse.json({
      lead,
      credited: wasConverted,
      creditedAmount: wasConverted ? lead.promotion.rewardAmount : 0,
    });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has sales team or admin role
    const allowedRoles = ["admin", "sales_agent", "sales_rep", "sales_manager"];
    if (!allowedRoles.includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lead deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
