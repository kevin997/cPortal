// Typed client-side helpers for bulk messaging via Eshu.
// All requests go through /api/eshu/* (src/app/api/eshu/[...path]/route.ts),
// which forwards to the Eshu platform with the tenant API key.
// The key itself never reaches this file / the browser.

export type MessageChannel = "sms" | "whatsapp";

export const MESSAGE_CHANNELS: { value: MessageChannel; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
];

export interface SendBulkRequest {
  channel: MessageChannel;
  message: string;
  /** Raw numbers; Eshu normalizes them to E.164 (Cameroon-first). */
  numbers: string[];
}

export interface SendBulkResult {
  campaignId: string;
  /** Accepted for sending after quota and anti-ban caps. */
  queued: number;
  /** Dropped by those caps — retry later to send the remainder. */
  skipped: number;
  total: number;
}

async function eshuFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/eshu/${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Une erreur est survenue");
  }

  return data as T;
}

/** Queue a bulk SMS or WhatsApp send. Delivery happens asynchronously. */
export async function sendBulkMessage(
  payload: SendBulkRequest
): Promise<SendBulkResult> {
  return eshuFetch<SendBulkResult>("messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Split a free-form textarea of numbers (newline, comma or semicolon separated)
 * into a clean list.
 */
export function parseNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((n) => n.trim())
    .filter((n) => n.length >= 6);
}
