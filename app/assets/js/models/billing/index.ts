import Api from "@/api";
import * as api from "@/api";

export { useBillingUpdatedSignal } from "@/signals";
export type BillingCompanyAccessState = api.BillingCompanyAccessState;
export type BillingOverview = api.BillingOverview;

export type { BillingLimitGuidance, BillingLimitViewerRole } from "./memberLimitGuidance";
export type { BillingLimitError } from "./limitError";

export { buildBillingDangerBanner, describeBlockedActions, isBillingManagementPath } from "./dangerBanner";
export { isPaymentRecoveryAccessState } from "./paymentDefaultBanner";
export { buildMemberLimitGuidance } from "./memberLimitGuidance";
export { extractLimitError, extractLimitErrorDetails } from "./limitError";
export * from "./navigation";

export async function getAccessState(
  input: api.BillingGetAccessStateInput = {},
): Promise<api.BillingCompanyAccessState> {
  return Api.billing.getAccessState(input).then((data) => data.accessState);
}

export { fetchBilling, fetchBillingCompanies, authorizeBillingManagementPageAccess } from "./billingQueries";
export { useBillingActions } from "./billingLifecycle";
