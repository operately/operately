import type * as api from "@/api";

type BillingPlan = api.BillingPlan;
type BillingInterval = api.BillingInterval;

type BillingUpgradeRecommendationSource = "suggested" | "next_plan" | "none";

interface BillingUpgradeRecommendation {
  target: {
    plan: BillingPlan;
    billingInterval: BillingInterval;
    product: null;
  } | null;
  source: BillingUpgradeRecommendationSource;
}

export interface BillingLimitError {
  code: string;
  limitKey: string;
  planKey: string | null;
  currentUsage: number;
  requestedDelta: number;
  projectedUsage: number;
  limit: number | null;
  remaining: number | null;
  nearLimit: boolean;
  blocked: boolean;
  enforced: boolean;
  recommendedUpgrade: BillingUpgradeRecommendation;
}

export function extractLimitError(error: unknown): BillingLimitError | null {
  return extractLimitErrorDetails((error as any)?.response?.data?.details);
}

export function extractLimitErrorDetails(details: unknown): BillingLimitError | null {
  if (!details || typeof details !== "object") {
    return null;
  }

  const data = details as Record<string, unknown>;
  const recommendedUpgrade = extractRecommendedUpgrade(data.recommended_upgrade);

  return {
    code: typeof data.code === "string" ? data.code : "unknown_limit_error",
    limitKey: typeof data.limit_key === "string" ? data.limit_key : "unknown",
    planKey: typeof data.plan_key === "string" ? data.plan_key : null,
    currentUsage: typeof data.current_usage === "number" ? data.current_usage : 0,
    requestedDelta: typeof data.requested_delta === "number" ? data.requested_delta : 0,
    projectedUsage: typeof data.projected_usage === "number" ? data.projected_usage : 0,
    limit: typeof data.limit === "number" ? data.limit : null,
    remaining: typeof data.remaining === "number" ? data.remaining : null,
    nearLimit: data.near_limit === true,
    blocked: data.blocked === true,
    enforced: data.enforced === true,
    recommendedUpgrade,
  };
}

function extractRecommendedUpgrade(raw: unknown): BillingUpgradeRecommendation {
  if (raw && typeof raw === "object") {
    const plan = (raw as any).plan_key;
    const interval = (raw as any).billing_interval;

    if (isBillingPlan(plan) && isBillingInterval(interval)) {
      return {
        target: {
          plan,
          billingInterval: interval,
          product: null,
        },
        source: normalizeUpgradeRecommendationSource((raw as any).source),
      };
    }
  }

  return { target: null, source: "none" };
}

function normalizeUpgradeRecommendationSource(source: unknown): BillingUpgradeRecommendationSource {
  if (source === "suggested" || source === "next_plan") {
    return source;
  }

  return "none";
}

function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "free" || value === "team" || value === "business" || value === "unlimited";
}

function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}
