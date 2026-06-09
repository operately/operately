import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";
import { listCompanyBillingSellablePlanDefinitions, normalizeCompanyBillingPlanKey } from "./plans";

const INTERVAL_ORDER: Record<CompanyBillingPageTypes.Interval, number> = { monthly: 0, yearly: 1 };

export function parseCompanyBillingSearch(search: string): CompanyBillingPageTypes.BillingSearchParams {
  const params = new URLSearchParams(search);
  const rawPlan = params.get("plan");
  const rawBillingPeriod = params.get("billing_period");

  return {
    rawPlan,
    rawBillingPeriod,
    plan: normalizeCompanyBillingPlanKey(rawPlan),
    billingInterval: isBillingInterval(rawBillingPeriod) ? rawBillingPeriod : null,
    checkoutId: params.get("checkout_id"),
    hasSelectionIntent: Boolean(rawPlan || rawBillingPeriod),
  };
}

export function listCompanyBillingSellableTargets(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget[] {
  return listCompanyBillingSellablePlanDefinitions(billing).flatMap((plan) =>
    listTargetsForPlan(billing.catalogProducts, plan.key),
  );
}

export function findCompanyBillingSellableProduct(
  catalogProducts: CompanyBillingPageTypes.BillingCatalogProduct[],
  plan: CompanyBillingPageTypes.PlanKey,
  billingInterval: CompanyBillingPageTypes.Interval,
): CompanyBillingPageTypes.BillingCatalogProduct | null {
  const normalizedPlan = normalizeCompanyBillingPlanKey(plan);
  if (!normalizedPlan) return null;

  return (
    catalogProducts.find(
      (product) =>
        product.active &&
        normalizeCompanyBillingPlanKey(product.planFamily) === normalizedPlan &&
        product.billingInterval === billingInterval,
    ) || null
  );
}

export function getCompanyBillingPendingTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  return buildAccountTarget(
    billing.catalogProducts,
    billing.account.pendingPlanKey,
    billing.account.pendingBillingInterval,
  );
}

export function getCompanyBillingScheduledTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  return buildAccountTarget(
    billing.catalogProducts,
    billing.account.scheduledPlanKey,
    billing.account.scheduledBillingInterval,
  );
}

export function getCompanyBillingCurrentTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  return buildAccountTarget(billing.catalogProducts, billing.account.planKey, billing.account.billingInterval);
}

export function getCompanyBillingSuggestedTarget(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.BillingTarget | null {
  return resolveRequestedTarget(listCompanyBillingSellableTargets(billing), {
    plan: billing.account.suggestedPlanKey ?? null,
    billingInterval: billing.account.suggestedBillingInterval ?? null,
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
  const pendingTarget = resolveTargetSelection(sellableTargets, getCompanyBillingPendingTarget(billing));
  if (pendingTarget?.product) {
    return { target: pendingTarget, source: "pending" };
  }

  if (isCompanyBillingPaidStatus(billing.account.status)) {
    const scheduledTarget = resolveTargetSelection(sellableTargets, getCompanyBillingScheduledTarget(billing));
    if (scheduledTarget) {
      return { target: scheduledTarget, source: "scheduled" };
    }

    const currentTarget = resolveTargetSelection(sellableTargets, getCompanyBillingCurrentTarget(billing));
    if (currentTarget) {
      return { target: currentTarget, source: "current" };
    }
  }

  if (billing.account.status === "free") {
    const suggestedTarget = resolveTargetSelection(sellableTargets, getCompanyBillingSuggestedTarget(billing));
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

function buildAccountTarget(
  catalogProducts: CompanyBillingPageTypes.BillingCatalogProduct[],
  planKey: string | null | undefined,
  billingInterval: CompanyBillingPageTypes.Interval | null | undefined,
): CompanyBillingPageTypes.BillingTarget | null {
  const normalizedPlanKey = normalizeCompanyBillingPlanKey(planKey);

  if (!normalizedPlanKey || !billingInterval) return null;

  return {
    plan: normalizedPlanKey,
    billingInterval,
    product: findCompanyBillingSellableProduct(catalogProducts, normalizedPlanKey, billingInterval),
  };
}

function resolveTargetSelection(
  sellableTargets: CompanyBillingPageTypes.BillingTarget[],
  target: CompanyBillingPageTypes.BillingTarget | null,
): CompanyBillingPageTypes.BillingTarget | null {
  if (!target) return null;

  return resolveRequestedTarget(sellableTargets, {
    plan: target.plan,
    billingInterval: target.billingInterval,
  });
}

function resolveRequestedTarget(
  sellableTargets: CompanyBillingPageTypes.BillingTarget[],
  search: { plan: CompanyBillingPageTypes.PlanKey | null; billingInterval: CompanyBillingPageTypes.Interval | null },
): CompanyBillingPageTypes.BillingTarget | null {
  const normalizedPlan = normalizeCompanyBillingPlanKey(search.plan);

  if (normalizedPlan && search.billingInterval) {
    return (
      sellableTargets.find(
        (target) => target.plan === normalizedPlan && target.billingInterval === search.billingInterval,
      ) || null
    );
  }

  if (normalizedPlan) {
    return sellableTargets.find((target) => target.plan === normalizedPlan) || null;
  }

  if (search.billingInterval) {
    return sellableTargets.find((target) => target.billingInterval === search.billingInterval) || null;
  }

  return null;
}

function listTargetsForPlan(
  catalogProducts: CompanyBillingPageTypes.BillingCatalogProduct[],
  planKey: CompanyBillingPageTypes.PlanKey,
): CompanyBillingPageTypes.BillingTarget[] {
  return catalogProducts
    .filter((product) => product.active && normalizeCompanyBillingPlanKey(product.planFamily) === planKey)
    .sort((left, right) => INTERVAL_ORDER[left.billingInterval] - INTERVAL_ORDER[right.billingInterval])
    .map((product) => ({
      plan: planKey,
      billingInterval: product.billingInterval,
      product,
    }));
}

function isBillingInterval(value: string | null): value is CompanyBillingPageTypes.Interval {
  return value === "monthly" || value === "yearly";
}
