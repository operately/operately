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
import i18n, { translationText } from "../i18n";

export function buildCompanyBillingPageViewModel(props: CompanyBillingPage.Props): CompanyBillingPage.PageViewModel {
  if (props.isConfirmingCheckout) {
    return {
      pageTitle: i18n.t("Billing"),
      pageSubtitle: i18n.t("Manage this company's plan, usage, and billing details."),
      mode: "confirming",
      confirming: buildCompanyBillingConfirmingMode(props.confirmingTarget || null),
    };
  }

  return {
    pageTitle: i18n.t("Billing"),
    pageSubtitle: i18n.t("Manage this company's plan, usage, and billing details."),
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
    currentPlan?.displayName || formatCompanyBillingPlanName(args.billing.account.planKey, args.billing.account.status === "free" ? translationText(i18n.t("Free")) : translationText(i18n.t("Unknown plan")));

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
          ? { label: i18n.t("Billing interval"), value: formatCompanyBillingIntervalLabel(args.billing.account.billingInterval) || i18n.t("Unavailable") }
          : null,
        formatPeriodEndRow(args.billing.account),
      ]),
    },
    usageRows: [
      { label: i18n.t("Active members"), value: formatCountUsage(args.billing.memberCount, currentPlan?.memberLimit) },
      { label: i18n.t("Storage used"), value: formatStorageUsage(args.billing.storageUsageBytes, currentPlan?.storageLimitBytes) },
    ],
    statusNotices: buildCompanyBillingStatusNotices(args.billing),
    actions: buildOverviewActions(args),
    emptyStatusMessage: translationText(i18n.t("No pending billing changes.")),
  };
}

function formatCountUsage(current: number, limit?: number | null): string {
  if (limit == null) {
    return i18n.t("{{current}} / Unlimited", { current });
  }

  return `${current} / ${limit}`;
}

function formatStorageUsage(current: number, limit?: number | null): string {
  if (limit == null) {
    return i18n.t("{{current}} / Unlimited", { current: formatStorageBytes(current) });
  }

  return `${formatStorageBytes(current)} / ${formatStorageBytes(limit)}`;
}

export function buildCompanyBillingConfirmingMode(
  target: CompanyBillingPage.BillingTarget | null,
): CompanyBillingPage.ConfirmingModeView {
  return {
    notice: {
      tone: "info",
      message: i18n.t("Confirming your upgrade"),
      description: i18n.t("We're waiting for your upgrade to finish. This page will update automatically when your new plan becomes active."),
    },
    rows: compactRows([
      target ? { label: i18n.t("Requested plan"), value: formatCompanyBillingPlanLabel(target.plan, target.billingInterval) } : null,
      { label: i18n.t("Status"), value: i18n.t("We're waiting for your new plan to become active.") },
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
        message: i18n.t("Checkout in progress"),
        description: [
          i18n.t("We're waiting for checkout completion for {{plan}}.", {
            plan: formatCompanyBillingPlanLabel(billing.account.pendingPlanKey, billing.account.pendingBillingInterval),
          }),
          formatCompanyBillingRelativeDateLine(
            (date) => i18n.t("Checkout started: {{date}}.", { date }),
            billing.account.pendingCheckoutStartedAt,
          ),
        ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (billing.account.scheduledPlanKey) {
    notices.push({
      tone: "info",
        message: i18n.t("Scheduled plan change"),
        description: [
          i18n.t("{{plan}} will take effect at the next renewal.", {
            plan: formatCompanyBillingPlanLabel(billing.account.scheduledPlanKey, billing.account.scheduledBillingInterval),
          }),
          formatCompanyBillingRelativeDateLine(
            (date) => i18n.t("Effective on: {{date}}.", { date }),
            billing.account.scheduledChangeEffectiveAt,
          ),
        ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (billing.account.cancelAtPeriodEnd) {
    notices.push({
      tone: "warning",
        message: i18n.t("Cancellation scheduled"),
        description:
          formatCompanyBillingRelativeDateLine(
            (date) => i18n.t("The current subscription remains active until: {{date}}.", { date }),
            billing.account.currentPeriodEnd,
          ) ||
          i18n.t("The current subscription will end at the close of the current billing period."),
    });
  }

  if (billing.account.accessStateReason === "past_due" && billing.account.accessState === "payment_grace") {
    notices.push({
      tone: "danger",
        message: i18n.t("Payment issue requires attention"),
      description: paymentGraceDescription(billing.account.accessStateEndsAt),
    });
  }

  if (billing.account.accessStateReason === "past_due" && billing.account.accessState === "read_only") {
    notices.push({
      tone: "danger",
        message: i18n.t("This company is read-only"),
        description: i18n.t("Payment wasn't resolved in time. This company is now read-only, so collaborative work is paused until billing is updated."),
    });
  }

  if (billing.account.status === "past_due") {
    if (billing.account.accessStateReason !== "past_due") {
      notices.push({
        tone: "warning",
          message: i18n.t("Payment issue detected"),
          description: i18n.t("Payment for this company is past due. Billing access may be affected until payment is resolved."),
      });
    }
  }

  if (billing.account.status === "canceled") {
    notices.push({
      tone: "warning",
        message: i18n.t("Subscription ended"),
        description: i18n.t("This company is no longer on an active paid subscription."),
    });
  }

  if (billing.account.status === "free" && notices.length === 0) {
    notices.push({
      tone: "info",
        message: i18n.t("Free plan"),
        description: i18n.t("This company is currently using the free plan."),
    });
  }

  return notices;
}

function buildOverviewActions(args: BuildOverviewModeArgs): CompanyBillingPage.Action[] {
  const actions: CompanyBillingPage.Action[] = [];
  const isPaidCompany = args.billing.account.status === "active" || args.billing.account.status === "past_due";
  const pendingPlanLabel = args.billing.account.pendingPlanKey
    ? formatCompanyBillingPlanLabel(args.billing.account.pendingPlanKey, args.billing.account.pendingBillingInterval, translationText(i18n.t("the pending plan")))
    : translationText(i18n.t("the pending plan"));

  if (args.onCompleteUpgrade) {
    actions.push({
      label: i18n.t("Complete upgrade"),
      title: i18n.t("Finish your upgrade"),
      description: i18n.t("Start checkout again for {{plan}}.", { plan: pendingPlanLabel }),
      kind: "featured",
      tone: "primary",
      onClick: args.onCompleteUpgrade,
    });
  }

  if (args.onSeePlans) {
    actions.push({
      label: i18n.t("Change plan"),
      title: isPaidCompany ? i18n.t("Change plan") : i18n.t("Choose a paid plan"),
      description: isPaidCompany
        ? i18n.t("Compare available plans and switch this company to a different subscription.")
        : i18n.t("Review paid plans and continue to checkout when you're ready."),
      kind: args.onCompleteUpgrade ? "support" : "featured",
      tone: args.onCompleteUpgrade ? "secondary" : "primary",
      onClick: args.onSeePlans,
    });
  }

  if (isPaidCompany && args.billing.account.cancelAtPeriodEnd && args.onReactivatePlan) {
    actions.push({
      label: i18n.t("Keep current plan"),
      title: i18n.t("Keep current plan"),
      description: i18n.t("Remove the scheduled cancellation and keep this paid plan active."),
      kind: "recovery",
      tone: "secondary",
      onClick: args.onReactivatePlan,
    });
  }

  if (isPaidCompany && args.onUpdatePaymentMethod) {
    actions.push({
      label: i18n.t("Update payment method"),
      title: i18n.t("Payment method"),
      description: i18n.t("Update the card used for renewals and payment recovery."),
      kind: "support",
      tone: "secondary",
      onClick: args.onUpdatePaymentMethod,
    });
  }

  if (isPaidCompany && args.onManageBilling) {
    actions.push({
      label: i18n.t("View billing history"),
      title: i18n.t("Billing history"),
      description: i18n.t("Open invoices, receipts, and payment history for this company."),
      kind: "support",
      tone: "secondary",
      onClick: args.onManageBilling,
    });
  }

  if (isPaidCompany && !args.billing.account.cancelAtPeriodEnd && args.onCancelPlan) {
    actions.push({
      label: i18n.t("Review cancellation"),
      title: i18n.t("Cancel plan"),
      description: i18n.t("See what will change before this company moves to the Free plan."),
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
    return { label: i18n.t("Current period ends"), value: formattedDate };
  }

  return { label: i18n.t("Renews"), value: formattedDate };
}

function paymentGraceDescription(value?: string | null): string {
  const formattedDate = formatCompanyBillingDate(value);

  if (!formattedDate) {
    return i18n.t("Billing needs attention soon or this company will become read-only.");
  }

  return i18n.t("Billing needs attention by {{date}} or this company will become read-only.", { date: formattedDate });
}
