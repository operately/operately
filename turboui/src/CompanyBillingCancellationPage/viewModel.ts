import { CompanyBillingCancellationPage } from "./types";
import {
  buildCompanyBillingChangeConsequence,
  buildCompanyBillingOverageDescription,
  findCompanyBillingPlanDefinition,
  formatCompanyBillingDate,
  formatCompanyBillingPlanName,
  formatStorageBytes,
} from "../CompanyBilling";
import i18n, { translationText } from "../i18n";

export function buildCompanyBillingCancellationPageViewModel(
  props: CompanyBillingCancellationPage.Props,
): CompanyBillingCancellationPage.PageViewModel {
  return {
    pageTitle: i18n.t("Cancel plan"),
    pageSubtitle: i18n.t("See what will change before this company moves to the Free plan."),
    summary: buildCompanyBillingCancellationSummary(props.billing),
    errorMessage: props.actionError || null,
    cancelAction: {
      label: i18n.t("Schedule cancellation"),
      onClick: props.onCancelPlan || noop,
      loading: props.isSubmitting || false,
    },
    keepAction: {
      label: i18n.t("Keep current plan"),
      onClick: props.onKeepCurrentPlan || noop,
    },
  };
}

export function buildCompanyBillingCancellationSummary(
  billing: CompanyBillingCancellationPage.BillingOverview,
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
        label: i18n.t("Current plan"),
        value: currentPlan?.displayName || formatCompanyBillingPlanName(billing.account.planKey, translationText(i18n.t("Paid plan"))),
      },
      currentPeriodEnd ? { label: i18n.t("Paid access until"), value: currentPeriodEnd } : null,
      { label: i18n.t("Active members"), value: `${billing.memberCount}` },
      consequence.memberLimit != null ? { label: i18n.t("Free plan member limit"), value: `${consequence.memberLimit}` } : null,
      { label: i18n.t("Storage used"), value: formatStorageBytes(consequence.storageUsageBytes) },
      consequence.storageLimitBytes != null
        ? { label: i18n.t("Free plan storage limit"), value: formatStorageBytes(consequence.storageLimitBytes) }
        : null,
    ]),
    consequenceMessage: currentPeriodEnd
      ? i18n.t("This company will stay on its current paid plan until {{date}}.", { date: currentPeriodEnd })
      : i18n.t("This company will stay on its current paid plan until the end of the current billing period."),
    consequenceDescription: i18n.t("After that, the company will move to the Free plan."),
    overLimitWarning:
      consequence.overageKind !== "none"
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
      return i18n.t("This company is above the Free plan member limit");
    case "storage":
      return i18n.t("This company is above the Free plan storage limit");
    default:
      return i18n.t("This company is above the Free plan limits");
  }
}

function noop() {}
