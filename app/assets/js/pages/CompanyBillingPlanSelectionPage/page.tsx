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
  const [isStartingCheckout, setIsStartingCheckout] = React.useState(false);

  React.useEffect(() => {
    setBilling(loadedBilling);
  }, [loadedBilling]);

  const search = React.useMemo(() => Billing.parseBillingSearch(location.search), [location.search]);
  const selection = React.useMemo(() => Billing.selectTarget(billing, search), [billing, search]);
  const canUseCheckout = Billing.canCreateCheckout(billing.account.status);
  const companyName = companyRootData?.company?.name || "Billing";

  React.useEffect(() => {
    if (!canUseCheckout) {
      navigate(paths.companyBillingPath(), { replace: true });
    }
  }, [canUseCheckout, navigate, paths]);

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

  const startCheckout = React.useCallback(
    async (target: TurboCompanyBillingPlanSelectionPage.BillingTarget | null) => {
      setActionError(null);
      setIsStartingCheckout(true);

      const result = await Billing.beginCheckout(target);

      if (result.outcome === "missing_target") {
        setIsStartingCheckout(false);
        return;
      }

      if (result.outcome === "target_unavailable") {
        setIsStartingCheckout(false);
        setActionError("That billing option is no longer sellable. Please choose another plan.");
        showErrorToast("Checkout unavailable", "That billing option is no longer available. Please choose another plan.");
        return;
      }

      if (result.outcome === "session_created") {
        window.location.assign(result.session.url);
        return;
      }

      if (result.billing) {
        setBilling(result.billing);
      }

      setActionError("We couldn't start checkout right now. Please try again.");
      showErrorToast("Failed to start checkout", "We couldn't start Polar checkout. Please try again.");
      setIsStartingCheckout(false);
    },
    [],
  );

  if (!canUseCheckout) {
    return null;
  }

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
      isStartingCheckout={isStartingCheckout}
      onSelectPlan={handleSelectPlan}
      onSelectInterval={handleSelectInterval}
      onContinueToCheckout={() => void startCheckout(selection.target)}
      testId="company-billing-plan-selection-page"
    />
  );
}
