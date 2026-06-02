import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";

export function findCompanyBillingPlanDefinition(
  plans: CompanyBillingPageTypes.BillingPlanDefinition[],
  key?: string | null,
): CompanyBillingPageTypes.BillingPlanDefinition | null {
  if (!key) return null;

  return plans.find((plan) => plan.key === key) || null;
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
