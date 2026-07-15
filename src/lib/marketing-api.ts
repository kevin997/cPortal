// Typed client-side helpers for the Marketing Automation UI.
// All requests go through /api/marketing/* (src/app/api/marketing/[...path]/route.ts),
// which forwards to the external Automations FastAPI service with the service token.
// The token itself never reaches this file / the browser.

export type JourneyStage =
  | "new"
  | "contacted"
  | "nurturing"
  | "opportunity"
  | "customer"
  | "lost";

export const JOURNEY_STAGES: JourneyStage[] = [
  "new",
  "contacted",
  "nurturing",
  "opportunity",
  "customer",
  "lost",
];

export const STAGE_LABELS: Record<JourneyStage, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  nurturing: "En relance",
  opportunity: "Opportunité",
  customer: "Client",
  lost: "Perdu",
};

export const STAGE_BADGE_CLASSNAMES: Record<JourneyStage, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-200",
  contacted: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  nurturing: "bg-orange-500/10 text-orange-600 border-orange-200",
  opportunity: "bg-purple-500/10 text-purple-600 border-purple-200",
  customer: "bg-green-500/10 text-green-600 border-green-200",
  lost: "bg-gray-500/10 text-gray-600 border-gray-200",
};

export interface Lead {
  id: string;
  name: string;
  phone_raw: string;
  phone_normalized: string | null;
  email: string | null;
  company: string | null;
  country: string | null;
  city: string | null;
  product_interest: string | null;
  source_sheet: string | null;
  stage: JourneyStage;
  stage_updated_at: string | null;
  value_fcfa: number | null;
  next_followup_at: string | null;
  last_contacted_at: string | null;
  opt_out: boolean;
  created_at: string;
}

export interface LeadEvent {
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface LeadDetail extends Lead {
  events: LeadEvent[];
}

export interface LeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  per_page: number;
}

export interface LeadsQuery {
  stage?: string;
  product?: string;
  country?: string;
  source?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface JourneySummary {
  stages: { stage: JourneyStage; count: number }[];
  by_product: { name: string; count: number }[];
  by_source: { name: string; count: number }[];
  by_country: { name: string; count: number }[];
  added_last_30d: { date: string; count: number }[];
  totals: {
    leads: number;
    customers: number;
    opportunities: number;
    conversion_rate: number;
  };
}

export interface ImportSheetReport {
  sheet: string;
  status: "imported" | "skipped";
  reason?: string;
  mapping?: Record<string, string>;
  ai_assisted?: boolean;
  rows_total?: number;
  created?: number;
  updated?: number;
  skipped_rows?: number;
}

export interface ImportResult {
  batch_id: string;
  dry_run: boolean;
  sheets: ImportSheetReport[];
  totals: {
    sheets_imported: number;
    sheets_skipped: number;
    leads_created: number;
    leads_updated: number;
    rows_skipped: number;
  };
}

export interface ImportBatch {
  batch_id: string;
  dry_run: boolean;
  created_at: string;
  totals: ImportResult["totals"];
}

export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "done";

export interface CampaignAudience {
  stages: JourneyStage[];
  products: string[];
  countries: string[];
  sources: string[];
  inactive_days: number | null;
}

export interface Campaign {
  id: string;
  name: string;
  message_fr: string;
  message_en: string | null;
  audience: CampaignAudience;
  status: CampaignStatus;
  scheduled_at: string | null;
  stats: {
    sent: number;
    failed: number;
    skipped: number;
  };
  created_at: string;
}

export interface CampaignPreview {
  audience_count: number;
  sample: { name: string; phone_masked: string }[];
}

export interface CampaignSend {
  id: string;
  lead_id: string;
  status: string;
  created_at: string;
}

export interface CampaignSendsResponse {
  items: CampaignSend[];
  total: number;
  page: number;
  per_page: number;
}

async function marketingFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/marketing/${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Une erreur est survenue");
  }

  return data as T;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

// Imports
export async function getImportBatches(): Promise<ImportBatch[]> {
  return marketingFetch<ImportBatch[]>("imports");
}

export async function importLeadsFile(
  file: File,
  dryRun: boolean
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("dry_run", String(dryRun));
  return marketingFetch<ImportResult>("imports", {
    method: "POST",
    body: formData,
  });
}

// Leads
export async function getLeads(query: LeadsQuery): Promise<LeadsResponse> {
  const qs = buildQuery({
    stage: query.stage,
    product: query.product,
    country: query.country,
    source: query.source,
    q: query.q,
    page: query.page,
    per_page: query.per_page,
  });
  return marketingFetch<LeadsResponse>(`leads${qs}`);
}

export async function getLead(id: string): Promise<LeadDetail> {
  return marketingFetch<LeadDetail>(`leads/${id}`);
}

export async function updateLead(
  id: string,
  data: { stage?: JourneyStage; notes?: string; opt_out?: boolean }
): Promise<Lead> {
  return marketingFetch<Lead>(`leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Journey
export async function getJourneySummary(params: {
  product?: string;
  country?: string;
}): Promise<JourneySummary> {
  const qs = buildQuery({ product: params.product, country: params.country });
  return marketingFetch<JourneySummary>(`journey/summary${qs}`);
}

// Campaigns
export async function getCampaigns(): Promise<Campaign[]> {
  return marketingFetch<Campaign[]>("campaigns");
}

export async function getCampaign(id: string): Promise<Campaign> {
  return marketingFetch<Campaign>(`campaigns/${id}`);
}

export interface CreateCampaignInput {
  name: string;
  message_fr: string;
  message_en?: string;
  audience: CampaignAudience;
  scheduled_at?: string | null;
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<Campaign> {
  return marketingFetch<Campaign>("campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function previewCampaign(id: string): Promise<CampaignPreview> {
  return marketingFetch<CampaignPreview>(`campaigns/${id}/preview`, {
    method: "POST",
  });
}

export async function sendCampaignNow(id: string): Promise<Campaign> {
  return marketingFetch<Campaign>(`campaigns/${id}/send-now`, {
    method: "POST",
  });
}

export async function pauseCampaign(id: string): Promise<Campaign> {
  return marketingFetch<Campaign>(`campaigns/${id}/pause`, {
    method: "POST",
  });
}

export async function getCampaignSends(
  id: string,
  params: { status?: string; page?: number }
): Promise<CampaignSendsResponse> {
  const qs = buildQuery({ status: params.status, page: params.page });
  return marketingFetch<CampaignSendsResponse>(`campaigns/${id}/sends${qs}`);
}
