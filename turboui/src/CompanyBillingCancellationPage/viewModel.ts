import { CompanyBillingCancellationPage } from "./types";
import {
  buildCompanyBillingChangeConsequence,
  buildCompanyBillingOverageDescription,
} from "../CompanyBillingPage/changeConsequences";
import { formatStorageBytes } from "../CompanyBillingPage/storageFormatting";

export function buildCompanyBillingCancellationPageViewModel(
  props: CompanyBillingCancellationPage.Props,
): CompanyBillingCancellationPage.PageViewModel {
  return {
    pageTitle: "Cancel plan",
    pageSubtitle: "Review what changes before this company moves back to the free plan.",
    summary: buildCompanyBillingCancellationSummary(props.billing),
    errorMessage: props.actionError || null,
    cancelAction: {
      label: "Cancel plan",
      onClick: props.onCancelPlan || noop,
      loading: props.isSubmitting || false,
    },
    keepAction: {
      label: "Keep current plan",
      onClick: props.onKeepCurrentPlan || noop,
    },
  };
}

export function buildCompanyBillingCancellationSummary(
  billing: CompanyBillingCancellationPage.BillingOverview,
): CompanyBillingCancellationPage.CancellationSummary {
  const currentPlan = findPlanDefinition(billing, billing.account.planKey);
  const currentPeriodEnd = formatDate(billing.account.currentPeriodEnd);
  const consequence = buildCompanyBillingChangeConsequence({
    billing,
    targetPlanKey: "free",
    timing: "next_renewal",
    effectiveDate: billing.account.currentPeriodEnd,
  });

  return {
    rows: compactRows([
      {
        label: "Current plan",
        value: currentPlan?.displayName || formatPlanName(billing.account.planKey, "Paid plan"),
      },
      currentPeriodEnd ? { label: "Paid access until", value: currentPeriodEnd } : null,
      { label: "Active members", value: `${billing.memberCount}` },
      consequence.memberLimit != null ? { label: "Free plan member limit", value: `${consequence.memberLimit}` } : null,
      { label: "Storage used", value: formatStorageBytes(consequence.storageUsageBytes) },
      consequence.storageLimitBytes != null
        ? { label: "Free plan storage limit", value: formatStorageBytes(consequence.storageLimitBytes) }
        : null,
    ]),
    consequenceMessage: currentPeriodEnd
      ? `This company will stay on its current paid plan until ${currentPeriodEnd}.`
      : "This company will stay on its current paid plan until the end of the current billing period.",
    consequenceDescription: "After that, the company will move to the Free plan.",
    overLimitWarning:
      consequence.overageKind !== "none"
        ? {
            message: overLimitWarningMessage(consequence.overageKind),
            description: buildCompanyBillingOverageDescription(consequence) || "",
          }
        : null,
  };
}

function findPlanDefinition(
  billing: CompanyBillingCancellationPage.BillingOverview,
  key?: string | null,
) {
  if (!key) return null;

  return billing.plans.find((plan) => plan.key === key) || null;
}

function compactRows(
  rows: Array<CompanyBillingCancellationPage.DetailRow | null>,
): CompanyBillingCancellationPage.DetailRow[] {
  return rows.filter((row): row is CompanyBillingCancellationPage.DetailRow => row !== null);
}

function formatPlanName(planKey?: string | null, fallback = "Unknown plan"): string {
  if (!planKey) return fallback;

  const planNames: Record<string, string> = {
    free: "Free",
    team: "Team",
    business: "Business",
  };

  return planNames[planKey] || fallback;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function overLimitWarningMessage(overageKind: ReturnType<typeof buildCompanyBillingChangeConsequence>["overageKind"]) {
  switch (overageKind) {
    case "member":
      return "This company is above the free plan member limit";
    case "storage":
      return "This company is above the free plan storage limit";
    default:
      return "This company is above the free plan limits";
  }
}

function noop() {}
