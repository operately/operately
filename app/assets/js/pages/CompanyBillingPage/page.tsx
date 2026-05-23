import * as Billing from "@/models/billing";
import * as React from "react";

import {
  canCreateCompanyBillingCheckout,
  buildCompanyBillingSuccessFeedback,
  CompanyBillingPage as TurboCompanyBillingPage,
  getCompanyBillingPendingTarget,
  isCompanyBillingCheckoutReturnSuccessful,
  parseCompanyBillingSearch,
  selectCompanyBillingTarget,
  showErrorToast,
} from "turboui";
import { useLoadedData } from "./loader";
import { useLocation, useNavigate, useRouteLoaderData } from "react-router-dom";
import { usePaths } from "@/routes/paths";

interface CompanyRootData {
  company?: {
    name?: string | null;
  } | null;
}

type CheckoutFeedback = TurboCompanyBillingPage.CheckoutFeedback;

export function Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const paths = usePaths();
  const { billing: loadedBilling } = useLoadedData();
  const companyRootData = useRouteLoaderData("companyRoot") as CompanyRootData | undefined;

  const [billing, setBilling] = React.useState(loadedBilling);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [checkoutFeedback, setCheckoutFeedback] = React.useState<CheckoutFeedback | null>(null);
  const [, setIsStartingCheckout] = React.useState(false);

  React.useEffect(() => {
    setBilling(loadedBilling);
  }, [loadedBilling]);

  const search = React.useMemo(() => parseCompanyBillingSearch(location.search), [location.search]);
  const selection = React.useMemo(() => selectCompanyBillingTarget(billing, search), [billing, search]);
  const pendingTarget = React.useMemo(() => getCompanyBillingPendingTarget(billing), [billing]);
  const canUseCheckout = canCreateCompanyBillingCheckout(billing.account.status);
  const companyName = companyRootData?.company?.name || "Billing";

  const clearBillingSearch = React.useCallback(() => {
    navigate(paths.companyBillingPath(), { replace: true });
  }, [navigate, paths]);

  const openPlanSelection = React.useCallback(
    (target?: TurboCompanyBillingPage.BillingTarget | null) => {
      setActionError(null);
      setCheckoutFeedback(null);
      const nextTarget = target || selection.target;
      if (!nextTarget) return;

      navigate(
        paths.companyBillingPlansPath({
          plan: nextTarget.plan,
          billingPeriod: nextTarget.billingInterval,
        }),
      );
    },
    [navigate, paths, selection.target],
  );

  const finishCheckoutConfirmation = React.useCallback(
    (nextBilling: Billing.BillingOverview, feedback: CheckoutFeedback) => {
      setBilling(nextBilling);
      setCheckoutFeedback(feedback);
      setActionError(null);
      clearBillingSearch();
    },
    [clearBillingSearch],
  );

  const applyRefreshedBilling = React.useCallback(
    (nextBilling: Billing.BillingOverview) => {
      const expectedTarget = getCompanyBillingPendingTarget(nextBilling);

      if (search.checkoutId && isCompanyBillingCheckoutReturnSuccessful(nextBilling, expectedTarget)) {
        finishCheckoutConfirmation(nextBilling, buildCompanyBillingSuccessFeedback(nextBilling));
        return { checkoutResolved: true };
      }

      setBilling(nextBilling);
      return { checkoutResolved: false };
    },
    [finishCheckoutConfirmation, search],
  );

  const startCheckout = React.useCallback(
    async (target: TurboCompanyBillingPage.BillingTarget | null) => {
      setActionError(null);
      setCheckoutFeedback(null);
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

  const refreshFromBillingUpdate = React.useCallback(() => {
    void Billing.refreshBilling({})
      .then((refreshed) => {
        applyRefreshedBilling(refreshed);
      });
  }, [applyRefreshedBilling]);

  Billing.useBillingUpdatedSignal(refreshFromBillingUpdate);

  React.useEffect(() => {
    if (!search.checkoutId) return;

    const expectedTarget = getCompanyBillingPendingTarget(billing);

    if (isCompanyBillingCheckoutReturnSuccessful(billing, expectedTarget)) {
      finishCheckoutConfirmation(billing, buildCompanyBillingSuccessFeedback(billing));
    }
  }, [billing, finishCheckoutConfirmation, search.checkoutId]);

  return (
    <TurboCompanyBillingPage
      title={[companyName, "Billing"]}
      navigation={[{ label: "Company Administration", to: paths.companyAdminPath() }]}
      billing={billing}
      checkoutFeedback={checkoutFeedback}
      actionError={actionError}
      onOpenSelection={canUseCheckout && selection.target ? () => openPlanSelection() : null}
      onCompleteUpgrade={canUseCheckout && pendingTarget ? () => void startCheckout(pendingTarget) : null}
      testId="company-billing-page"
    />
  );
}
