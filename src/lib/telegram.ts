/**
 * Telegram Notification Service
 * Sends notifications to a Telegram chat/group for important events
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface SendMessageOptions {
  parse_mode?: "MarkdownV2" | "HTML";
  disable_notification?: boolean;
}

/**
 * Escapes special characters for Telegram MarkdownV2 format
 */
function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

/**
 * Sends a message to the configured Telegram chat
 * Non-blocking - errors are logged but don't throw
 */
async function sendMessage(
  text: string,
  options: SendMessageOptions = { parse_mode: "MarkdownV2" }
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram credentials not configured. Skipping notification.");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot2113199011:${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          ...options,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    return false;
  }
}

/**
 * Formats and sends notification for new account registration
 */
export async function notifyAccountCreated(data: {
  name: string;
  email: string;
  phone?: string | null;
  referralCode: string;
  role: string;
}): Promise<boolean> {
  const name = escapeMarkdownV2(data.name);
  const email = escapeMarkdownV2(data.email);
  const phone = data.phone ? escapeMarkdownV2(data.phone) : "Non fourni";
  const referralCode = escapeMarkdownV2(data.referralCode);
  const role = escapeMarkdownV2(data.role);

  const message = `
🎉 *Nouveau Compte Créé*

👤 *Nom:* ${name}
📧 *Email:* ${email}
📱 *Téléphone:* ${phone}
🔗 *Code Parrainage:* \`${referralCode}\`
🏷️ *Rôle:* ${role}

⏰ ${escapeMarkdownV2(new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" }))}
`.trim();

  return sendMessage(message);
}

/**
 * Formats and sends notification for new referral/lead
 */
export async function notifyReferralMade(data: {
  leadName: string;
  leadPhone: string;
  leadEmail?: string | null;
  referrerName: string;
  referrerCode: string;
  promotionName: string;
  discountPercent: number;
}): Promise<boolean> {
  const leadName = escapeMarkdownV2(data.leadName);
  const leadPhone = escapeMarkdownV2(data.leadPhone);
  const leadEmail = data.leadEmail ? escapeMarkdownV2(data.leadEmail) : "Non fourni";
  const referrerName = escapeMarkdownV2(data.referrerName);
  const referrerCode = escapeMarkdownV2(data.referrerCode);
  const promotionName = escapeMarkdownV2(data.promotionName);

  const message = `
🔥 *Nouveau Parrainage\\!*

📋 *Lead:*
  • Nom: ${leadName}
  • Téléphone: ${leadPhone}
  • Email: ${leadEmail}

👑 *Parrainé par:*
  • ${referrerName} \\(\`${referrerCode}\`\\)

🎁 *Promotion:* ${promotionName}
💰 *Réduction:* ${data.discountPercent}%

⏰ ${escapeMarkdownV2(new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" }))}
`.trim();

  return sendMessage(message);
}

/**
 * Formats and sends notification for lead status update
 */
export async function notifyLeadStatusChanged(data: {
  leadName: string;
  referrerName: string;
  oldStatus: string;
  newStatus: string;
  promotionName: string;
}): Promise<boolean> {
  const leadName = escapeMarkdownV2(data.leadName);
  const referrerName = escapeMarkdownV2(data.referrerName);
  const oldStatus = escapeMarkdownV2(data.oldStatus);
  const newStatus = escapeMarkdownV2(data.newStatus);
  const promotionName = escapeMarkdownV2(data.promotionName);

  const statusEmoji = data.newStatus === "converted" ? "✅" :
                      data.newStatus === "contacted" ? "📞" :
                      data.newStatus === "cancelled" ? "❌" : "🔄";

  const message = `
${statusEmoji} *Statut Lead Mis à Jour*

👤 *Lead:* ${leadName}
👑 *Parrain:* ${referrerName}
🎁 *Promotion:* ${promotionName}

📊 *Statut:* ${oldStatus} ➡️ ${newStatus}

⏰ ${escapeMarkdownV2(new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" }))}
`.trim();

  return sendMessage(message);
}

export const TelegramService = {
  sendMessage,
  notifyAccountCreated,
  notifyReferralMade,
  notifyLeadStatusChanged,
  escapeMarkdownV2,
};
