import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TelegramService } from "@/lib/telegram";

function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "referrer") {
    return NextResponse.json({ error: "2FA not required for referrers" }, { status: 400 });
  }

  const code = generate2FACode();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorCode: code,
      twoFactorExpiry: expiry,
      twoFactorAttempts: 0,
      twoFactorVerifiedAt: null,
    },
  });

  const escapedName = TelegramService.escapeMarkdownV2(session.user.name);
  const escapedCode = TelegramService.escapeMarkdownV2(code);
  const message = `🔐 *2FA Login Code \\(resend\\)*\n\n👤 *User:* ${escapedName}\n🔑 *Code:* \`${escapedCode}\`\n\n⏰ Expires in 5 minutes`;

  await TelegramService.sendMessage(message);

  return NextResponse.json({ success: true });
}
