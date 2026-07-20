import * as Billing from "@/models/billing";
import * as React from "react";

import {
  buildCompanyBillingPlanChangeFeedback,
  canCreateCompanyBillingCheckout,
  isCompanyBillingPaidStatus,
  listCompanyBillingSellableTargets,
  parseCompanyBillingSearch,
  selectCompanyBillingTarget,
} from "turboui/CompanyBilling";
import { CompanyBillingPlanSelectionPage as TurboCompanyBillingPlanSelectionPage } from "turboui/CompanyBillingPlanSelectionPage";
import { showErrorToast } from "turboui";
import { useLoadedData } from "../CompanyBillingPage/loader";
import { useLocation, useNavigate, useRouteLoaderData } from "react-router";
import { usePaths } from "@/routes/paths";

interface CompanyRootData {
  company?: {
    name?: string | null;
  } | null;
}

export function Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const paths = usePaths();
  const { billing: loadedBilling, limitsEnforced } = useLoadedData();
  const companyRootData = useRouteLoaderData("companyRoot") as CompanyRootData | undefined;

  const [billing, setBilling] = React.useState(loadedBilling);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setBilling(loadedBilling);
  }, [loadedBilling]);

  const search = React.useMemo(() => parseCompanyBillingSearch(location.search), [location.search]);
  const selection = React.useMemo(() => selectCompanyBillingTarget(billing, search), [billing, search]);
  const canUseCheckout = canCreateCompanyBillingCheckout(billing.account.status);
  const canManagePaidSubscription = isCompanyBillingPaidStatus(billing.account.status);
  const companyName = companyRootData?.company?.name || "Billing";

  const navigateToSelection = React.useCallback(
    (target: TurboCompanyBillingPlanSelectionPage.BillingTarget | null, replace = false) => {
      if (!target) return;

      navigate(
        paths.companyBillingPlansPath({
          plan: target.plan,
          billingPeriod: target.billingInterval,
        }),
        { replace },
      );
    },
    [navigate, paths],
  );

  const handleSelectPlan = React.useCallback(
    (plan: TurboCompanyBillingPlanSelectionPage.Plan) => {
      const billingInterval = selection.target?.billingInterval || search.billingInterval || "monthly";
      navigateToSelection({ plan, billingInterval, product: null }, true);
    },
    [navigateToSelection, search.billingInterval, selection.target],
  );

  const handleSelectInterval = React.useCallback(
    (billingInterval: TurboCompanyBillingPlanSelectionPage.Interval) => {
      const plan = selection.target?.plan || search.plan || listCompanyBillingSellableTargets(billing)[0]?.plan;
      if (!plan) return;

      navigateToSelection({ plan, billingInterval, product: null }, true);
    },
    [billing, navigateToSelection, search.plan, selection.target],
  );

  const startCheckout = React.useCallback(async () => {
    setActionError(null);
    setIsSubmitting(true);

    const result = await Billing.beginCheckout(selection.target);

    if (result.outcome === "missing_target") {
      setIsSubmitting(false);
      return;
    }

    if (result.outcome === "target_unavailable") {
      setIsSubmitting(false);
      setActionError("That plan is no longer available. Choose another plan.");
      showErrorToast("Checkout unavailable", "That plan is no longer available. Choose another plan.");
      return;
    }

    if (result.outcome === "session_created") {
      Billing.redirectToExternalBillingUrl(result.session.url);
      return;
    }

    if (result.billing) {
      setBilling(result.billing);
    }

    setActionError("We couldn't start checkout right now. Please try again.");
    showErrorToast("Failed to start checkout", "We couldn't start checkout right now. Please try again.");
    setIsSubmitting(false);
  }, [selection.target]);

  const submitPlanChange = React.useCallback(async () => {
    setActionError(null);
    setIsSubmitting(true);

    const result = await Billing.changePlan(selection.target);

    if (result.outcome === "missing_target") {
      setIsSubmitting(false);
      return;
    }

    if (result.outcome === "target_unavailable") {
      setIsSubmitting(false);
      setActionError("That plan is no longer available. Choose another plan.");
      showErrorToast("Plan unavailable", "That plan is no longer available. Choose another plan.");
      return;
    }

    if (result.outcome === "billing_updated") {
      navigate(paths.companyBillingPath(), {
        state: {
          billing: result.billing,
          feedback: buildCompanyBillingPlanChangeFeedback(result.billing),
        },
      });
      return;
    }

    if (result.billing) {
      setBilling(result.billing);
    }

    setActionError("We couldn't change the plan right now. Please try again.");
    showErrorToast("Failed to change plan", "We couldn't change the plan right now. Please try again.");
    setIsSubmitting(false);
  }, [navigate, paths, selection.target]);

  const handleSubmit = React.useCallback(() => {
    if (canManagePaidSubscription) {
      void submitPlanChange();
      return;
    }

    if (canUseCheckout) {
      void startCheckout();
    }
  }, [canManagePaidSubscription, canUseCheckout, startCheckout, submitPlanChange]);

  return (
    <TurboCompanyBillingPlanSelectionPage
      title={[companyName, "Choose a plan"]}
      navigation={[
        { label: "Company Administration", to: paths.companyAdminPath() },
        { label: "Billing", to: paths.companyBillingPath() },
      ]}
      billing={billing}
      selection={selection}
      limitsEnforced={limitsEnforced}
      actionError={actionError}
      isSubmitting={isSubmitting}
      onSelectPlan={handleSelectPlan}
      onSelectInterval={handleSelectInterval}
      onSubmit={handleSubmit}
      testId="company-billing-plan-selection-page"
    />
  );
}
