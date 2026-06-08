import { CompanyBillingPage } from "./types";
import {
  formatStorageBytes,
  formatCompanyBillingDate,
  formatCompanyBillingIntervalLabel,
  formatCompanyBillingPlanLabel,
  formatCompanyBillingPlanName,
  formatCompanyBillingRelativeDateLine,
  getCompanyBillingCurrentPlanDefinition,
} from "../CompanyBilling";

export function buildCompanyBillingPageViewModel(props: CompanyBillingPage.Props): CompanyBillingPage.PageViewModel {
  if (props.isConfirmingCheckout) {
    return {
      pageTitle: "Billing",
      pageSubtitle: "Manage this company's plan, usage, and billing details.",
      mode: "confirming",
      confirming: buildCompanyBillingConfirmingMode(props.confirmingTarget || null),
    };
  }

  return {
    pageTitle: "Billing",
    pageSubtitle: "Manage this company's plan, usage, and billing details.",
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
  const currentPlan = getCompanyBillingCurrentPlanDefinition(args.billing);
  const currentPlanName =
    currentPlan?.displayName || formatCompanyBillingPlanName(args.billing.account.planKey, args.billing.account.status === "free" ? "Free" : "Unknown plan");

  return {
    stale: args.billing.stale,
    feedback: args.feedback,
    errorMessage: args.actionError,
    currentPlan: {
      name: currentPlanName,
      intervalLabel: formatCompanyBillingIntervalLabel(args.billing.account.billingInterval),
      status: args.billing.account.status,
      rows: compactRows([
        args.billing.account.billingInterval
          ? { label: "Billing interval", value: formatCompanyBillingIntervalLabel(args.billing.account.billingInterval) || "Unavailable" }
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
    return `${current} / Unlimited`;
  }

  return `${current} / ${limit}`;
}

function formatStorageUsage(current: number, limit?: number | null): string {
  if (limit == null) {
    return `${formatStorageBytes(current)} / Unlimited`;
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
      target ? { label: "Requested plan", value: formatCompanyBillingPlanLabel(target.plan, target.billingInterval) } : null,
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
        `We're waiting for checkout completion for ${formatCompanyBillingPlanLabel(billing.account.pendingPlanKey, billing.account.pendingBillingInterval)}.`,
        formatCompanyBillingRelativeDateLine("Checkout started", billing.account.pendingCheckoutStartedAt),
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
        `${formatCompanyBillingPlanLabel(billing.account.scheduledPlanKey, billing.account.scheduledBillingInterval)} will take effect at the next renewal.`,
        formatCompanyBillingRelativeDateLine("Effective on", billing.account.scheduledChangeEffectiveAt),
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
        formatCompanyBillingRelativeDateLine("The current subscription remains active until", billing.account.currentPeriodEnd) ||
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
      description: "Payment wasn't resolved in time. This company is now read-only, so collaborative work is paused until billing is updated.",
    });
  }

  if (billing.account.status === "past_due") {
    if (billing.account.accessStateReason !== "past_due") {
      notices.push({
        tone: "warning",
        message: "Payment issue detected",
        description: "Payment for this company is past due. Billing access may be affected until payment is resolved.",
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

function buildOverviewActions(args: BuildOverviewModeArgs): CompanyBillingPage.Action[] {
  const actions: CompanyBillingPage.Action[] = [];
  const isPaidCompany = args.billing.account.status === "active" || args.billing.account.status === "past_due";
  const pendingPlanLabel = args.billing.account.pendingPlanKey
    ? formatCompanyBillingPlanLabel(args.billing.account.pendingPlanKey, args.billing.account.pendingBillingInterval, "the pending plan")
    : "the pending plan";

  if (args.onCompleteUpgrade) {
    actions.push({
      label: "Complete upgrade",
      title: "Finish your upgrade",
      description: `Start checkout again for ${pendingPlanLabel}.`,
      kind: "featured",
      tone: "primary",
      onClick: args.onCompleteUpgrade,
    });
  }

  if (args.onSeePlans) {
    actions.push({
      label: "Change plan",
      title: isPaidCompany ? "Change plan" : "Choose a paid plan",
      description: isPaidCompany
        ? "Compare available plans and switch this company to a different subscription."
        : "Review paid plans and continue to checkout when you're ready.",
      kind: args.onCompleteUpgrade ? "support" : "featured",
      tone: args.onCompleteUpgrade ? "secondary" : "primary",
      onClick: args.onSeePlans,
    });
  }

  if (isPaidCompany && args.billing.account.cancelAtPeriodEnd && args.onReactivatePlan) {
    actions.push({
      label: "Keep current plan",
      title: "Keep current plan",
      description: "Remove the scheduled cancellation and keep this paid plan active.",
      kind: "recovery",
      tone: "secondary",
      onClick: args.onReactivatePlan,
    });
  }

  if (isPaidCompany && args.onUpdatePaymentMethod) {
    actions.push({
      label: "Update payment method",
      title: "Payment method",
      description: "Update the card used for renewals and payment recovery.",
      kind: "support",
      tone: "secondary",
      onClick: args.onUpdatePaymentMethod,
    });
  }

  if (isPaidCompany && args.onManageBilling) {
    actions.push({
      label: "View billing history",
      title: "Billing history",
      description: "Open invoices, receipts, and payment history for this company.",
      kind: "support",
      tone: "secondary",
      onClick: args.onManageBilling,
    });
  }

  if (isPaidCompany && !args.billing.account.cancelAtPeriodEnd && args.onCancelPlan) {
    actions.push({
      label: "Review cancellation",
      title: "Cancel plan",
      description: "See what will change before this company moves to the Free plan.",
      kind: "danger",
      tone: "danger",
      onClick: args.onCancelPlan,
    });
  }

  return actions;
}

function compactRows(rows: Array<CompanyBillingPage.DetailRow | null>): CompanyBillingPage.DetailRow[] {
  return rows.filter((row): row is CompanyBillingPage.DetailRow => row !== null);
}

function formatPeriodEndRow(account: CompanyBillingPage.BillingAccount): CompanyBillingPage.DetailRow | null {
  const formattedDate = formatCompanyBillingDate(account.currentPeriodEnd);
  if (!formattedDate) return null;

  if (account.cancelAtPeriodEnd || account.status === "canceled") {
    return { label: "Current period ends", value: formattedDate };
  }

  return { label: "Renews", value: formattedDate };
}

function paymentGraceDescription(value?: string | null): string {
  const formattedDate = formatCompanyBillingDate(value);

  if (!formattedDate) {
    return "Billing needs attention soon or this company will become read-only.";
  }

  return `Billing needs attention by ${formattedDate} or this company will become read-only.`;
}
