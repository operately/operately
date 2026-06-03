import * as api from "@/api";
import { formatStorageBytes } from "turboui/CompanyBilling";

import { isPaymentRecoveryAccessState } from "./paymentDefaultBanner";

type BillingCompanyAccessState = api.BillingCompanyAccessState;
type BillingLimitWarnings = api.BillingLimitWarnings;
type BillingLimitSnapshot = (api.BillingAccessStateLimit | api.BillingLimitStatus) & {
  recommendedUpgrade?: api.BillingRecommendedUpgrade | null;
};

interface BillingDangerBannerRoutes {
  companyBillingPath: () => string;
  companyBillingPlansPath: (opts?: { plan?: string | null; billingPeriod?: string | null }) => string;
}

type BillingDangerUsageRowState = "blocked" | "near_limit";

interface BillingDangerUsageRow {
  label: string;
  value: string;
  state: BillingDangerUsageRowState;
}

type PaymentDefaultMode = "payment_grace" | "read_only";

interface PaymentDefaultDangerBannerViewModel {
  kind: "payment_default";
  mode: PaymentDefaultMode;
  title: string;
  deadline: string | null;
  shouldContactAdmin: boolean;
  cta: { label: string; to: string } | null;
}

interface OverLimitDangerBannerViewModel {
  kind: "over_limit";
  mode: "over_limit";
  title: string;
  blockedLimitKeys: string[];
  usageRows: BillingDangerUsageRow[];
  shouldContactAdmin: boolean;
  cta: { label: string; to: string } | null;
}

type BillingDangerBannerViewModel = PaymentDefaultDangerBannerViewModel | OverLimitDangerBannerViewModel;

export function buildBillingDangerBanner(
  accessState: BillingCompanyAccessState | null | undefined,
  warnings: BillingLimitWarnings | null | undefined,
  canManageBilling: boolean,
  routes: BillingDangerBannerRoutes,
): BillingDangerBannerViewModel | null {
  if (accessState && isPaymentRecoveryAccessState(accessState)) {
    const mode: PaymentDefaultMode = accessState.accessState === "read_only" ? "read_only" : "payment_grace";

    return {
      kind: "payment_default",
      mode,
      title: mode === "read_only" ? "This company is read-only" : "Payment issue requires attention",
      deadline: accessState.accessStateEndsAt || null,
      shouldContactAdmin: !canManageBilling,
      cta: canManageBilling ? { label: "Review billing", to: routes.companyBillingPath() } : null,
    };
  }

  const activeStatuses = selectOverLimitDangerStatuses(accessState, warnings);

  if (activeStatuses.length === 0) {
    return null;
  }

  const recommendedUpgrade = activeStatuses.find((status) => status.recommendedUpgrade?.planKey)?.recommendedUpgrade || null;

  return {
    kind: "over_limit",
    mode: "over_limit",
    title: "This company is over its plan limits",
    blockedLimitKeys: activeStatuses.filter((status) => status.blocked).map((status) => status.limitKey),
    usageRows: usageRows(activeStatuses),
    shouldContactAdmin: !canManageBilling,
    cta: canManageBilling
      ? {
          label: "Review plans",
          to:
            recommendedUpgrade?.planKey && recommendedUpgrade?.billingInterval
              ? routes.companyBillingPlansPath({
                  plan: recommendedUpgrade.planKey,
                  billingPeriod: recommendedUpgrade.billingInterval,
                })
              : routes.companyBillingPath(),
        }
      : null,
  };
}

function selectOverLimitDangerStatuses(
  accessState: BillingCompanyAccessState | null | undefined,
  warnings: BillingLimitWarnings | null | undefined,
): BillingLimitSnapshot[] {
  const warningStatuses = warnings ? dangerStatuses([warnings.memberLimit, warnings.storageLimit]) : [];

  if (warningStatuses.length > 0) {
    return warningStatuses;
  }

  if (!accessState) {
    return [];
  }

  return dangerStatuses([accessState.memberLimit, accessState.storageLimit]);
}

function dangerStatuses(statuses: BillingLimitSnapshot[]): BillingLimitSnapshot[] {
  const blockedStatuses = statuses.filter((status) => status.enforced && status.blocked);

  if (blockedStatuses.length === 0) {
    return [];
  }

  const nearLimitStatuses = statuses.filter((status) => status.enforced && status.nearLimit && !status.blocked);

  return [...blockedStatuses, ...nearLimitStatuses];
}

function usageRows(activeStatuses: BillingLimitSnapshot[]): BillingDangerUsageRow[] {
  return activeStatuses.map((status) => {
    const state: BillingDangerUsageRowState = status.blocked ? "blocked" : "near_limit";

    if (status.limitKey === "member_count") {
      return {
        label: "Active members",
        value: `${status.currentUsage} / ${status.limit}`,
        state,
      };
    }

    return {
      label: "Storage used",
      value: `${formatStorageBytes(status.currentUsage)} / ${formatStorageBytes(status.limit)}`,
      state,
    };
  });
}
