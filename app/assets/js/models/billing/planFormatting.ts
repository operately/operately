const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  team: "Team",
  business: "Business",
};

export function formatPlanName(planKey?: string | null, fallback = "Unknown plan"): string {
  if (!planKey) return fallback;

  return PLAN_NAMES[planKey] || fallback;
}

function formatIntervalLabel(interval?: string | null): string | null {
  if (!interval) return null;

  return interval === "monthly" ? "Monthly" : interval === "yearly" ? "Yearly" : null;
}

export function formatPlanLabel(planKey?: string | null, interval?: string | null, fallback = "Unknown plan"): string {
  const name = formatPlanName(planKey, fallback);
  const intervalLabel = formatIntervalLabel(interval);

  return intervalLabel ? `${name} ${intervalLabel}` : name;
}
