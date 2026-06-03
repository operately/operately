import * as api from "@/api";
import { getLocalStorage, safeGetItem, safeSetItem } from "@/utils/safeLocalStorage";
import { formatStorageBytes } from "turboui/CompanyBilling";

// 3 days in milliseconds
export const APPROACHING_LIMIT_BANNER_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

const STORAGE_CONTEXT = "billing-limit-banner";

type BillingLimitWarnings = api.BillingLimitWarnings;
type BillingLimitWarningStatus = api.BillingLimitStatus;

interface ApproachingLimitBannerViewModel {
  mode: "approaching" | "over_limit";
  title: string;
  description: string;
  usageRows: { label: string; value: string; state: "blocked" | "near_limit" }[];
  cta: { label: string; to: string } | null;
  activeLimitKeys: string[];
}

interface ApproachingLimitBannerRoutes {
  companyBillingPath: () => string;
  companyBillingPlansPath: (opts?: { plan?: string | null; billingPeriod?: string | null }) => string;
}

export function buildApproachingLimitBanner(
  warnings: BillingLimitWarnings,
  role: "owner" | "company_admin" | "regular",
  canManageBilling: boolean,
  routes: ApproachingLimitBannerRoutes,
): ApproachingLimitBannerViewModel | null {
  if (role === "regular") {
    return null;
  }

  if (hasBlockedStatuses(warnings)) {
    return null;
  }

  const activeStatuses = getActiveApproachingLimitStatuses(warnings);

  if (activeStatuses.length === 0) {
    return null;
  }

  const recommendedUpgrade = activeStatuses.find((status) => status.recommendedUpgrade?.planKey)?.recommendedUpgrade || null;
  const mode = "approaching";

  if (canManageBilling) {
    return {
      mode,
      title: "Approaching your plan limits",
      description: "Review plans now to keep invites and uploads moving without interruptions.",
      usageRows: usageRows(activeStatuses),
      cta: {
        label: "Review plans",
        to:
          recommendedUpgrade?.planKey && recommendedUpgrade?.billingInterval
            ? routes.companyBillingPlansPath({
                plan: recommendedUpgrade.planKey,
                billingPeriod: recommendedUpgrade.billingInterval,
              })
            : routes.companyBillingPath(),
      },
      activeLimitKeys: activeStatuses.map((status) => status.limitKey),
    };
  }

  return {
    mode,
    title: "Approaching your plan limits",
    description: "A company admin or owner should review the company plan before uploads or invites start failing.",
    usageRows: usageRows(activeStatuses),
    cta: null,
    activeLimitKeys: activeStatuses.map((status) => status.limitKey),
  };
}

function getActiveApproachingLimitStatuses(warnings: BillingLimitWarnings): BillingLimitWarningStatus[] {
  return [warnings.memberLimit, warnings.storageLimit].filter((status) => status.enforced && status.nearLimit && !status.blocked);
}

function hasBlockedStatuses(warnings: BillingLimitWarnings) {
  return [warnings.memberLimit, warnings.storageLimit].some((status) => status.enforced && status.blocked);
}

function approachingLimitBannerStorageKey(companyId: string, limitKey: string): string {
  return `billing-limit-banner:${companyId}:${limitKey}`;
}

export function dismissApproachingLimitBanner(
  companyId: string,
  limitKeys: string[],
  opts?: { now?: number; storage?: Storage | null },
) {
  const now = opts?.now || Date.now();
  const storage = opts?.storage ?? getLocalStorage();

  limitKeys.forEach((limitKey) => {
    safeSetItem(storage, approachingLimitBannerStorageKey(companyId, limitKey), String(now), STORAGE_CONTEXT);
  });
}

export function isApproachingLimitBannerDismissed(
  warnings: BillingLimitWarnings,
  companyId: string,
  opts?: { now?: number; storage?: Storage | null },
) {
  const activeStatuses = getActiveApproachingLimitStatuses(warnings);

  if (activeStatuses.length == 0) {
    return false;
  }

  const now = opts?.now || Date.now();
  const storage = opts?.storage ?? getLocalStorage();

  return activeStatuses.every((status) => {
    const rawValue = safeGetItem(storage, approachingLimitBannerStorageKey(companyId, status.limitKey), STORAGE_CONTEXT);
    if (!rawValue) return false;

    const dismissedAt = Number(rawValue);
    if (!Number.isFinite(dismissedAt)) return false;

    return now - dismissedAt < APPROACHING_LIMIT_BANNER_COOLDOWN_MS;
  });
}

export function isBillingManagementPath(pathname: string, billingPath: string) {
  return pathname === billingPath || pathname.startsWith(`${billingPath}/`);
}

function usageRows(activeStatuses: BillingLimitWarningStatus[]): ApproachingLimitBannerViewModel["usageRows"] {
  return activeStatuses.map((status) => {
    const state: ApproachingLimitBannerViewModel["usageRows"][number]["state"] = status.blocked ? "blocked" : "near_limit";

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
