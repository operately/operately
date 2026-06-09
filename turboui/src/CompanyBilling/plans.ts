import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";

export function normalizeCompanyBillingPlanKey(key?: string | null): string | null {
  if (typeof key !== "string") return null;

  const normalized = key.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function findCompanyBillingPlanDefinition(
  plans: CompanyBillingPageTypes.BillingPlanDefinition[],
  key?: string | null,
): CompanyBillingPageTypes.BillingPlanDefinition | null {
  const normalizedKey = normalizeCompanyBillingPlanKey(key);
  if (!normalizedKey) return null;

  return plans.find((plan) => plan.key === normalizedKey) || null;
}

export function getCompanyBillingCurrentPlanDefinition(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingPlanDefinition | null {
  if (billing.account.planKey) {
    return findCompanyBillingPlanDefinition(billing.plans, billing.account.planKey);
  }

  if (billing.account.status === "free") {
    return findCompanyBillingPlanDefinition(billing.plans, "free");
  }

  return null;
}

export function compareCompanyBillingPlanDefinitions(
  left: CompanyBillingPageTypes.BillingPlanDefinition,
  right: CompanyBillingPageTypes.BillingPlanDefinition,
): number {
  return left.tierRank - right.tierRank || left.key.localeCompare(right.key);
}

export function listCompanyBillingSellablePlanDefinitions(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingPlanDefinition[] {
  const sellablePlanKeys = new Set(
    billing.catalogProducts
      .filter((product) => product.active)
      .map((product) => normalizeCompanyBillingPlanKey(product.planFamily))
      .filter((key): key is string => key !== null),
  );

  return billing.plans
    .filter((plan) => plan.customerSelectable && sellablePlanKeys.has(plan.key))
    .sort(compareCompanyBillingPlanDefinitions);
}
