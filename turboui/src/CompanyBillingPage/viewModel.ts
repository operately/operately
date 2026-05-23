import { CompanyBillingPage } from "./types";
export function buildCompanyBillingPageViewModel(props: CompanyBillingPage.Props): CompanyBillingPage.PageViewModel {
  if (props.isConfirmingCheckout) {
    return {
      pageTitle: "Billing",
      pageSubtitle: "Review the current subscription state for this workspace.",
      mode: "confirming",
      confirming: buildCompanyBillingConfirmingMode(props.confirmingTarget || null),
    };
  }

  return {
    pageTitle: "Billing",
    pageSubtitle: "Review the current subscription state for this workspace.",
    mode: "overview",
    overview: buildCompanyBillingOverviewMode({
      billing: props.billing,
      checkoutFeedback: props.checkoutFeedback || null,
      actionError: props.actionError || null,
      onSeePlans: props.onOpenSelection || null,
      onCompleteUpgrade: props.onCompleteUpgrade || null,
    }),
  };
}

interface BuildOverviewModeArgs {
  billing: CompanyBillingPage.BillingOverview;
  checkoutFeedback: CompanyBillingPage.CheckoutFeedback | null;
  actionError: string | null;
  onSeePlans: (() => void) | null;
  onCompleteUpgrade: (() => void) | null;
}

export function buildCompanyBillingOverviewMode(args: BuildOverviewModeArgs): CompanyBillingPage.OverviewModeView {
  const currentPlan = findCurrentPlanDefinition(args.billing);
  const currentPlanName =
    currentPlan?.displayName || formatPlanName(args.billing.account.planKey, args.billing.account.status === "free" ? "Free" : "Unknown plan");

  return {
    stale: args.billing.stale,
    checkoutFeedback: args.checkoutFeedback,
    errorMessage: args.actionError,
    currentPlan: {
      name: currentPlanName,
      intervalLabel: formatIntervalLabel(args.billing.account.billingInterval),
      status: args.billing.account.status,
      rows: compactRows([
        args.billing.account.billingInterval
          ? { label: "Billing interval", value: formatIntervalLabel(args.billing.account.billingInterval) || "Unavailable" }
          : null,
        formatPeriodEndRow(args.billing.account),
      ]),
    },
    usageRows: [
      { label: "Active members", value: `${args.billing.memberCount}` },
      { label: "Member limit", value: currentPlan?.memberLimit ? `${currentPlan.memberLimit}` : "Unavailable" },
    ],
    statusNotices: buildCompanyBillingStatusNotices(args.billing),
    emptyStatusMessage: "No pending billing changes.",
    footerAction: args.onCompleteUpgrade
      ? { label: "Complete upgrade", tone: "primary", onClick: args.onCompleteUpgrade }
      : args.onSeePlans
        ? { label: "Switch Plan", tone: "primary", onClick: args.onSeePlans }
        : null,
  };
}

export function buildCompanyBillingConfirmingMode(
  target: CompanyBillingPage.BillingTarget | null,
): CompanyBillingPage.ConfirmingModeView {
  return {
    notice: {
      tone: "info",
      message: "Confirming your upgrade",
      description: "We're waiting for your upgrade to finish. This usually takes just a few seconds.",
    },
    rows: compactRows([
      target ? { label: "Requested plan", value: formatPlanLabel(target.plan, target.billingInterval) } : null,
      { label: "Status", value: "We're waiting for your new plan to become active." },
    ]),
  };
}

export function buildCompanyBillingStatusNotices(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.Notice[] {
  const notices: CompanyBillingPage.Notice[] = [];

  if (billing.account.pendingPlanKey) {
    notices.push({
      tone: "info",
      message: "Checkout in progress",
      description: [
        `We're waiting for checkout completion for ${formatPlanLabel(billing.account.pendingPlanKey, billing.account.pendingBillingInterval)}.`,
        formatRelativeDateLine("Checkout started", billing.account.pendingCheckoutStartedAt),
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (billing.account.scheduledPlanKey) {
    notices.push({
      tone: "info",
      message: "Scheduled plan change",
      description: [
        `${formatPlanLabel(billing.account.scheduledPlanKey, billing.account.scheduledBillingInterval)} will take effect at the next renewal.`,
        formatRelativeDateLine("Effective on", billing.account.scheduledChangeEffectiveAt),
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (billing.account.cancelAtPeriodEnd) {
    notices.push({
      tone: "warning",
      message: "Cancellation scheduled",
      description:
        formatRelativeDateLine("The current subscription remains active until", billing.account.currentPeriodEnd) ||
        "The current subscription will end at the close of the current billing period.",
    });
  }

  if (billing.account.status === "past_due") {
    notices.push({
      tone: "warning",
      message: "Payment issue detected",
      description: "Polar reports this subscription as past due. Billing access may be affected until payment is resolved.",
    });
  }

  if (billing.account.status === "canceled") {
    notices.push({
      tone: "warning",
      message: "Subscription ended",
      description: "This workspace is no longer on an active paid subscription.",
    });
  }

  if (billing.account.status === "free" && notices.length === 0) {
    notices.push({
      tone: "info",
      message: "Free plan",
      description: "This workspace is currently using the free plan.",
    });
  }

  return notices;
}

export function buildCompanyBillingSuccessFeedback(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.CheckoutFeedback {
  return {
    kind: "success",
    message: "Upgrade confirmed",
    description: `This workspace is now on ${formatPlanLabel(billing.account.planKey, billing.account.billingInterval, "its new paid plan")}.`,
  };
}

export function buildCompanyBillingRecoveryFeedback(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.CheckoutFeedback {
  if (billing.account.pendingPlanKey) {
    return {
      kind: "pending",
      message: "Checkout not completed yet",
      description: `You can start a fresh Polar checkout for ${formatPlanLabel(billing.account.pendingPlanKey, billing.account.pendingBillingInterval)}.`,
    };
  }

  return {
    kind: "incomplete",
    message: "Checkout not completed",
    description: "We couldn't confirm a completed checkout. You can safely return to plan selection and try again.",
  };
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
  key?: string | null,
): CompanyBillingPage.BillingPlanDefinition | null {
  if (!key) return null;

  return plans.find((plan) => plan.key === key) || null;
}

function compactRows(rows: Array<CompanyBillingPage.DetailRow | null>): CompanyBillingPage.DetailRow[] {
  return rows.filter((row): row is CompanyBillingPage.DetailRow => row !== null);
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

function formatIntervalLabel(interval?: CompanyBillingPage.Interval | null): string | null {
  if (!interval) return null;

  return interval === "monthly" ? "Monthly" : "Yearly";
}

function formatPlanLabel(
  planKey?: string | null,
  interval?: CompanyBillingPage.Interval | null,
  fallback = "Unknown plan",
): string {
  const name = formatPlanName(planKey, fallback);
  const intervalLabel = formatIntervalLabel(interval);

  return intervalLabel ? `${name} ${intervalLabel}` : name;
}

function formatPeriodEndRow(account: CompanyBillingPage.BillingAccount): CompanyBillingPage.DetailRow | null {
  const formattedDate = formatDate(account.currentPeriodEnd);
  if (!formattedDate) return null;

  if (account.cancelAtPeriodEnd || account.status === "canceled") {
    return { label: "Current period ends", value: formattedDate };
  }

  return { label: "Renews", value: formattedDate };
}

function formatRelativeDateLine(prefix: string, value?: string | null): string | null {
  const formattedDate = formatDate(value);
  if (!formattedDate) return null;

  return `${prefix}: ${formattedDate}.`;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}
