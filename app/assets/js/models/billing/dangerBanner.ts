import * as api from "@/api";
import { formatStorageBytes } from "turboui/CompanyBilling";

import { isPaymentRecoveryAccessState } from "./paymentDefaultBanner";

type BillingCompanyAccessState = api.BillingCompanyAccessState;
type BillingLimitSnapshot = api.BillingAccessStateLimit;

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

  if (!accessState) {
    return null;
  }

  const activeStatuses = dangerStatuses([accessState.memberLimit, accessState.storageLimit]);

  if (activeStatuses.length === 0) {
    return null;
  }

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
          to: routes.companyBillingPlansPath(),
        }
      : null,
  };
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

export function isBillingManagementPath(pathname: string, billingPath: string) {
  return pathname === billingPath || pathname.startsWith(`${billingPath}/`);
}
