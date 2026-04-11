import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/access";
import { getCreativeDeliverableStatusLabel } from "@/lib/content";

function fmtDate(date: Date) {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Douala",
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const hours = body.hours === 24 ? 24 : 48;

    const settings = await prisma.cashSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings?.telegramBotToken || !settings.telegramChatId) {
      return NextResponse.json(
        { error: "Configure Telegram credentials in Caisse settings first" },
        { status: 400 }
      );
    }

    const now = new Date();
    const until = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const deliverables = await prisma.creativeDeliverable.findMany({
      where: {
        scheduledFor: {
          gte: now,
          lte: until,
        },
        status: {
          in: ["planned", "in_progress", "delivered"],
        },
      },
      include: {
        request: {
          select: {
            reference: true,
            clientName: true,
            contentType: true,
          },
        },
        owner: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ scheduledFor: "asc" }],
    });

    const lines = [
      `Rapport creatives a venir - prochaines ${hours}h`,
      `Periode: ${fmtDate(now)} -> ${fmtDate(until)}`,
      "",
    ];

    if (deliverables.length === 0) {
      lines.push("Aucun creatif planifie sur cette fenetre.");
    } else {
      for (const item of deliverables) {
        lines.push(
          [
            `- ${item.title}`,
            `  Ref: ${item.request.reference}`,
            `  Client: ${item.request.clientName || "Interne"}`,
            `  Type: ${item.request.contentType}`,
            `  Date: ${fmtDate(item.scheduledFor)}`,
            `  Responsable: ${item.owner?.name || "Non assigne"}`,
            `  Statut: ${getCreativeDeliverableStatusLabel(item.status)}`,
          ].join("\n")
        );
      }
    }

    const response = await fetch(
      `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: lines.join("\n"),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.description || "Failed to send Telegram message" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      count: deliverables.length,
      hours,
    });
  } catch (error) {
    console.error("Error sending creative Telegram report:", error);
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
