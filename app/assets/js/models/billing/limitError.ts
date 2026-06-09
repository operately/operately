import type * as api from "@/api";

type BillingInterval = api.BillingInterval;
type BillingPlanKey = string;
type CurrentSelfServeBillingPlan = "team" | "business" | "unlimited";

const CURRENT_SELF_SERVE_BILLING_PLANS = ["team", "business", "unlimited"] as const;

type BillingUpgradeRecommendationSource = "suggested" | "next_plan" | "none";

interface BillingUpgradeRecommendationTarget {
  plan: BillingPlanKey;
  billingInterval: BillingInterval;
  product: null;
}

interface BillingUpgradeRecommendation {
  target: {
    plan: CurrentSelfServeBillingPlan;
    billingInterval: BillingInterval;
    product: null;
  } | null;
  rawTarget: BillingUpgradeRecommendationTarget | null;
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

    if (typeof plan === "string" && isBillingInterval(interval)) {
      const rawTarget: BillingUpgradeRecommendationTarget = {
        plan,
        billingInterval: interval,
        product: null,
      };

      return {
        target: isCurrentSelfServeBillingPlan(plan)
          ? {
              plan,
              billingInterval: interval,
              product: null,
            }
          : null,
        rawTarget,
        source: normalizeUpgradeRecommendationSource((raw as any).source),
      };
    }
  }

  return { target: null, rawTarget: null, source: "none" };
}

function normalizeUpgradeRecommendationSource(source: unknown): BillingUpgradeRecommendationSource {
  if (source === "suggested" || source === "next_plan") {
    return source;
  }

  return "none";
}

function isCurrentSelfServeBillingPlan(value: string): value is CurrentSelfServeBillingPlan {
  return CURRENT_SELF_SERVE_BILLING_PLANS.includes(value as CurrentSelfServeBillingPlan);
}

function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}
