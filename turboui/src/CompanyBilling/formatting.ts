import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  team: "Team",
  business: "Business",
};

export function formatCompanyBillingPlanName(planKey?: string | null, fallback = "Unknown plan"): string {
  if (!planKey) return fallback;

  return PLAN_NAMES[planKey] || fallback;
}

export function formatCompanyBillingIntervalLabel(interval?: CompanyBillingPageTypes.Interval | string | null): string | null {
  if (!interval) return null;

  return interval === "monthly" ? "Monthly" : interval === "yearly" ? "Yearly" : null;
}

export function formatCompanyBillingPlanLabel(
  planKey?: string | null,
  interval?: CompanyBillingPageTypes.Interval | string | null,
  fallback = "Unknown plan",
): string {
  const name = formatCompanyBillingPlanName(planKey, fallback);
  const intervalLabel = formatCompanyBillingIntervalLabel(interval);

  return intervalLabel ? `${name} ${intervalLabel}` : name;
}

export function formatCompanyBillingDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function formatCompanyBillingRelativeDateLine(prefix: string, value?: string | null): string | null {
  const formattedDate = formatCompanyBillingDate(value);
  if (!formattedDate) return null;

  return `${prefix}: ${formattedDate}.`;
}

export function formatCompanyBillingPriceFromMinorUnits(amount?: number | null, currency?: string | null): string {
  if (amount == null || !currency) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
