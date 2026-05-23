import { findCompanyBillingSellableProduct } from "../CompanyBillingPage/state";
import { CompanyBillingPlanSelectionPage } from "./types";

export function buildCompanyBillingPlanSelectionPageViewModel(
  props: CompanyBillingPlanSelectionPage.Props,
): CompanyBillingPlanSelectionPage.PageViewModel {
  return {
    pageTitle: "Choose a plan",
    pageSubtitle: "Select a paid plan. Card and payment confirmation happen in Polar.",
    selection: buildCompanyBillingPlanSelectionMode({
      billing: props.billing,
      selection: props.selection,
      actionError: props.actionError || null,
      isStartingCheckout: props.isStartingCheckout || false,
      onSelectPlan: props.onSelectPlan || noop,
      onSelectInterval: props.onSelectInterval || noop,
      onContinueToCheckout: props.onContinueToCheckout || noop,
    }),
  };
}

interface BuildSelectionModeArgs {
  billing: CompanyBillingPlanSelectionPage.BillingOverview;
  selection: CompanyBillingPlanSelectionPage.BillingTargetSelection;
  actionError: string | null;
  isStartingCheckout: boolean;
  onSelectPlan: (plan: CompanyBillingPlanSelectionPage.Plan) => void;
  onSelectInterval: (interval: CompanyBillingPlanSelectionPage.Interval) => void;
  onContinueToCheckout: () => void;
}

export function buildCompanyBillingPlanSelectionMode(
  args: BuildSelectionModeArgs,
): CompanyBillingPlanSelectionPage.SelectionModeView {
  const selectedTarget = args.selection.target || findSuggestedSelectionTarget(args.billing);
  const selectedInterval = selectedTarget?.billingInterval || "monthly";

  return {
    errorMessage: args.actionError,
    selectedInterval,
    onSelectInterval: args.onSelectInterval,
    cards: (["team", "business"] as CompanyBillingPlanSelectionPage.Plan[]).map((plan) => {
      const definition = findPlanDefinition(args.billing.plans, plan);
      const product = findCompanyBillingSellableProduct(args.billing.catalogProducts, plan, selectedInterval);

      return {
        key: `${plan}-${selectedInterval}`,
        title: definition?.displayName || formatPlanName(plan),
        priceLabel: formatPlanPriceLabel(product, selectedInterval),
        detailLines: [
          definition?.memberLimit ? `${definition.memberLimit} member limit` : "Member limit unavailable",
          formatBillingHint(product, selectedInterval),
        ],
        selected: selectedTarget?.plan === plan,
        suggested: args.billing.account.suggestedPlanKey === plan,
        disabled: !product,
        onSelect: () => args.onSelectPlan(plan),
        testId: `billing-plan-card-${plan}-${selectedInterval}`,
      };
    }),
    continueAction: {
      label: "Continue to checkout",
      tone: "primary",
      onClick: args.onContinueToCheckout,
      disabled: !selectedTarget?.product,
      loading: args.isStartingCheckout,
    },
  };
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

function findPlanDefinition(
  plans: CompanyBillingPlanSelectionPage.BillingOverview["plans"],
  key: CompanyBillingPlanSelectionPage.Plan,
) {
  return plans.find((plan) => plan.key === key) || null;
}

function formatPlanName(planKey: CompanyBillingPlanSelectionPage.Plan): string {
  return planKey === "team" ? "Team" : "Business";
}

function formatPriceFromMinorUnits(amount?: number | null, currency?: string | null): string {
  if (amount == null || !currency) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatPlanPriceLabel(
  product: CompanyBillingPlanSelectionPage.BillingOverview["catalogProducts"][number] | null,
  interval: CompanyBillingPlanSelectionPage.Interval,
): string {
  if (!product) {
    return "Unavailable for this billing interval";
  }

  if (interval === "yearly") {
    return `${formatPriceFromMinorUnits(product.priceAmount ? Math.round(product.priceAmount / 12) : null, product.priceCurrency)} / month`;
  }

  return `${formatPriceFromMinorUnits(product.priceAmount, product.priceCurrency)} / month`;
}

function formatBillingHint(
  product: CompanyBillingPlanSelectionPage.BillingOverview["catalogProducts"][number] | null,
  interval: CompanyBillingPlanSelectionPage.Interval,
): string {
  if (!product) {
    return "This billing interval is not available right now";
  }

  if (interval === "yearly") {
    return `Billed yearly at ${formatPriceFromMinorUnits(product.priceAmount, product.priceCurrency)}`;
  }

  return "Billed monthly";
}

function noop() {}
