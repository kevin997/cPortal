import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { botToken, chatId, message } = body;

    if (!botToken || !chatId || !message) {
      return NextResponse.json(
        { error: "botToken, chatId, and message are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Telegram API error:", error);
      return NextResponse.json(
        { error: error.description || "Failed to send Telegram message" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending caisse Telegram report:", error);
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
