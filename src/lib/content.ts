export const CREATIVE_REQUEST_STATUSES = [
  { value: "brief_received", label: "Fiche recue" },
  { value: "brief_verified", label: "Brief verifie" },
  { value: "production_started", label: "Production lancee" },
  { value: "version_1_delivered", label: "Version 1 livree" },
  { value: "changes_requested", label: "Corrections demandees" },
  { value: "internal_validation", label: "Validation interne" },
  { value: "client_validation", label: "Validation client" },
  { value: "final_approved", label: "Version finale validee" },
  { value: "published", label: "Publication effectuee" },
  { value: "archived", label: "Archivage effectue" },
] as const;

export const CREATIVE_URGENCY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
  { value: "overdue", label: "Hors delai" },
] as const;

export const CREATIVE_VALIDATION_OPTIONS = [
  { value: "internal_only", label: "Interne uniquement" },
  { value: "client_internal", label: "Client + Interne" },
] as const;

export const CREATIVE_DELIVERABLE_STATUSES = [
  { value: "planned", label: "Planifie" },
  { value: "in_progress", label: "En cours" },
  { value: "delivered", label: "Livre" },
  { value: "published", label: "Publie" },
] as const;

export const COLLABORATOR_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "creative_director", label: "Directeur Creatif" },
  { value: "social_media_manager", label: "Social Media Manager" },
  { value: "collaborator", label: "Collaborateur" },
] as const;

export const SOCIAL_MEDIA_PLAN_STATUSES = [
  { value: "planned", label: "Planifie" },
  { value: "in_review", label: "En relecture" },
  { value: "approved", label: "Approuve" },
  { value: "published", label: "Publie" },
  { value: "archived", label: "Archive" },
] as const;

export function getCreativeRequestStatusLabel(value: string) {
  return CREATIVE_REQUEST_STATUSES.find((item) => item.value === value)?.label ?? value;
}

export function getCreativeDeliverableStatusLabel(value: string) {
  return CREATIVE_DELIVERABLE_STATUSES.find((item) => item.value === value)?.label ?? value;
}

export function getCollaboratorRoleLabel(value: string) {
  return COLLABORATOR_ROLE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function getSocialMediaPlanStatusLabel(value: string) {
  return SOCIAL_MEDIA_PLAN_STATUSES.find((item) => item.value === value)?.label ?? value;
}
