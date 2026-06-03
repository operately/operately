import Api from "@/api";
import * as api from "@/api";
import * as Companies from "@/models/companies";
import { Paths } from "@/routes/paths";
import type { CompanyBillingPage as CompanyBillingPageTypes } from "turboui/CompanyBillingPage";
import { redirect } from "react-router-dom";

export { useBillingUpdatedSignal } from "@/signals";
export type BillingCompanyAccessState = api.BillingCompanyAccessState;
export type BillingLimitStatus = api.BillingLimitStatus;
export type BillingLimitWarnings = api.BillingLimitWarnings;
export type BillingOverview = api.BillingOverview;

export type { BillingLimitGuidance, BillingLimitViewerRole } from "./memberLimitGuidance";
export type { BillingLimitError } from "./limitError";

export {
  APPROACHING_LIMIT_BANNER_COOLDOWN_MS,
  buildApproachingLimitBanner,
  dismissApproachingLimitBanner,
  isApproachingLimitBannerDismissed,
  isBillingManagementPath,
} from "./approachingLimitBanner";
export { buildPaymentDefaultBanner, isPaymentRecoveryAccessState } from "./paymentDefaultBanner";
export { buildMemberLimitGuidance } from "./memberLimitGuidance";
export { extractLimitError, extractLimitErrorDetails } from "./limitError";
export * from "./navigation";

type BillingTarget = CompanyBillingPageTypes.BillingTarget;

type BeginCheckoutResult =
  | { outcome: "missing_target" }
  | { outcome: "target_unavailable" }
  | { outcome: "session_created"; session: api.BillingCheckoutSession }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

type ChangePlanResult =
  | { outcome: "missing_target" }
  | { outcome: "target_unavailable" }
  | { outcome: "billing_updated"; billing: api.BillingOverview }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

type BillingMutationResult =
  | { outcome: "billing_updated"; billing: api.BillingOverview }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

type BeginHostedSessionResult =
  | { outcome: "session_created"; session: api.BillingHostedSession }
  | { outcome: "provider_error"; billing?: api.BillingOverview };

export async function getBilling(input: api.BillingGetInput = {}): Promise<api.BillingOverview> {
  return Api.billing.get(input).then((data) => data.billing);
}

export async function authorizeBillingManagementPageAccess(companyId: string) {
  const company = await Companies.getCompany({ includePermissions: true }).then((data) => data.company!);

  if (!Companies.hasFeature(company, "billing") || !company.permissions?.canManageBilling) {
    throw redirect(new Paths({ companyId }).companyAdminPath());
  }

  return company;
}

export async function getAccessState(input: api.BillingGetAccessStateInput = {}): Promise<api.BillingCompanyAccessState> {
  return Api.billing.getAccessState(input).then((data) => data.accessState);
}

export async function getLimitWarnings(input: api.BillingGetLimitWarningsInput = {}): Promise<api.BillingLimitWarnings> {
  return Api.billing.getLimitWarnings(input).then((data) => data.warnings);
}

export async function refreshBilling(input: api.BillingRefreshInput = {}): Promise<api.BillingOverview> {
  return Api.billing.refresh(input).then((data) => data.billing);
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

async function createCheckoutSession(input: api.BillingCreateCheckoutSessionInput): Promise<api.BillingCheckoutSession> {
  return Api.billing.createCheckoutSession(input).then((data) => data.session);
}

async function createPaymentMethodSession(
  input: api.BillingCreatePaymentMethodSessionInput,
): Promise<api.BillingHostedSession> {
  return Api.billing.createPaymentMethodSession(input).then((data) => data.session);
}

async function createCustomerPortalSession(
  input: api.BillingCreateCustomerPortalSessionInput,
): Promise<api.BillingHostedSession> {
  return Api.billing.createCustomerPortalSession(input).then((data) => data.session);
}

async function withBillingRefreshFallback<T extends { outcome: string }>(
  operation: () => Promise<T>,
): Promise<T | { outcome: "provider_error"; billing?: api.BillingOverview }> {
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
