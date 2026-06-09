import type { BillingCatalogProduct, BillingInterval, BillingPlanDefinition } from "@/api";
import { normalizeCompanyBillingPlanKey } from "turboui";

const BILLING_INTERVALS: BillingInterval[] = ["monthly", "yearly"];

export interface BillingCatalog {
  plans: BillingPlanDefinition[];
  catalogProducts: BillingCatalogProduct[];
}

interface BillingIntent {
  plan?: string;
  billingPeriod?: BillingInterval;
}

export function parseBillingIntent(search: string, billingCatalog: BillingCatalog): BillingIntent {
  const params = new URLSearchParams(search);
  const plan = normalizeCompanyBillingPlanKey(params.get("plan"));
  const billingPeriod = parseBillingInterval(params.get("billing_period"));

  if (!plan || !billingPeriod) {
    return {};
  }

  if (!hasSellableBillingIntent(billingCatalog, plan, billingPeriod)) {
    return {};
  }

  return { plan, billingPeriod };
}

export function parseBillingInterval(value: string | null): BillingInterval | undefined {
  return BILLING_INTERVALS.find((billingInterval) => billingInterval === value);
}

export function hasSellableBillingIntent(
  billingCatalog: BillingCatalog,
  plan: string,
  billingInterval: BillingInterval,
): boolean {
  const planDefinition = billingCatalog.plans.find(
    (definition) => definition.key === plan && definition.customerSelectable,
  );

  if (!planDefinition) return false;

  return billingCatalog.catalogProducts.some(
    (product) => product.active && product.planFamily === plan && product.billingInterval === billingInterval,
  );
}
