export const ADMIN_ROLES = ["admin"] as const;

export const INTERNAL_ROLES = [
  "admin",
  "creative_director",
  "social_media_manager",
  "collaborator",
  "sales_agent",
  "sales_rep",
  "sales_manager",
] as const;

export const COLLABORATOR_ROLES = [
  "admin",
  "creative_director",
  "social_media_manager",
  "collaborator",
] as const;

export function isAdminRole(role?: string | null) {
  return role === "admin";
}

export function hasCaisseAccess(role?: string | null) {
  return isAdminRole(role);
}

export function hasContentCreationAccess(role?: string | null) {
  return !!role && role !== "referrer";
}

export function canManageCollaborators(role?: string | null) {
  return isAdminRole(role);
}

export function canEditSocialMediaPlans(role?: string | null) {
  return role === "admin" || role === "social_media_manager" || role === "sales_manager";
}

export function canSelectSocialMediaPlansForRequests(role?: string | null) {
  return role === "admin" || role === "sales_manager";
}
