import Api from "@/api";
import * as api from "@/api";
export { useBillingUpdatedSignal } from "@/signals";
import { browserLocale } from "@/utils/formatting";
import { formatPlanLabel } from "./planFormatting";
import {
  buildCompanyBillingCancellationFeedback,
  buildCompanyBillingPlanChangeFeedback,
  buildCompanyBillingReactivationFeedback,
  canCreateCompanyBillingCheckout,
  CompanyBillingPage,
  findCompanyBillingSellableProduct,
  isCompanyBillingCheckoutReturnSuccessful,
  isCompanyBillingPaidStatus,
  listCompanyBillingSellableTargets,
  parseCompanyBillingSearch,
  selectCompanyBillingTarget,
} from "turboui";

type BillingCatalogProduct = api.BillingCatalogProduct;
type BillingCheckoutSession = api.BillingCheckoutSession;
type BillingHostedSession = api.BillingHostedSession;
type BillingInterval = api.BillingInterval;
export type BillingOverview = api.BillingOverview;
type BillingPlan = api.BillingPlan;
type BillingPlanDefinition = api.BillingPlanDefinition;
type BillingStatus = api.BillingStatus;

export type BillingFeedback = CompanyBillingPage.Feedback;
type BillingSearchParams = CompanyBillingPage.BillingSearchParams;
type BillingTarget = CompanyBillingPage.BillingTarget;
type BillingTargetSelection = CompanyBillingPage.BillingTargetSelection;

export type { BillingLimitGuidance, BillingLimitViewerRole } from "./memberLimitGuidance";
export type { BillingLimitError } from "./limitError";

export { buildMemberLimitGuidance } from "./memberLimitGuidance";
export { extractLimitError, extractLimitErrorDetails } from "./limitError";
export { formatPlanLabel, formatPlanName } from "./planFormatting";

interface BillingTestHooks {
  captureExternalNavigation?: boolean;
  externalNavigations?: string[];
}

type BeginCheckoutResult =
  | { outcome: "missing_target" }
  | { outcome: "target_unavailable" }
  | { outcome: "session_created"; session: BillingCheckoutSession }
  | { outcome: "provider_error"; billing?: BillingOverview };

type ChangePlanResult =
  | { outcome: "missing_target" }
  | { outcome: "target_unavailable" }
  | { outcome: "billing_updated"; billing: BillingOverview }
  | { outcome: "provider_error"; billing?: BillingOverview };

type BillingMutationResult =
  | { outcome: "billing_updated"; billing: BillingOverview }
  | { outcome: "provider_error"; billing?: BillingOverview };

type BeginHostedSessionResult =
  | { outcome: "session_created"; session: BillingHostedSession }
  | { outcome: "provider_error"; billing?: BillingOverview };

interface BillingCancellationSummary {
  currentPlanLabel: string;
  currentPeriodEnd: string | null;
  freePlanMemberLimit: number | null;
  memberCount: number;
  willExceedFreeMemberLimit: boolean;
  memberOverage: number;
}

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

async function createPaymentMethodSession(
  input: api.BillingCreatePaymentMethodSessionInput,
): Promise<BillingHostedSession> {
  return Api.billing.createPaymentMethodSession(input).then((data) => data.session);
}

async function createCustomerPortalSession(
  input: api.BillingCreateCustomerPortalSessionInput,
): Promise<BillingHostedSession> {
  return Api.billing.createCustomerPortalSession(input).then((data) => data.session);
}

export async function beginCheckout(target: BillingTarget | null): Promise<BeginCheckoutResult> {
  if (!target) {
    return { outcome: "missing_target" };
  }

  if (!target.product) {
    return { outcome: "target_unavailable" };
  }

  return withBillingRefreshFallback(async () => {
    const session = await createCheckoutSession({
      plan: target.plan,
      billingInterval: target.billingInterval,
    });

    return { outcome: "session_created", session };
  });
}

export async function changePlan(target: BillingTarget | null): Promise<ChangePlanResult> {
  if (!target) {
    return { outcome: "missing_target" };
  }

  if (!target.product) {
    return { outcome: "target_unavailable" };
  }

  return withBillingRefreshFallback(async () => {
    const result = await Api.billing.changePlan({
      plan: target.plan,
      billingInterval: target.billingInterval,
    });

    return { outcome: "billing_updated", billing: result.billing };
  });
}

export async function cancelSubscription(): Promise<BillingMutationResult> {
  return withBillingRefreshFallback(async () => {
    const result = await Api.billing.cancel({});
    return { outcome: "billing_updated", billing: result.billing };
  });
}

export async function reactivateSubscription(): Promise<BillingMutationResult> {
  return withBillingRefreshFallback(async () => {
    const result = await Api.billing.reactivate({});
    return { outcome: "billing_updated", billing: result.billing };
  });
}

export async function beginPaymentMethodSession(returnTo: string): Promise<BeginHostedSessionResult> {
  return withBillingRefreshFallback(async () => {
    const session = await createPaymentMethodSession({ returnTo });
    return { outcome: "session_created", session };
  });
}

export async function beginCustomerPortalSession(returnTo: string): Promise<BeginHostedSessionResult> {
  return withBillingRefreshFallback(async () => {
    const session = await createCustomerPortalSession({ returnTo });
    return { outcome: "session_created", session };
  });
}

export function redirectToExternalBillingUrl(url: string) {
  const billingTestHooks = (window.__tests as { billing?: BillingTestHooks } | undefined)?.billing;

  if (billingTestHooks?.captureExternalNavigation) {
    billingTestHooks.externalNavigations = [...(billingTestHooks.externalNavigations || []), url];
    return;
  }

  window.location.assign(url);
}

async function withBillingRefreshFallback<T extends { outcome: string }>(
  operation: () => Promise<T>,
): Promise<T | { outcome: "provider_error"; billing?: BillingOverview }> {
  try {
    return await operation();
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

export function canManagePaidSubscription(status: BillingStatus): boolean {
  return isCompanyBillingPaidStatus(status);
}

export function isCheckoutReturnSuccessful(billing: BillingOverview, requestedTarget: BillingTarget | null): boolean {
  return isCompanyBillingCheckoutReturnSuccessful(billing, requestedTarget);
}

export function buildPlanChangeFeedback(billing: BillingOverview): BillingFeedback {
  return buildCompanyBillingPlanChangeFeedback(billing);
}

export function buildCancellationFeedback(billing: BillingOverview): BillingFeedback {
  return buildCompanyBillingCancellationFeedback(billing);
}

export function buildReactivationFeedback(billing: BillingOverview): BillingFeedback {
  return buildCompanyBillingReactivationFeedback(billing);
}

export function buildCancellationSummary(billing: BillingOverview): BillingCancellationSummary {
  const freePlan = findPlanDefinition(billing.plans, "free");
  const freePlanMemberLimit = freePlan?.memberLimit || null;
  const memberOverage = freePlanMemberLimit == null ? 0 : Math.max(billing.memberCount - freePlanMemberLimit, 0);

  return {
    currentPlanLabel: formatPlanLabel(billing.account.planKey, billing.account.billingInterval, "Current plan"),
    currentPeriodEnd: billing.account.currentPeriodEnd || null,
    freePlanMemberLimit,
    memberCount: billing.memberCount,
    willExceedFreeMemberLimit: memberOverage > 0,
    memberOverage,
  };
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
