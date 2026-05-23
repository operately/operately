import Api from "@/api";
import * as api from "@/api";
export { useBillingUpdatedSignal } from "@/signals";
import { browserLocale } from "@/utils/formatting";
import {
  canCreateCompanyBillingCheckout,
  CompanyBillingPage,
  findCompanyBillingSellableProduct,
  isCompanyBillingCheckoutReturnSuccessful,
  listCompanyBillingSellableTargets,
  parseCompanyBillingSearch,
  selectCompanyBillingTarget,
} from "turboui";

type BillingCatalogProduct = api.BillingCatalogProduct;
type BillingCheckoutSession = api.BillingCheckoutSession;
type BillingInterval = api.BillingInterval;
export type BillingOverview = api.BillingOverview;
type BillingPlan = api.BillingPlan;
type BillingPlanDefinition = api.BillingPlanDefinition;
type BillingStatus = api.BillingStatus;

type BillingSearchParams = CompanyBillingPage.BillingSearchParams;
type BillingTarget = CompanyBillingPage.BillingTarget;
type BillingTargetSelection = CompanyBillingPage.BillingTargetSelection;
type BeginCheckoutResult =
  | { outcome: "missing_target" }
  | { outcome: "target_unavailable" }
  | { outcome: "session_created"; session: BillingCheckoutSession }
  | { outcome: "provider_error"; billing?: BillingOverview };

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  team: "Team",
  business: "Business",
};

const SUGGESTED_PLAN_SOURCE_LABELS: Record<string, string> = {
  website: "Selected on the website",
};

export async function getBilling(input: api.BillingGetInput = {}): Promise<BillingOverview> {
  return Api.billing.get(input).then((data) => data.billing);
}

export async function refreshBilling(input: api.BillingRefreshInput = {}): Promise<BillingOverview> {
  return Api.billing.refresh(input).then((data) => data.billing);
}

async function createCheckoutSession(input: api.BillingCreateCheckoutSessionInput): Promise<BillingCheckoutSession> {
  return Api.billing.createCheckoutSession(input).then((data) => data.session);
}

export async function beginCheckout(target: BillingTarget | null): Promise<BeginCheckoutResult> {
  if (!target) {
    return { outcome: "missing_target" };
  }

  if (!target.product) {
    return { outcome: "target_unavailable" };
  }

  try {
    const session = await createCheckoutSession({
      plan: target.plan,
      billingInterval: target.billingInterval,
    });

    return { outcome: "session_created", session };
  } catch {
    try {
      const billing = await refreshBilling({});
      return { outcome: "provider_error", billing };
    } catch {
      return { outcome: "provider_error" };
    }
  }
}

function findPlanDefinition(plans: BillingPlanDefinition[], key?: string | null): BillingPlanDefinition | null {
  if (!key) return null;

  return plans.find((plan) => plan.key === key) || null;
}

export function getCurrentPlanDefinition(billing: BillingOverview): BillingPlanDefinition | null {
  if (billing.account.planKey) {
    return findPlanDefinition(billing.plans, billing.account.planKey);
  }

  if (billing.account.status === "free") {
    return findPlanDefinition(billing.plans, "free");
  }

  return null;
}

export function formatPlanName(planKey?: string | null, fallback = "Unknown plan"): string {
  if (!planKey) return fallback;

  return PLAN_NAMES[planKey] || fallback;
}

function formatIntervalLabel(interval?: BillingInterval | null): string | null {
  if (!interval) return null;

  return interval === "monthly" ? "Monthly" : "Yearly";
}

export function formatPlanLabel(planKey?: string | null, interval?: BillingInterval | null, fallback = "Unknown plan"): string {
  const name = formatPlanName(planKey, fallback);
  const intervalLabel = formatIntervalLabel(interval);

  return intervalLabel ? `${name} ${intervalLabel}` : name;
}

export function formatSuggestedPlanSource(source?: string | null): string | null {
  if (!source) return null;

  const knownSource = SUGGESTED_PLAN_SOURCE_LABELS[source];
  if (knownSource) {
    return knownSource;
  }

  return source
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseBillingSearch(search: string): BillingSearchParams {
  return parseCompanyBillingSearch(search);
}

export function listSellableTargets(billing: BillingOverview): BillingTarget[] {
  return listCompanyBillingSellableTargets(billing) as BillingTarget[];
}

export function findSellableProduct(
  catalogProducts: BillingCatalogProduct[],
  plan: BillingPlan,
  billingInterval: BillingInterval,
): BillingCatalogProduct | null {
  return findCompanyBillingSellableProduct(catalogProducts, plan, billingInterval) as BillingCatalogProduct | null;
}

export function selectTarget(billing: BillingOverview, search: BillingSearchParams): BillingTargetSelection {
  return selectCompanyBillingTarget(billing, search) as BillingTargetSelection;
}

export function canCreateCheckout(status: BillingStatus): boolean {
  return canCreateCompanyBillingCheckout(status);
}

export function isCheckoutReturnSuccessful(billing: BillingOverview, requestedTarget: BillingTarget | null): boolean {
  return isCompanyBillingCheckoutReturnSuccessful(billing, requestedTarget);
}

export function formatPriceFromMinorUnits(amount?: number | null, currency?: string | null): string {
  if (amount == null || !currency) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(browserLocale(), {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
