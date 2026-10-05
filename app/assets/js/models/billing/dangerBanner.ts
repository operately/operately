import * as api from "@/api";
import { formatStorageBytes, type BillingDangerBannerViewModel } from "turboui";

import { isPaymentRecoveryAccessState } from "./paymentDefaultBanner";

type BillingCompanyAccessState = api.BillingCompanyAccessState;
type BillingLimitSnapshot = api.BillingAccessStateLimit;

interface BillingDangerBannerRoutes {
  companyBillingPath: () => string;
  companyBillingPlansPath: (opts?: { plan?: string | null; billingPeriod?: string | null }) => string;
}

export function buildBillingDangerBanner(
  accessState: BillingCompanyAccessState | null | undefined,
  canManageBilling: boolean,
  routes: BillingDangerBannerRoutes,
): BillingDangerBannerViewModel | null {
  if (accessState && isPaymentRecoveryAccessState(accessState)) {
    const mode: "payment_grace" | "read_only" = accessState.accessState === "read_only" ? "read_only" : "payment_grace";

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
          label: "Review billing",
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

function usageRows(activeStatuses: BillingLimitSnapshot[]) {
  return activeStatuses.map((status) => {
    const state: "blocked" | "near_limit" = status.blocked ? "blocked" : "near_limit";

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
