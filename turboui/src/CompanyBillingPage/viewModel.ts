import { CompanyBillingPage } from "./types";
import { formatStorageBytes } from "./storageFormatting";

export function buildCompanyBillingPageViewModel(props: CompanyBillingPage.Props): CompanyBillingPage.PageViewModel {
  if (props.isConfirmingCheckout) {
    return {
      pageTitle: "Billing",
      pageSubtitle: "Review the current subscription state for this company.",
      mode: "confirming",
      confirming: buildCompanyBillingConfirmingMode(props.confirmingTarget || null),
    };
  }

  return {
    pageTitle: "Billing",
    pageSubtitle: "Review the current subscription state for this company.",
    headerAction: props.onRefreshBilling ? { label: "Refresh billing", onClick: props.onRefreshBilling } : null,
    mode: "overview",
    overview: buildCompanyBillingOverviewMode({
      billing: props.billing,
      feedback: props.feedback || null,
      actionError: props.actionError || null,
      onSeePlans: props.onOpenSelection || null,
      onCompleteUpgrade: props.onCompleteUpgrade || null,
      onCancelPlan: props.onCancelPlan || null,
      onReactivatePlan: props.onReactivatePlan || null,
      onUpdatePaymentMethod: props.onUpdatePaymentMethod || null,
      onManageBilling: props.onManageBilling || null,
    }),
  };
}

interface BuildOverviewModeArgs {
  billing: CompanyBillingPage.BillingOverview;
  feedback: CompanyBillingPage.Feedback | null;
  actionError: string | null;
  onSeePlans: (() => void) | null;
  onCompleteUpgrade: (() => void) | null;
  onCancelPlan: (() => void) | null;
  onReactivatePlan: (() => void) | null;
  onUpdatePaymentMethod: (() => void) | null;
  onManageBilling: (() => void) | null;
}

export function buildCompanyBillingOverviewMode(args: BuildOverviewModeArgs): CompanyBillingPage.OverviewModeView {
  const currentPlan = findCurrentPlanDefinition(args.billing);
  const currentPlanName =
    currentPlan?.displayName || formatPlanName(args.billing.account.planKey, args.billing.account.status === "free" ? "Free" : "Unknown plan");

  return {
    stale: args.billing.stale,
    feedback: args.feedback,
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
      { label: "Active members", value: formatCountUsage(args.billing.memberCount, currentPlan?.memberLimit) },
      { label: "Storage used", value: formatStorageUsage(args.billing.storageUsageBytes, currentPlan?.storageLimitBytes) },
    ],
    statusNotices: buildCompanyBillingStatusNotices(args.billing),
    actions: buildOverviewActions(args),
    emptyStatusMessage: "No pending billing changes.",
  };
}

function formatCountUsage(current: number, limit?: number | null): string {
  if (limit == null) {
    return `${current} / Unavailable`;
  }

  return `${current} / ${limit}`;
}

function formatStorageUsage(current: number, limit?: number | null): string {
  if (limit == null) {
    return `${formatStorageBytes(current)} / Unavailable`;
  }

  return `${formatStorageBytes(current)} / ${formatStorageBytes(limit)}`;
}

export function buildCompanyBillingConfirmingMode(
  target: CompanyBillingPage.BillingTarget | null,
): CompanyBillingPage.ConfirmingModeView {
  return {
    notice: {
      tone: "info",
      message: "Confirming your upgrade",
      description: "We're waiting for your upgrade to finish. This page will update automatically when your new plan becomes active.",
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

  if (billing.account.accessStateReason === "past_due" && billing.account.accessState === "payment_grace") {
    notices.push({
      tone: "danger",
      message: "Payment issue requires attention",
      description: paymentGraceDescription(billing.account.accessStateEndsAt),
    });
  }

  if (billing.account.accessStateReason === "past_due" && billing.account.accessState === "read_only") {
    notices.push({
      tone: "danger",
      message: "This company is read-only",
      description: "This company is read-only because payment was not resolved in time. Collaborative work is blocked until an admin resolves the payment issue.",
    });
  }

  if (billing.account.status === "past_due") {
    if (billing.account.accessStateReason !== "past_due") {
      notices.push({
        tone: "warning",
        message: "Payment issue detected",
        description: "Polar reports this subscription as past due. Billing access may be affected until payment is resolved.",
      });
    }
  }

  if (billing.account.status === "canceled") {
    notices.push({
      tone: "warning",
      message: "Subscription ended",
      description: "This company is no longer on an active paid subscription.",
    });
  }

  if (billing.account.status === "free" && notices.length === 0) {
    notices.push({
      tone: "info",
      message: "Free plan",
      description: "This company is currently using the free plan.",
    });
  }

  return notices;
}

export function buildCompanyBillingSuccessFeedback(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.Feedback {
  return {
    kind: "success",
    message: "Upgrade confirmed",
    description: `This company is now on ${formatPlanLabel(billing.account.planKey, billing.account.billingInterval, "its new paid plan")}.`,
  };
}

export function buildCompanyBillingRecoveryFeedback(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.Feedback {
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

export function buildCompanyBillingPlanChangeFeedback(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.Feedback {
  if (billing.account.scheduledPlanKey) {
    const planLabel = formatPlanLabel(
      billing.account.scheduledPlanKey,
      billing.account.scheduledBillingInterval,
      "the new plan",
    );
    const effectiveDate = formatDate(billing.account.scheduledChangeEffectiveAt);

    return {
      kind: "success",
      message: "Plan change scheduled",
      description: effectiveDate
        ? `${planLabel} will take effect at the next renewal on ${effectiveDate}.`
        : `${planLabel} will take effect at the next renewal.`,
    };
  }

  return {
    kind: "success",
    message: "Plan updated",
    description: `This company is now on ${formatPlanLabel(billing.account.planKey, billing.account.billingInterval, "its new plan")}.`,
  };
}

export function buildCompanyBillingCancellationFeedback(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.Feedback {
  const endDate = formatDate(billing.account.currentPeriodEnd);

  return {
    kind: "success",
    message: "Cancellation scheduled",
    description: endDate
      ? `This company will stay on its current paid plan until ${endDate}.`
      : "This company will stay on its current paid plan until the end of the current billing period.",
  };
}

export function buildCompanyBillingReactivationFeedback(
  billing: CompanyBillingPage.BillingOverview,
): CompanyBillingPage.Feedback {
  return {
    kind: "success",
    message: "Plan reactivated",
    description: `This company will remain on ${formatPlanLabel(billing.account.planKey, billing.account.billingInterval, "its current paid plan")}.`,
  };
}

function buildOverviewActions(args: BuildOverviewModeArgs): CompanyBillingPage.Action[] {
  const actions: CompanyBillingPage.Action[] = [];
  const isPaidCompany = args.billing.account.status === "active" || args.billing.account.status === "past_due";
  const pendingPlanLabel = args.billing.account.pendingPlanKey
    ? formatPlanLabel(args.billing.account.pendingPlanKey, args.billing.account.pendingBillingInterval, "the pending plan")
    : "the pending plan";

  if (args.onCompleteUpgrade) {
    actions.push({
      label: "Complete upgrade",
      title: "Finish your upgrade",
      description: `Start a fresh Polar checkout for ${pendingPlanLabel}.`,
      kind: "featured",
      tone: "primary",
      onClick: args.onCompleteUpgrade,
    });
  }

  if (args.onSeePlans) {
    actions.push({
      label: "Switch Plan",
      title: isPaidCompany ? "Change plan" : "Choose a paid plan",
      description: isPaidCompany
        ? "Compare available plans and switch this company to a different subscription."
        : "Review Team and Business plans and continue to checkout when you're ready.",
      kind: args.onCompleteUpgrade ? "support" : "featured",
      tone: args.onCompleteUpgrade ? "secondary" : "primary",
      onClick: args.onSeePlans,
    });
  }

  if (isPaidCompany && args.billing.account.cancelAtPeriodEnd && args.onReactivatePlan) {
    actions.push({
      label: "Reactivate plan",
      title: "Keep the current plan",
      description: "Remove the scheduled cancellation and keep this paid plan active.",
      kind: "recovery",
      tone: "secondary",
      onClick: args.onReactivatePlan,
    });
  }

  if (isPaidCompany && args.onUpdatePaymentMethod) {
    actions.push({
      label: "Update credit card",
      title: "Payment method",
      description: "Update the card used for renewals and payment recovery.",
      kind: "support",
      tone: "secondary",
      onClick: args.onUpdatePaymentMethod,
    });
  }

  if (isPaidCompany && args.onManageBilling) {
    actions.push({
      label: "Manage billing",
      title: "Invoices and billing history",
      description: "Open Polar for invoices, receipts, and full billing details.",
      kind: "support",
      tone: "secondary",
      onClick: args.onManageBilling,
    });
  }

  if (isPaidCompany && !args.billing.account.cancelAtPeriodEnd && args.onCancelPlan) {
    actions.push({
      label: "Cancel plan",
      title: "Cancel subscription",
      description: "Schedule this subscription to end at the close of the current billing period.",
      kind: "danger",
      tone: "danger",
      onClick: args.onCancelPlan,
    });
  }

  return actions;
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

function paymentGraceDescription(value?: string | null): string {
  const formattedDate = formatDate(value);

  if (!formattedDate) {
    return "Payment must be resolved soon or this company will switch to read-only mode.";
  }

  return `Payment must be resolved by ${formattedDate} or this company will switch to read-only mode.`;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}
