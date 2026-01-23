"use client";

import amplitude from "@/lib/amplitude";

// Predefined event names for consistency
export const AnalyticsEvents = {
  // Authentication
  SIGN_UP: "Sign Up",
  LOGIN: "Login",
  LOGOUT: "Logout",

  // Referral
  REFERRAL_LINK_COPIED: "Referral Link Copied",
  REFERRAL_LINK_SHARED: "Referral Link Shared",
  LEAD_FORM_STARTED: "Lead Form Started",
  LEAD_FORM_SUBMITTED: "Lead Form Submitted",
  LEAD_FORM_ERROR: "Lead Form Error",

  // Promotions
  PROMOTION_VIEWED: "Promotion Viewed",
  PROMOTION_CREATED: "Promotion Created",
  PROMOTION_UPDATED: "Promotion Updated",

  // Leads Management
  LEAD_STATUS_CHANGED: "Lead Status Changed",
  LEAD_CONTACTED: "Lead Contacted",
  LEAD_CONVERTED: "Lead Converted",

  // Navigation
  PAGE_VIEWED: "Page Viewed",
  DASHBOARD_VIEWED: "Dashboard Viewed",

  // Errors
  ERROR_OCCURRED: "Error Occurred",
} as const;

type EventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Track an analytics event with optional properties
 */
export function trackEvent(
  eventName: EventName | string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  try {
    amplitude.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

/**
 * Identify a user for analytics tracking
 */
export function identifyUser(
  userId: string,
  userProperties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  try {
    amplitude.setUserId(userId);
    if (userProperties) {
      const identify = new amplitude.Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identify.set(key, value as string | number | boolean);
      });
      amplitude.identify(identify);
    }
  } catch (error) {
    console.error("Failed to identify user:", error);
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetUser() {
  if (typeof window === "undefined") return;

  try {
    amplitude.reset();
  } catch (error) {
    console.error("Failed to reset user:", error);
  }
}

/**
 * Custom hook for analytics with common tracking methods
 */
export function useAnalytics() {
  return {
    track: trackEvent,
    identify: identifyUser,
    reset: resetUser,
    events: AnalyticsEvents,
  };
}

export default useAnalytics;
