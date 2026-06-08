import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";
import {
  formatCompanyBillingDate,
  formatCompanyBillingPlanLabel,
} from "./formatting";
import { getCompanyBillingCurrentPlanDefinition, findCompanyBillingPlanDefinition } from "./plans";
import { formatStorageBytes } from "./storageFormatting";

export function resolveCompanyBillingChangeTiming(
  currentTarget: CompanyBillingPageTypes.BillingTarget | null,
  nextTarget: CompanyBillingPageTypes.BillingTarget | null,
): CompanyBillingPageTypes.ChangeTiming | null {
  if (!currentTarget || !nextTarget) return null;

  const currentTier = planTier(currentTarget.plan);
  const nextTier = planTier(nextTarget.plan);

  if (nextTier > currentTier) return "immediate";
  if (nextTier < currentTier) return "next_renewal";

  if (currentTarget.billingInterval === "monthly" && nextTarget.billingInterval === "yearly") {
    return "immediate";
  }

  if (currentTarget.billingInterval === "yearly" && nextTarget.billingInterval === "monthly") {
    return "next_renewal";
  }

  return "immediate";
}

export function buildCompanyBillingChangeConsequence(args: {
  billing: CompanyBillingPageTypes.BillingOverview;
  targetPlanKey: CompanyBillingPageTypes.ChangeTargetPlan;
  targetBillingInterval?: CompanyBillingPageTypes.Interval | null;
  timing: CompanyBillingPageTypes.ChangeTiming;
  effectiveDate?: string | null;
}): CompanyBillingPageTypes.ChangeConsequence {
  const { billing, targetPlanKey, targetBillingInterval, timing, effectiveDate = null } = args;
  const currentPlan = getCompanyBillingCurrentPlanDefinition(billing);
  const targetPlan = findCompanyBillingPlanDefinition(billing.plans, targetPlanKey);
  const memberLimit = targetPlan?.memberLimit ?? null;
  const storageLimitBytes = targetPlan?.storageLimitBytes ?? null;
  const memberOverage = memberLimit == null ? 0 : Math.max(billing.memberCount - memberLimit, 0);
  const storageOverageBytes = storageLimitBytes == null ? 0 : Math.max(billing.storageUsageBytes - storageLimitBytes, 0);

  return {
    targetPlanKey,
    targetPlanLabel: formatCompanyBillingPlanLabel(targetPlanKey, targetBillingInterval),
    timing,
    effectiveDate,
    isLowerEntitlement:
      !!currentPlan &&
      !!targetPlan &&
      (targetPlan.memberLimit < currentPlan.memberLimit || targetPlan.storageLimitBytes < currentPlan.storageLimitBytes),
    memberCount: billing.memberCount,
    memberLimit,
    memberOverage,
    storageUsageBytes: billing.storageUsageBytes,
    storageLimitBytes,
    storageOverageBytes,
    overageKind: determineOverageKind(memberOverage, storageOverageBytes),
  };
}

export function formatCompanyBillingChangeTimingDescription(
  consequence: CompanyBillingPageTypes.ChangeConsequence,
): string {
  if (consequence.timing === "immediate") {
    return `${consequence.targetPlanLabel} takes effect immediately.`;
  }

  const effectiveDate = formatCompanyBillingDate(consequence.effectiveDate);
  if (effectiveDate) {
    return `${consequence.targetPlanLabel} takes effect at the next renewal on ${effectiveDate}.`;
  }

  return `${consequence.targetPlanLabel} takes effect at the next renewal.`;
}

export function buildCompanyBillingOverageDescription(consequence: CompanyBillingPageTypes.ChangeConsequence) {
  const limitLabel = consequence.targetPlanLabel;
  const memberLimit = consequence.memberLimit;
  const storageLimitBytes = consequence.storageLimitBytes;

  let description: string | null = null;

  switch (consequence.overageKind) {
    case "member":
      description =
        memberLimit == null
          ? null
          : `After it takes effect, adding or restoring people may be blocked because this company has ${consequence.memberCount} active members and ${limitLabel} includes ${memberLimit}.`;
      break;

    case "storage":
      description =
        storageLimitBytes == null
          ? null
          : `After it takes effect, uploading files may be blocked because this company is using ${formatStorageBytes(consequence.storageUsageBytes)} and ${limitLabel} includes ${formatStorageBytes(storageLimitBytes)}.`;
      break;

    case "member_and_storage":
      description =
        memberLimit == null || storageLimitBytes == null
          ? null
          : `After it takes effect, adding or restoring people and uploading files may be blocked because this company has ${consequence.memberCount} active members, is using ${formatStorageBytes(consequence.storageUsageBytes)}, and ${limitLabel} includes ${memberLimit} members and ${formatStorageBytes(storageLimitBytes)} of storage.`;
      break;

    default:
      description = null;
  }

  if (!description) return null;

  return description;
}

function determineOverageKind(
  memberOverage: number,
  storageOverageBytes: number,
): CompanyBillingPageTypes.OverageKind {
  if (memberOverage > 0 && storageOverageBytes > 0) return "member_and_storage";
  if (memberOverage > 0) return "member";
  if (storageOverageBytes > 0) return "storage";
  return "none";
}

function planTier(planKey: CompanyBillingPageTypes.Plan): number {
  if (planKey === "business") return 2;
  return 1;
}
