import type { BillingInterval } from "@/api";

const CURRENT_SELF_SERVE_BILLING_PLANS = ["team", "business", "unlimited"] as const;
const BILLING_INTERVALS: BillingInterval[] = ["monthly", "yearly"];

export type CurrentSelfServeBillingPlan = (typeof CURRENT_SELF_SERVE_BILLING_PLANS)[number];

export function parseCurrentSelfServeBillingPlan(value: string | null): CurrentSelfServeBillingPlan | undefined {
  return CURRENT_SELF_SERVE_BILLING_PLANS.find((plan) => plan === value);
}

export function parseBillingInterval(value: string | null): BillingInterval | undefined {
  return BILLING_INTERVALS.find((billingInterval) => billingInterval === value);
}
