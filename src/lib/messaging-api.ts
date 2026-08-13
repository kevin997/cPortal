// Typed client-side helpers for native Wachap messaging through CSL Automations.

export type MessageChannel = "sms" | "whatsapp";

export const MESSAGE_CHANNELS: { value: MessageChannel; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
];

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
  optedOut: number;
}

export interface SendBulkRequest {
  channel: MessageChannel;
  message: string;
  numbers?: string[];
  listId?: string;
}

export interface SendBulkResult {
  campaignId: string;
  queued: number;
  skipped: number;
  total: number;
}

async function messagingFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/marketing/messaging/${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || data?.detail || "Une erreur est survenue");
  return data as T;
}

export function sendBulkMessage(payload: SendBulkRequest): Promise<SendBulkResult> {
  return messagingFetch("messages", { method: "POST", body: JSON.stringify(payload) });
}

export function parseNumbers(raw: string): string[] {
  return raw.split(/[\n,;]+/).map((number) => number.trim()).filter((number) => number.length >= 6);
}

export function parseContactLines(raw: string): ListContact[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [phone, ...rest] = line.split(/[,;]/);
      return { phone: phone.trim(), name: rest.join(" ").trim() || DEFAULT_CONTACT_NAME };
    })
    .filter((contact) => contact.phone.length >= 6);
}

export async function getLists(): Promise<ContactList[]> {
  return (await messagingFetch<{ lists: ContactList[] }>("lists")).lists;
}

export async function createList(name: string): Promise<ContactList> {
  return (await messagingFetch<{ list: ContactList }>("lists", {
    method: "POST",
    body: JSON.stringify({ name }),
  })).list;
}

export function addContactsToList(
  listId: string,
  contacts: ListContact[]
): Promise<AddContactsResult> {
  return messagingFetch(`lists/${listId}/contacts`, {
    method: "POST",
    body: JSON.stringify({ contacts }),
  });
}

export interface WachapLabel { id?: string; labelId?: string; name: string; color?: number }
export interface WachapSyncResult { created: number; merged: number; skipped: number; total: number }

export function getWachapLabels(): Promise<{ labels: WachapLabel[]; available: boolean; reason?: string }> {
  return messagingFetch("wachap/labels");
}

export function syncWachapContacts(): Promise<WachapSyncResult> {
  return messagingFetch("wachap/sync", { method: "POST" });
}
