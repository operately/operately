import { formatStorageBytes } from "./storageFormatting";
import type { CompanyBillingPage } from "./types";

export function resolveCompanyBillingChangeTiming(
  currentTarget: CompanyBillingPage.BillingTarget | null,
  nextTarget: CompanyBillingPage.BillingTarget | null,
): CompanyBillingPage.ChangeTiming | null {
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
  billing: CompanyBillingPage.BillingOverview;
  targetPlanKey: CompanyBillingPage.ChangeTargetPlan;
  targetBillingInterval?: CompanyBillingPage.Interval | null;
  timing: CompanyBillingPage.ChangeTiming;
  effectiveDate?: string | null;
}): CompanyBillingPage.ChangeConsequence {
  const { billing, targetPlanKey, targetBillingInterval, timing, effectiveDate = null } = args;
  const currentPlan = findCurrentPlanDefinition(billing);
  const targetPlan = findPlanDefinition(billing.plans, targetPlanKey);
  const memberLimit = targetPlan?.memberLimit ?? null;
  const storageLimitBytes = targetPlan?.storageLimitBytes ?? null;
  const memberOverage = memberLimit == null ? 0 : Math.max(billing.memberCount - memberLimit, 0);
  const storageOverageBytes = storageLimitBytes == null ? 0 : Math.max(billing.storageUsageBytes - storageLimitBytes, 0);

  return {
    targetPlanKey,
    targetPlanLabel: formatPlanLabel(targetPlanKey, targetBillingInterval),
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
  consequence: CompanyBillingPage.ChangeConsequence,
): string {
  if (consequence.timing === "immediate") {
    return `${consequence.targetPlanLabel} takes effect immediately.`;
  }

  const effectiveDate = formatDate(consequence.effectiveDate);
  if (effectiveDate) {
    return `${consequence.targetPlanLabel} takes effect at the next renewal on ${effectiveDate}.`;
  }

  return `${consequence.targetPlanLabel} takes effect at the next renewal.`;
}

export function buildCompanyBillingOverageDescription(consequence: CompanyBillingPage.ChangeConsequence) {
  const limitLabel = consequence.targetPlanLabel;
  const memberLimit = consequence.memberLimit;
  const storageLimitBytes = consequence.storageLimitBytes;

  let description: string | null = null;

  switch (consequence.overageKind) {
    case "member":
      description =
        memberLimit == null
          ? null
          : `After it takes effect, invites and restores may be blocked because the company has ${consequence.memberCount} active members and ${limitLabel} allows ${memberLimit}.`;
      break;

    case "storage":
      description =
        storageLimitBytes == null
          ? null
          : `After it takes effect, uploads may be blocked because the company is using ${formatStorageBytes(consequence.storageUsageBytes)} and ${limitLabel} allows ${formatStorageBytes(storageLimitBytes)}.`;
      break;

    case "member_and_storage":
      description =
        memberLimit == null || storageLimitBytes == null
          ? null
          : `After it takes effect, invites, restores, and uploads may be blocked because the company has ${consequence.memberCount} active members and is using ${formatStorageBytes(consequence.storageUsageBytes)}, while ${limitLabel} allows ${memberLimit} members and ${formatStorageBytes(storageLimitBytes)} of storage.`;
      break;

    default:
      description = null;
  }

  if (!description) return null;

  return description;
}

function findCurrentPlanDefinition(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.BillingPlanDefinition | null {
  if (billing.account.planKey) {
    return findPlanDefinition(billing.plans, billing.account.planKey);
  }

  if (billing.account.status === "free") {
    return findPlanDefinition(billing.plans, "free");
  }

  return null;
}

function findPlanDefinition(
  plans: CompanyBillingPage.BillingPlanDefinition[],
  key?: CompanyBillingPage.ChangeTargetPlan | null,
): CompanyBillingPage.BillingPlanDefinition | null {
  if (!key) return null;

  return plans.find((plan) => plan.key === key) || null;
}

function determineOverageKind(
  memberOverage: number,
  storageOverageBytes: number,
): CompanyBillingPage.OverageKind {
  if (memberOverage > 0 && storageOverageBytes > 0) return "member_and_storage";
  if (memberOverage > 0) return "member";
  if (storageOverageBytes > 0) return "storage";
  return "none";
}

function planTier(planKey: CompanyBillingPage.Plan): number {
  if (planKey === "business") return 2;
  return 1;
}

function formatPlanLabel(
  planKey?: CompanyBillingPage.ChangeTargetPlan | null,
  interval?: CompanyBillingPage.Interval | null,
): string {
  const name = formatPlanName(planKey);
  if (!interval || planKey === "free") {
    return name;
  }

  return `${name} ${interval === "monthly" ? "Monthly" : "Yearly"}`;
}

function formatPlanName(planKey?: CompanyBillingPage.ChangeTargetPlan | null): string {
  switch (planKey) {
    case "team":
      return "Team";
    case "business":
      return "Business";
    case "free":
      return "Free";
    default:
      return "Selected plan";
  }
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}
