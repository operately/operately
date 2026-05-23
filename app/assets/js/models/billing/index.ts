import Api from "@/api";
import * as api from "@/api";

export type BillingAccount = api.BillingAccount;
export type BillingInterval = api.BillingInterval;
export type BillingOverview = api.BillingOverview;
export type BillingPlanDefinition = api.BillingPlanDefinition;
export type BillingStatus = api.BillingStatus;

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  team: "Team",
  business: "Business",
};

const STATUS_LABELS: Record<BillingStatus, string> = {
  free: "Free",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
};

const SUGGESTED_PLAN_SOURCE_LABELS: Record<string, string> = {
  website: "Selected on the website",
};

export async function getBilling(input: api.BillingGetInput = {}): Promise<BillingOverview> {
  return Api.billing.get(input).then((data) => data.billing);
}

export async function refreshBilling(input: api.BillingRefreshInput = {}): Promise<BillingOverview> {
  return Api.billing.refresh(input).then((data) => data.billing);
}

export function findPlanDefinition(plans: BillingPlanDefinition[], key?: string | null): BillingPlanDefinition | null {
  if (!key) return null;

  return plans.find((plan) => plan.key === key) || null;
}

export function getCurrentPlanDefinition(billing: BillingOverview): BillingPlanDefinition | null {
  if (billing.account.planKey) {
    return findPlanDefinition(billing.plans, billing.account.planKey);
  }

  if (billing.account.status === "free") {
    return findPlanDefinition(billing.plans, "free");
  }

  return null;
}

export function formatPlanName(planKey?: string | null, fallback = "Unknown plan"): string {
  if (!planKey) return fallback;

  return PLAN_NAMES[planKey] || fallback;
}

export function formatIntervalLabel(interval?: BillingInterval | null): string | null {
  if (!interval) return null;

  return interval === "monthly" ? "Monthly" : "Yearly";
}

export function formatPlanLabel(planKey?: string | null, interval?: BillingInterval | null, fallback = "Unknown plan"): string {
  const name = formatPlanName(planKey, fallback);
  const intervalLabel = formatIntervalLabel(interval);

  return intervalLabel ? `${name} ${intervalLabel}` : name;
}

export function formatStatusLabel(status: BillingStatus): string {
  return STATUS_LABELS[status] || "Unknown";
}

export function formatSuggestedPlanSource(source?: string | null): string | null {
  if (!source) return null;

  const knownSource = SUGGESTED_PLAN_SOURCE_LABELS[source];
  if (knownSource) {
    return knownSource;
  }

  return source
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
