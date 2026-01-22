import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET referrer stats for dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.id;

    // Get user with wallet balance and referral code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        walletBalance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get total leads count
    const totalLeads = await prisma.lead.count({
      where: { referrerId: userId },
    });

    // Get leads by status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: { referrerId: userId },
      _count: {
        status: true,
      },
    });

    // Get converted leads for potential earnings calculation
    const convertedLeads = await prisma.lead.findMany({
      where: {
        referrerId: userId,
        status: "converted",
      },
      include: {
        promotion: {
          select: {
            rewardAmount: true,
          },
        },
      },
    });

    // Calculate total potential earnings from converted leads
    const potentialEarnings = convertedLeads.reduce(
      (sum, lead) => sum + lead.promotion.rewardAmount,
      0
    );

    // Get recent leads
    const recentLeads = await prisma.lead.findMany({
      where: { referrerId: userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        promotion: {
          select: {
            name: true,
            rewardAmount: true,
          },
        },
      },
    });

    // Format leads by status
    const statusCounts = {
      pending: 0,
      contacted: 0,
      converted: 0,
      lost: 0,
    };

    leadsByStatus.forEach((item) => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count.status;
    });

    return NextResponse.json({
      referralCode: user.referralCode,
      walletBalance: user.walletBalance,
      totalLeads,
      statusCounts,
      potentialEarnings,
      recentLeads: recentLeads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        status: lead.status,
        promotionName: lead.promotion.name,
        rewardAmount: lead.promotion.rewardAmount,
        createdAt: lead.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching referrer stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
