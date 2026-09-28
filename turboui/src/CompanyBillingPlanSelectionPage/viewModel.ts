import {
  findCompanyBillingSellableProduct,
  getCompanyBillingCurrentTarget,
  getCompanyBillingScheduledTarget,
  getCompanyBillingSuggestedTarget,
  isCompanyBillingPaidStatus,
  listCompanyBillingSellableTargets,
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
import { formatStorageBytes, listCompanyBillingSellablePlanDefinitions } from "../CompanyBilling";
import { CompanyBillingPlanSelectionPage } from "./types";
import i18n from "../i18n";

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
    pageTitle: i18n.t("Choose a plan"),
    pageSubtitle:
      selection.mode === "change_plan"
        ? i18n.t("Choose a new plan for this company.")
        : i18n.t("Choose a paid plan for this company. Payment details are handled at checkout."),
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
  const mode: CompanyBillingPlanSelectionPage.Mode = isCompanyBillingPaidStatus(args.billing.account.status)
    ? "change_plan"
    : "checkout";
  const selectedTarget = args.selection.target || findFallbackSelectionTarget(args.billing, mode);
  const selectedInterval = selectedTarget?.billingInterval || "monthly";

  return {
    mode,
    errorMessage: args.actionError,
    selectedInterval,
    onSelectInterval: args.onSelectInterval,
    cards: listCompanyBillingSellablePlanDefinitions(args.billing).map((definition) => {
      const product = findCompanyBillingSellableProduct(args.billing.catalogProducts, definition.key, selectedInterval);

      return {
        key: `${definition.key}-${selectedInterval}`,
        title: definition.displayName || formatCompanyBillingPlanName(definition.key),
        priceLabel: formatPlanPriceLabel(product, selectedInterval),
        detailLines: [
          formatMemberLimitLine(definition.memberLimit),
          formatStorageLimitLine(definition.storageLimitBytes),
          formatBillingHint(product, selectedInterval),
        ],
        selected: selectedTarget?.plan === definition.key,
        suggested: args.billing.account.suggestedPlanKey === definition.key,
        disabled: !product,
        onSelect: () => args.onSelectPlan(definition.key),
        testId: `billing-plan-card-${definition.key}-${selectedInterval}`,
      };
    }),
    consequenceNotice: buildSelectionConsequenceNotice(args.billing, mode, selectedTarget),
    continueAction: {
      label: mode === "change_plan" ? i18n.t("Change plan") : i18n.t("Continue to checkout"),
      tone: "primary",
      onClick: args.onSubmit,
      disabled:
        !selectedTarget?.product ||
        (mode === "change_plan" && isCurrentOrScheduledSelection(args.billing, selectedTarget)),
      loading: args.isSubmitting,
    },
  };
}

function findFallbackSelectionTarget(
  billing: CompanyBillingPlanSelectionPage.BillingOverview,
  mode: CompanyBillingPlanSelectionPage.Mode,
): CompanyBillingPlanSelectionPage.BillingTarget | null {
  const sellableTargets = listCompanyBillingSellableTargets(billing);

  if (mode === "change_plan") {
    return (
      resolveSelectionTarget(sellableTargets, getCompanyBillingScheduledTarget(billing)) ||
      resolveSelectionTarget(sellableTargets, getCompanyBillingCurrentTarget(billing))
    );
  }

  return getCompanyBillingSuggestedTarget(billing) || sellableTargets[0] || null;
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

  const timing = resolveCompanyBillingChangeTiming(currentTarget, selectedTarget, billing.plans);
  if (!timing) return null;

  const consequence = buildCompanyBillingChangeConsequence({
    billing,
    targetPlanKey: selectedTarget.plan,
    targetBillingInterval: selectedTarget.billingInterval,
    timing,
    effectiveDate: timing === "next_renewal" ? billing.account.currentPeriodEnd : null,
  });

  const showOverageWarning = consequence.overageKind !== "none";
  const rows = showOverageWarning ? buildConsequenceRows(consequence) : [];
  const overageDescription = showOverageWarning ? buildCompanyBillingOverageDescription(consequence) : null;

  return {
    tone: showOverageWarning ? "warning" : "info",
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

function formatPlanPriceLabel(
  product: CompanyBillingPlanSelectionPage.BillingOverview["catalogProducts"][number] | null,
  interval: CompanyBillingPlanSelectionPage.Interval,
): string {
  if (!product) {
    return i18n.t("Unavailable for this billing interval");
  }

  if (interval === "yearly") {
    return i18n.t("{{price}} / month", {
      price: formatCompanyBillingPriceFromMinorUnits(product.priceAmount ? Math.round(product.priceAmount / 12) : null, product.priceCurrency),
    });
  }

  return i18n.t("{{price}} / month", {
    price: formatCompanyBillingPriceFromMinorUnits(product.priceAmount, product.priceCurrency),
  });
}

function formatBillingHint(
  product: CompanyBillingPlanSelectionPage.BillingOverview["catalogProducts"][number] | null,
  interval: CompanyBillingPlanSelectionPage.Interval,
): string {
  if (!product) {
    return i18n.t("This billing interval is not available right now");
  }

  if (interval === "yearly") {
    return i18n.t("Billed yearly at {{price}}", {
      price: formatCompanyBillingPriceFromMinorUnits(product.priceAmount, product.priceCurrency),
    });
  }

  return i18n.t("Billed monthly");
}

function buildConsequenceRows(
  consequence: ReturnType<typeof buildCompanyBillingChangeConsequence>,
): CompanyBillingPlanSelectionPage.ConsequenceNotice["rows"] {
  const rows = [
    { label: i18n.t("Active members"), value: `${consequence.memberCount}` },
    consequence.memberLimit != null
      ? { label: i18n.t("{{plan}} member limit", { plan: consequence.targetPlanLabel }), value: `${consequence.memberLimit}` }
      : null,
    { label: i18n.t("Storage used"), value: formatStorageBytes(consequence.storageUsageBytes) },
    consequence.storageLimitBytes != null
      ? {
          label: i18n.t("{{plan}} storage limit", { plan: consequence.targetPlanLabel }),
          value: formatStorageBytes(consequence.storageLimitBytes),
        }
      : null,
  ];

  return rows.filter((row): row is NonNullable<typeof row> => row !== null);
}

function noop() {}

function resolveSelectionTarget(
  sellableTargets: CompanyBillingPlanSelectionPage.BillingTarget[],
  target: CompanyBillingPlanSelectionPage.BillingTarget | null,
) {
  if (!target) return null;

  return (
    sellableTargets.find(
      (candidate) => candidate.plan === target.plan && candidate.billingInterval === target.billingInterval,
    ) ||
    sellableTargets.find((candidate) => candidate.plan === target.plan) ||
    null
  );
}

function formatMemberLimitLine(memberLimit?: number | null): string {
  if (memberLimit == null) {
    return i18n.t("Unlimited members");
  }

  return i18n.t("{{count}} member limit", { count: memberLimit });
}

function formatStorageLimitLine(storageLimitBytes?: number | null): string {
  if (storageLimitBytes == null) {
    return i18n.t("Unlimited storage");
  }

  return i18n.t("{{storage}} storage", { storage: formatStorageBytes(storageLimitBytes) });
}
