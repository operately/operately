import { CompanyBillingPage } from "./types";

export function parseCompanyBillingSearch(search: string): CompanyBillingPage.BillingSearchParams {
  const params = new URLSearchParams(search);
  const rawPlan = params.get("plan");
  const rawBillingPeriod = params.get("billing_period");

  return {
    rawPlan,
    rawBillingPeriod,
    plan: isBillingPlan(rawPlan) ? rawPlan : null,
    billingInterval: isBillingInterval(rawBillingPeriod) ? rawBillingPeriod : null,
    checkoutId: params.get("checkout_id"),
    hasSelectionIntent: Boolean(rawPlan || rawBillingPeriod),
  };
}

export function listCompanyBillingSellableTargets(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.BillingTarget[] {
  return billing.catalogProducts
    .filter((product) => product.active)
    .sort((a, b) => compareTargets(a.planFamily, a.billingInterval, b.planFamily, b.billingInterval))
    .map((product) => ({
      plan: product.planFamily,
      billingInterval: product.billingInterval,
      product,
    }));
}

export function findCompanyBillingSellableProduct(
  catalogProducts: CompanyBillingPage.BillingCatalogProduct[],
  plan: CompanyBillingPage.Plan,
  billingInterval: CompanyBillingPage.Interval,
): CompanyBillingPage.BillingCatalogProduct | null {
  return catalogProducts.find((product) => product.active && product.planFamily === plan && product.billingInterval === billingInterval) || null;
}

export function getCompanyBillingPendingTarget(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.BillingTarget | null {
  if (!billing.account.pendingPlanKey || !billing.account.pendingBillingInterval) {
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

export function getCompanyBillingSuggestedTarget(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.BillingTarget | null {
  if (!billing.account.suggestedPlanKey) {
    return null;
  }

  return resolveRequestedTarget(listCompanyBillingSellableTargets(billing), {
    plan: billing.account.suggestedPlanKey,
    billingInterval: billing.account.suggestedBillingInterval || null,
  });
}

export function selectCompanyBillingTarget(
  billing: CompanyBillingPage.BillingOverview,
  search: CompanyBillingPage.BillingSearchParams,
): CompanyBillingPage.BillingTargetSelection {
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

export function canCreateCompanyBillingCheckout(status: CompanyBillingPage.Status): boolean {
  return status === "free" || status === "canceled";
}

export function isCompanyBillingPaidStatus(status: CompanyBillingPage.Status): boolean {
  return status === "active" || status === "past_due";
}

export function matchesCompanyBillingTarget(
  account: CompanyBillingPage.BillingAccount,
  target: CompanyBillingPage.BillingTarget | null,
): boolean {
  if (!target) return false;

  return account.planKey === target.plan && account.billingInterval === target.billingInterval;
}

export function isCompanyBillingCheckoutReturnSuccessful(
  billing: CompanyBillingPage.BillingOverview,
  requestedTarget: CompanyBillingPage.BillingTarget | null,
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
  billing: CompanyBillingPage.BillingOverview,
  sellableTargets: CompanyBillingPage.BillingTarget[],
): { target: CompanyBillingPage.BillingTarget; source: CompanyBillingPage.BillingTargetSource } | null {
  const pendingTarget = getCompanyBillingPendingTarget(billing);
  if (pendingTarget?.product) {
    return { target: pendingTarget, source: "pending" };
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
  sellableTargets: CompanyBillingPage.BillingTarget[],
  search: { plan: CompanyBillingPage.Plan | null; billingInterval: CompanyBillingPage.Interval | null },
): CompanyBillingPage.BillingTarget | null {
  if (search.plan && search.billingInterval) {
    return sellableTargets.find((target) => target.plan === search.plan && target.billingInterval === search.billingInterval) || null;
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
  leftPlan: CompanyBillingPage.Plan,
  leftInterval: CompanyBillingPage.Interval,
  rightPlan: CompanyBillingPage.Plan,
  rightInterval: CompanyBillingPage.Interval,
): number {
  const planOrder: Record<CompanyBillingPage.Plan, number> = { team: 0, business: 1 };
  const intervalOrder: Record<CompanyBillingPage.Interval, number> = { monthly: 0, yearly: 1 };

  return planOrder[leftPlan] - planOrder[rightPlan] || intervalOrder[leftInterval] - intervalOrder[rightInterval];
}

function isBillingPlan(value: string | null): value is CompanyBillingPage.Plan {
  return value === "team" || value === "business";
}

function isBillingInterval(value: string | null): value is CompanyBillingPage.Interval {
  return value === "monthly" || value === "yearly";
}
