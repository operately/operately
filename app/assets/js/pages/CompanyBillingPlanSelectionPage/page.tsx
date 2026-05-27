import * as Billing from "@/models/billing";
import * as React from "react";

import { CompanyBillingPlanSelectionPage as TurboCompanyBillingPlanSelectionPage, showErrorToast } from "turboui";
import { useLoadedData } from "../CompanyBillingPage/loader";
import { useLocation, useNavigate, useRouteLoaderData } from "react-router-dom";
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
  const { billing: loadedBilling } = useLoadedData();
  const companyRootData = useRouteLoaderData("companyRoot") as CompanyRootData | undefined;

  const [billing, setBilling] = React.useState(loadedBilling);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setBilling(loadedBilling);
  }, [loadedBilling]);

  const search = React.useMemo(() => Billing.parseBillingSearch(location.search), [location.search]);
  const selection = React.useMemo(() => Billing.selectTarget(billing, search), [billing, search]);
  const canUseCheckout = Billing.canCreateCheckout(billing.account.status);
  const canManagePaidSubscription = Billing.canManagePaidSubscription(billing.account.status);
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
      const plan = selection.target?.plan || search.plan || "team";
      navigateToSelection({ plan, billingInterval, product: null }, true);
    },
    [navigateToSelection, search.plan, selection.target],
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
      setActionError("That billing option is no longer sellable. Please choose another plan.");
      showErrorToast("Checkout unavailable", "That billing option is no longer available. Please choose another plan.");
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
    showErrorToast("Failed to start checkout", "We couldn't start Polar checkout. Please try again.");
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
      setActionError("That billing option is no longer sellable. Please choose another plan.");
      showErrorToast("Plan unavailable", "That billing option is no longer available. Please choose another plan.");
      return;
    }

    if (result.outcome === "billing_updated") {
      navigate(paths.companyBillingPath(), {
        state: {
          billing: result.billing,
          feedback: Billing.buildPlanChangeFeedback(result.billing),
        },
      });
      return;
    }

    if (result.billing) {
      setBilling(result.billing);
    }

    setActionError("We couldn't change the plan right now. Please try again.");
    showErrorToast("Failed to change plan", "We couldn't update the subscription in Polar. Please try again.");
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
      actionError={actionError}
      isSubmitting={isSubmitting}
      onSelectPlan={handleSelectPlan}
      onSelectInterval={handleSelectInterval}
      onSubmit={handleSubmit}
      testId="company-billing-plan-selection-page"
    />
  );
}
