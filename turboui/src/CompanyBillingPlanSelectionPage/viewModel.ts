import {
  findCompanyBillingSellableProduct,
  getCompanyBillingCurrentTarget,
  getCompanyBillingScheduledTarget,
  isCompanyBillingPaidStatus,
  matchesCompanyBillingTarget,
  formatCompanyBillingPlanName,
  formatCompanyBillingPriceFromMinorUnits,
} from "../CompanyBilling";
import {
  buildCompanyBillingChangeConsequence,
  buildCompanyBillingOverageDescription,
  formatCompanyBillingChangeTimingDescription,
  resolveCompanyBillingChangeTiming,
} from "../CompanyBilling";
import { findCompanyBillingPlanDefinition, formatStorageBytes } from "../CompanyBilling";
import { CompanyBillingPlanSelectionPage } from "./types";

export function buildCompanyBillingPlanSelectionPageViewModel(
  props: CompanyBillingPlanSelectionPage.Props,
): CompanyBillingPlanSelectionPage.PageViewModel {
  const selection = buildCompanyBillingPlanSelectionMode({
    billing: props.billing,
    selection: props.selection,
    actionError: props.actionError || null,
    isSubmitting: props.isSubmitting || false,
    onSelectPlan: props.onSelectPlan || noop,
    onSelectInterval: props.onSelectInterval || noop,
    onSubmit: props.onSubmit || noop,
  });

  return {
    pageTitle: "Choose a plan",
    pageSubtitle:
      selection.mode === "change_plan"
        ? "Choose a new plan for this company."
        : "Choose a paid plan for this company. Payment details are handled at checkout.",
    selection,
  };
}

interface BuildSelectionModeArgs {
  billing: CompanyBillingPlanSelectionPage.BillingOverview;
  selection: CompanyBillingPlanSelectionPage.BillingTargetSelection;
  actionError: string | null;
  isSubmitting: boolean;
  onSelectPlan: (plan: CompanyBillingPlanSelectionPage.Plan) => void;
  onSelectInterval: (interval: CompanyBillingPlanSelectionPage.Interval) => void;
  onSubmit: () => void;
}

export function buildCompanyBillingPlanSelectionMode(
  args: BuildSelectionModeArgs,
): CompanyBillingPlanSelectionPage.SelectionModeView {
  const mode: CompanyBillingPlanSelectionPage.Mode = isCompanyBillingPaidStatus(args.billing.account.status) ? "change_plan" : "checkout";
  const selectedTarget = args.selection.target || findFallbackSelectionTarget(args.billing, mode);
  const selectedInterval = selectedTarget?.billingInterval || "monthly";

  return {
    mode,
    errorMessage: args.actionError,
    selectedInterval,
    onSelectInterval: args.onSelectInterval,
    cards: (["team", "business", "unlimited"] as CompanyBillingPlanSelectionPage.Plan[]).map((plan) => {
      const definition = findCompanyBillingPlanDefinition(args.billing.plans, plan);
      const product = findCompanyBillingSellableProduct(args.billing.catalogProducts, plan, selectedInterval);

      return {
        key: `${plan}-${selectedInterval}`,
        title: definition?.displayName || formatCompanyBillingPlanName(plan),
        priceLabel: formatPlanPriceLabel(product, selectedInterval),
        detailLines: [
          formatMemberLimitLine(definition?.memberLimit),
          formatStorageLimitLine(definition?.storageLimitBytes),
          formatBillingHint(product, selectedInterval),
        ],
        selected: selectedTarget?.plan === plan,
        suggested: args.billing.account.suggestedPlanKey === plan,
        disabled: !product,
        onSelect: () => args.onSelectPlan(plan),
        testId: `billing-plan-card-${plan}-${selectedInterval}`,
      };
    }),
    consequenceNotice: buildSelectionConsequenceNotice(args.billing, mode, selectedTarget),
    continueAction: {
      label: mode === "change_plan" ? "Change plan" : "Continue to checkout",
      tone: "primary",
      onClick: args.onSubmit,
      disabled: !selectedTarget?.product || (mode === "change_plan" && isCurrentOrScheduledSelection(args.billing, selectedTarget)),
      loading: args.isSubmitting,
    },
  };
}

function findFallbackSelectionTarget(
  billing: CompanyBillingPlanSelectionPage.BillingOverview,
  mode: CompanyBillingPlanSelectionPage.Mode,
): CompanyBillingPlanSelectionPage.BillingTarget | null {
  if (mode === "change_plan") {
    return getCompanyBillingScheduledTarget(billing) || getCompanyBillingCurrentTarget(billing);
  }

  return findSuggestedSelectionTarget(billing);
}

function isCurrentOrScheduledSelection(
  billing: CompanyBillingPlanSelectionPage.BillingOverview,
  target: CompanyBillingPlanSelectionPage.BillingTarget,
): boolean {
  const currentTarget = getCompanyBillingCurrentTarget(billing);
  if (matchesCompanyBillingTarget(billing.account, target) || (currentTarget && matchesTarget(target, currentTarget))) {
    return true;
  }

  const scheduledTarget = getCompanyBillingScheduledTarget(billing);
  return scheduledTarget ? matchesTarget(target, scheduledTarget) : false;
}

function buildSelectionConsequenceNotice(
  billing: CompanyBillingPlanSelectionPage.BillingOverview,
  mode: CompanyBillingPlanSelectionPage.Mode,
  selectedTarget: CompanyBillingPlanSelectionPage.BillingTarget | null,
): CompanyBillingPlanSelectionPage.ConsequenceNotice | null {
  if (mode !== "change_plan" || !selectedTarget) return null;

  const currentTarget = getCompanyBillingCurrentTarget(billing);
  if (currentTarget && matchesTarget(selectedTarget, currentTarget)) return null;

  const timing = resolveCompanyBillingChangeTiming(currentTarget, selectedTarget);
  if (!timing) return null;

  const consequence = buildCompanyBillingChangeConsequence({
    billing,
    targetPlanKey: selectedTarget.plan,
    targetBillingInterval: selectedTarget.billingInterval,
    timing,
    effectiveDate: timing === "next_renewal" ? billing.account.currentPeriodEnd : null,
  });

  const rows = consequence.overageKind !== "none" ? buildConsequenceRows(consequence) : [];
  const overageDescription = buildCompanyBillingOverageDescription(consequence);

  return {
    tone: consequence.overageKind === "none" ? "info" : "warning",
    message: formatCompanyBillingChangeTimingDescription(consequence),
    description: overageDescription || "",
    rows,
  };
}

function matchesTarget(
  left: CompanyBillingPlanSelectionPage.BillingTarget,
  right: CompanyBillingPlanSelectionPage.BillingTarget,
): boolean {
  return left.plan === right.plan && left.billingInterval === right.billingInterval;
}

function findSuggestedSelectionTarget(
  billing: CompanyBillingPlanSelectionPage.BillingOverview,
): CompanyBillingPlanSelectionPage.BillingTarget | null {
  const suggestedPlan = billing.account.suggestedPlanKey;
  if (!suggestedPlan) return null;

  const suggestedInterval = billing.account.suggestedBillingInterval;

  if (suggestedInterval) {
    const product = findCompanyBillingSellableProduct(billing.catalogProducts, suggestedPlan, suggestedInterval);
    if (product) {
      return { plan: suggestedPlan, billingInterval: suggestedInterval, product };
    }
  }

  const fallbackProduct = billing.catalogProducts.find((product) => product.active && product.planFamily === suggestedPlan) || null;
  if (!fallbackProduct) return null;

  return {
    plan: suggestedPlan,
    billingInterval: fallbackProduct.billingInterval,
    product: fallbackProduct,
  };
}

function formatPlanPriceLabel(
  product: CompanyBillingPlanSelectionPage.BillingOverview["catalogProducts"][number] | null,
  interval: CompanyBillingPlanSelectionPage.Interval,
): string {
  if (!product) {
    return "Unavailable for this billing interval";
  }

  if (interval === "yearly") {
    return `${formatCompanyBillingPriceFromMinorUnits(product.priceAmount ? Math.round(product.priceAmount / 12) : null, product.priceCurrency)} / month`;
  }

  return `${formatCompanyBillingPriceFromMinorUnits(product.priceAmount, product.priceCurrency)} / month`;
}

function formatBillingHint(
  product: CompanyBillingPlanSelectionPage.BillingOverview["catalogProducts"][number] | null,
  interval: CompanyBillingPlanSelectionPage.Interval,
): string {
  if (!product) {
    return "This billing interval is not available right now";
  }

  if (interval === "yearly") {
    return `Billed yearly at ${formatCompanyBillingPriceFromMinorUnits(product.priceAmount, product.priceCurrency)}`;
  }

  return "Billed monthly";
}

function buildConsequenceRows(
  consequence: ReturnType<typeof buildCompanyBillingChangeConsequence>,
): CompanyBillingPlanSelectionPage.ConsequenceNotice["rows"] {
  const rows = [
    { label: "Active members", value: `${consequence.memberCount}` },
    consequence.memberLimit != null ? { label: `${consequence.targetPlanLabel} member limit`, value: `${consequence.memberLimit}` } : null,
    { label: "Storage used", value: formatStorageBytes(consequence.storageUsageBytes) },
    consequence.storageLimitBytes != null
      ? {
          label: `${consequence.targetPlanLabel} storage limit`,
          value: formatStorageBytes(consequence.storageLimitBytes),
        }
      : null,
  ];

  return rows.filter((row): row is NonNullable<typeof row> => row !== null);
}

function noop() {}

function formatMemberLimitLine(memberLimit?: number | null): string {
  if (memberLimit == null) {
    return "Unlimited members";
  }

  return `${memberLimit} member limit`;
}

function formatStorageLimitLine(storageLimitBytes?: number | null): string {
  if (storageLimitBytes == null) {
    return "Unlimited storage";
  }

  return `${formatStorageBytes(storageLimitBytes)} storage`;
}
