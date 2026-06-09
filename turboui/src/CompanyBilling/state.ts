import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";

export function parseCompanyBillingSearch(search: string): CompanyBillingPageTypes.BillingSearchParams {
  const params = new URLSearchParams(search);
  const rawPlan = params.get("plan");
  const rawBillingPeriod = params.get("billing_period");

  return {
    rawPlan,
    rawBillingPeriod,
    plan: isSelectableBillingPlan(rawPlan) ? rawPlan : null,
    billingInterval: isBillingInterval(rawBillingPeriod) ? rawBillingPeriod : null,
    checkoutId: params.get("checkout_id"),
    hasSelectionIntent: Boolean(rawPlan || rawBillingPeriod),
  };
}

export function listCompanyBillingSellableTargets(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget[] {
  return billing.catalogProducts
    .filter(isSelectableCatalogProduct)
    .sort((a, b) => compareTargets(a.planFamily, a.billingInterval, b.planFamily, b.billingInterval))
    .map((product) => ({
      plan: product.planFamily,
      billingInterval: product.billingInterval,
      product,
    }));
}

export function findCompanyBillingSellableProduct(
  catalogProducts: CompanyBillingPageTypes.BillingCatalogProduct[],
  plan: CompanyBillingPageTypes.Plan,
  billingInterval: CompanyBillingPageTypes.Interval,
): CompanyBillingPageTypes.BillingCatalogProduct | null {
  return (
    catalogProducts.find(
      (product) => product.active && product.planFamily === plan && product.billingInterval === billingInterval,
    ) || null
  );
}

export function getCompanyBillingPendingTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  if (!isSelectableBillingPlan(billing.account.pendingPlanKey) || !billing.account.pendingBillingInterval) {
    return null;
  }

  return {
    plan: billing.account.pendingPlanKey,
    billingInterval: billing.account.pendingBillingInterval,
    product: findCompanyBillingSellableProduct(
      billing.catalogProducts,
      billing.account.pendingPlanKey,
      billing.account.pendingBillingInterval,
    ),
  };
}

export function getCompanyBillingScheduledTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  if (!isSelectableBillingPlan(billing.account.scheduledPlanKey) || !billing.account.scheduledBillingInterval) {
    return null;
  }

  return {
    plan: billing.account.scheduledPlanKey,
    billingInterval: billing.account.scheduledBillingInterval,
    product: findCompanyBillingSellableProduct(
      billing.catalogProducts,
      billing.account.scheduledPlanKey,
      billing.account.scheduledBillingInterval,
    ),
  };
}

export function getCompanyBillingCurrentTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  if (!isSelectableBillingPlan(billing.account.planKey) || !billing.account.billingInterval) {
    return null;
  }

  return {
    plan: billing.account.planKey,
    billingInterval: billing.account.billingInterval,
    product: findCompanyBillingSellableProduct(
      billing.catalogProducts,
      billing.account.planKey,
      billing.account.billingInterval,
    ),
  };
}

export function getCompanyBillingSuggestedTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  if (!isSelectableBillingPlan(billing.account.suggestedPlanKey)) {
    return null;
  }

  return resolveRequestedTarget(listCompanyBillingSellableTargets(billing), {
    plan: billing.account.suggestedPlanKey,
    billingInterval: billing.account.suggestedBillingInterval || null,
  });
}

export function selectCompanyBillingTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
  search: CompanyBillingPageTypes.BillingSearchParams,
): CompanyBillingPageTypes.BillingTargetSelection {
  const sellableTargets = listCompanyBillingSellableTargets(billing);
  const queryTarget = resolveRequestedTarget(sellableTargets, search);
  const fallbackTarget = selectFallbackTarget(billing, sellableTargets);

  if (queryTarget) {
    return { target: queryTarget, source: "query", warning: null };
  }

  if (search.hasSelectionIntent) {
    return {
      target: fallbackTarget?.target || null,
      source: fallbackTarget?.source || null,
      warning: "The requested billing option is not currently available. Showing the closest available plan instead.",
    };
  }

  return {
    target: fallbackTarget?.target || null,
    source: fallbackTarget?.source || null,
    warning: null,
  };
}

export function canCreateCompanyBillingCheckout(status: CompanyBillingPageTypes.Status): boolean {
  return status === "free" || status === "canceled";
}

export function isCompanyBillingPaidStatus(status: CompanyBillingPageTypes.Status): boolean {
  return status === "active" || status === "past_due";
}

export function matchesCompanyBillingTarget(
  account: CompanyBillingPageTypes.BillingAccount,
  target: CompanyBillingPageTypes.BillingTarget | null,
): boolean {
  if (!target) return false;

  return account.planKey === target.plan && account.billingInterval === target.billingInterval;
}

export function isCompanyBillingCheckoutReturnSuccessful(
  billing: CompanyBillingPageTypes.BillingOverview,
  requestedTarget: CompanyBillingPageTypes.BillingTarget | null,
): boolean {
  if (!isCompanyBillingPaidStatus(billing.account.status)) {
    return false;
  }

  if (!billing.account.pendingPlanKey) {
    return true;
  }

  const expectedTarget = getCompanyBillingPendingTarget(billing) || requestedTarget;

  return matchesCompanyBillingTarget(billing.account, expectedTarget);
}

function selectFallbackTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
  sellableTargets: CompanyBillingPageTypes.BillingTarget[],
): { target: CompanyBillingPageTypes.BillingTarget; source: CompanyBillingPageTypes.BillingTargetSource } | null {
  const pendingTarget = getCompanyBillingPendingTarget(billing);
  if (pendingTarget?.product) {
    return { target: pendingTarget, source: "pending" };
  }

  if (isCompanyBillingPaidStatus(billing.account.status)) {
    const scheduledTarget = getCompanyBillingScheduledTarget(billing);
    if (scheduledTarget) {
      return { target: scheduledTarget, source: "scheduled" };
    }

    const currentTarget = getCompanyBillingCurrentTarget(billing);
    if (currentTarget) {
      return { target: currentTarget, source: "current" };
    }
  }

  if (billing.account.status === "free") {
    const suggestedTarget = getCompanyBillingSuggestedTarget(billing);
    if (suggestedTarget?.product) {
      return { target: suggestedTarget, source: "suggested" };
    }
  }

  const firstSellable = sellableTargets[0];
  if (!firstSellable) {
    return null;
  }

  return { target: firstSellable, source: "catalog" };
}

function resolveRequestedTarget(
  sellableTargets: CompanyBillingPageTypes.BillingTarget[],
  search: { plan: CompanyBillingPageTypes.Plan | null; billingInterval: CompanyBillingPageTypes.Interval | null },
): CompanyBillingPageTypes.BillingTarget | null {
  if (search.plan && search.billingInterval) {
    return (
      sellableTargets.find(
        (target) => target.plan === search.plan && target.billingInterval === search.billingInterval,
      ) || null
    );
  }

  if (search.plan) {
    return sellableTargets.find((target) => target.plan === search.plan) || null;
  }

  if (search.billingInterval) {
    return sellableTargets.find((target) => target.billingInterval === search.billingInterval) || null;
  }

  return null;
}

function compareTargets(
  leftPlan: CompanyBillingPageTypes.Plan,
  leftInterval: CompanyBillingPageTypes.Interval,
  rightPlan: CompanyBillingPageTypes.Plan,
  rightInterval: CompanyBillingPageTypes.Interval,
): number {
  const planOrder: Record<CompanyBillingPageTypes.Plan, number> = { team: 0, business: 1, unlimited: 2 };
  const intervalOrder: Record<CompanyBillingPageTypes.Interval, number> = { monthly: 0, yearly: 1 };

  return planOrder[leftPlan] - planOrder[rightPlan] || intervalOrder[leftInterval] - intervalOrder[rightInterval];
}

function isSelectableBillingPlan(value: string | null | undefined): value is CompanyBillingPageTypes.Plan {
  return value === "team" || value === "business" || value === "unlimited";
}

function isSelectableCatalogProduct(
  product: CompanyBillingPageTypes.BillingCatalogProduct,
): product is CompanyBillingPageTypes.BillingCatalogProduct & { planFamily: CompanyBillingPageTypes.Plan } {
  return product.active && isSelectableBillingPlan(product.planFamily);
}

function isBillingInterval(value: string | null): value is CompanyBillingPageTypes.Interval {
  return value === "monthly" || value === "yearly";
}
