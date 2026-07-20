import { CompanyBillingCancellationPage } from "./types";
import {
  buildCompanyBillingChangeConsequence,
  buildCompanyBillingOverageDescription,
  findCompanyBillingPlanDefinition,
  formatCompanyBillingDate,
  formatCompanyBillingPlanName,
  formatStorageBytes,
} from "../CompanyBilling";

export function buildCompanyBillingCancellationPageViewModel(
  props: CompanyBillingCancellationPage.Props,
): CompanyBillingCancellationPage.PageViewModel {
  return {
    pageTitle: "Cancel plan",
    pageSubtitle: "See what will change before this company moves to the Free plan.",
    summary: buildCompanyBillingCancellationSummary(props.billing, props.limitsEnforced),
    errorMessage: props.actionError || null,
    cancelAction: {
      label: "Schedule cancellation",
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
  limitsEnforced: boolean,
): CompanyBillingCancellationPage.CancellationSummary {
  const currentPlan = findCompanyBillingPlanDefinition(billing.plans, billing.account.planKey);
  const currentPeriodEnd = formatCompanyBillingDate(billing.account.currentPeriodEnd);
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
        value: currentPlan?.displayName || formatCompanyBillingPlanName(billing.account.planKey, "Paid plan"),
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
      limitsEnforced && consequence.overageKind !== "none"
        ? {
            message: overLimitWarningMessage(consequence.overageKind),
            description: buildCompanyBillingOverageDescription(consequence) || "",
          }
        : null,
  };
}

function compactRows(
  rows: Array<CompanyBillingCancellationPage.DetailRow | null>,
): CompanyBillingCancellationPage.DetailRow[] {
  return rows.filter((row): row is CompanyBillingCancellationPage.DetailRow => row !== null);
}

function overLimitWarningMessage(overageKind: ReturnType<typeof buildCompanyBillingChangeConsequence>["overageKind"]) {
  switch (overageKind) {
    case "member":
      return "This company is above the Free plan member limit";
    case "storage":
      return "This company is above the Free plan storage limit";
    default:
      return "This company is above the Free plan limits";
  }
}

function noop() {}
