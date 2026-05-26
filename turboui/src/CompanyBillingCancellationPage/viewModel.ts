import { CompanyBillingCancellationPage } from "./types";

export function buildCompanyBillingCancellationPageViewModel(
  props: CompanyBillingCancellationPage.Props,
): CompanyBillingCancellationPage.PageViewModel {
  return {
    pageTitle: "Cancel plan",
    pageSubtitle: "Review what changes before this workspace moves back to the free plan.",
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
  const freePlan = findPlanDefinition(billing, "free");
  const currentPlan = findPlanDefinition(billing, billing.account.planKey);
  const freePlanMemberLimit = freePlan?.memberLimit || null;
  const memberOverage = freePlanMemberLimit == null ? 0 : Math.max(billing.memberCount - freePlanMemberLimit, 0);
  const currentPeriodEnd = formatDate(billing.account.currentPeriodEnd);

  return {
    rows: compactRows([
      {
        label: "Current plan",
        value: currentPlan?.displayName || formatPlanName(billing.account.planKey, "Paid plan"),
      },
      currentPeriodEnd ? { label: "Paid access until", value: currentPeriodEnd } : null,
      { label: "Active members", value: `${billing.memberCount}` },
      freePlanMemberLimit != null ? { label: "Free plan member limit", value: `${freePlanMemberLimit}` } : null,
    ]),
    consequenceMessage: currentPeriodEnd
      ? `This workspace will stay on its current paid plan until ${currentPeriodEnd}.`
      : "This workspace will stay on its current paid plan until the end of the current billing period.",
    consequenceDescription:
      memberOverage > 0
        ? `It will move to the Free plan after that. Invites and restores may be blocked until the workspace is back within the free member limit.`
        : "After that, the workspace will move to the Free plan.",
    overLimitWarning:
      memberOverage > 0 && freePlanMemberLimit != null
        ? `This workspace has ${billing.memberCount} active members and the Free plan allows ${freePlanMemberLimit}.`
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

function noop() {}
