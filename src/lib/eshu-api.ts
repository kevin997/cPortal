// Typed client-side helpers for bulk messaging via Eshu.
// All requests go through /api/eshu/* (src/app/api/eshu/[...path]/route.ts),
// which forwards to the Eshu platform with the tenant API key.
// The key itself never reaches this file / the browser.

export type MessageChannel = "sms" | "whatsapp";

export const MESSAGE_CHANNELS: { value: MessageChannel; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
];

/** Fallback name for contacts added without one. */
export const DEFAULT_CONTACT_NAME = "partenaire";

export interface ContactList {
  id: string;
  name: string;
  count: number;
  created_at: string;
}

export interface ListContact {
  phone: string;
  name?: string | null;
}

export interface AddContactsResult {
  added: number;
  duplicates: number;
  /** Skipped because the contact previously opted out. */
  optedOut: number;
}

export interface SendBulkRequest {
  channel: MessageChannel;
  message: string;
  /** Raw numbers; Eshu normalizes them to E.164 (Cameroon-first). */
  numbers?: string[];
  /** Send to every opted-in member of a list instead of explicit numbers. */
  listId?: string;
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

/**
 * Parse free-form contact lines into {phone, name} pairs. Each line is either
 * a bare number or "number, name" — the name is optional and falls back to a
 * neutral placeholder.
 */
export function parseContactLines(raw: string): ListContact[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [phone, ...rest] = line.split(/[,;]/);
      const name = rest.join(" ").trim();
      return {
        phone: phone.trim(),
        name: name || DEFAULT_CONTACT_NAME,
      };
    })
    .filter((c) => c.phone.length >= 6);
}

export async function getLists(): Promise<ContactList[]> {
  const { lists } = await eshuFetch<{ lists: ContactList[] }>("lists");
  return lists;
}

export async function createList(name: string): Promise<ContactList> {
  const { list } = await eshuFetch<{ list: ContactList }>("lists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return list;
}

export async function addContactsToList(
  listId: string,
  contacts: ListContact[]
): Promise<AddContactsResult> {
  return eshuFetch<AddContactsResult>(`lists/${listId}/contacts`, {
    method: "POST",
    body: JSON.stringify({ contacts }),
  });
}
