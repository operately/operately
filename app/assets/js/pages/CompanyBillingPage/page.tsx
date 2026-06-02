import * as Billing from "@/models/billing";
import * as React from "react";

import {
  buildCompanyBillingReactivationFeedback,
  getCompanyBillingPendingTarget,
  isCompanyBillingCheckoutReturnSuccessful,
  parseCompanyBillingSearch,
  selectCompanyBillingTarget,
  buildCompanyBillingSuccessFeedback,
  canCreateCompanyBillingCheckout,
  isCompanyBillingPaidStatus,
} from "turboui/CompanyBilling";
import { CompanyBillingPage as TurboCompanyBillingPage } from "turboui/CompanyBillingPage";
import { showErrorToast } from "turboui";
import { useLoadedData } from "./loader";
import { useLocation, useNavigate } from "react-router-dom";
import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

interface BillingPageLocationState {
  billing?: Billing.BillingOverview;
  feedback?: TurboCompanyBillingPage.Feedback;
}

export function isAwaitingCheckoutConfirmation(
  billing: Billing.BillingOverview,
  checkoutId: string | null,
  requestedTarget: TurboCompanyBillingPage.BillingTarget | null,
) {
  return Boolean(checkoutId) && !isCompanyBillingCheckoutReturnSuccessful(billing, requestedTarget);
}

export function resolveCheckoutConfirmation(
  billing: Billing.BillingOverview,
  checkoutId: string | null,
): { checkoutResolved: boolean; feedback: TurboCompanyBillingPage.Feedback | null } {
  if (!checkoutId) {
    return { checkoutResolved: false, feedback: null };
  }

  if (isCompanyBillingCheckoutReturnSuccessful(billing, getCompanyBillingPendingTarget(billing))) {
    return {
      checkoutResolved: true,
      feedback: buildCompanyBillingSuccessFeedback(billing),
    };
  }

  return { checkoutResolved: false, feedback: null };
}

export function Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const paths = usePaths();
  const { billing: loadedBilling } = useLoadedData();
  const { company } = useCompanyLoaderData();
  const locationState = (location.state as BillingPageLocationState | null) || null;

  const [billing, setBilling] = React.useState(locationState?.billing || loadedBilling);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<TurboCompanyBillingPage.Feedback | null>(locationState?.feedback || null);
  const [, setIsStartingCheckout] = React.useState(false);

  React.useEffect(() => {
    setBilling(loadedBilling);
  }, [loadedBilling]);

  React.useEffect(() => {
    if (locationState?.billing) {
      setBilling(locationState.billing);
    }

    if (locationState?.feedback) {
      setFeedback(locationState.feedback);
    }
  }, [locationState]);

  const search = React.useMemo(() => parseCompanyBillingSearch(location.search), [location.search]);
  const selection = React.useMemo(() => selectCompanyBillingTarget(billing, search), [billing, search]);
  const pendingTarget = React.useMemo(() => getCompanyBillingPendingTarget(billing), [billing]);
  const checkoutReturnTarget = pendingTarget || selection.target;
  const canUseCheckout = canCreateCompanyBillingCheckout(billing.account.status);
  const canManagePaidSubscription = isCompanyBillingPaidStatus(billing.account.status);
  const companyName = company.name || "Billing";
  const isConfirmingCheckout = isAwaitingCheckoutConfirmation(billing, search.checkoutId, checkoutReturnTarget);
  const canManuallyRefreshBilling = Billing.isPaymentRecoveryAccessState(billing.account);

  const clearBillingSearch = React.useCallback(() => {
    navigate(paths.companyBillingPath(), { replace: true });
  }, [navigate, paths]);

  const openPlanSelection = React.useCallback(
    (target?: TurboCompanyBillingPage.BillingTarget | null) => {
      setActionError(null);
      setFeedback(null);
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

  const openCancellationPage = React.useCallback(() => {
    setActionError(null);
    setFeedback(null);
    navigate(paths.companyBillingCancelPath());
  }, [navigate, paths]);

  const finishCheckoutConfirmation = React.useCallback(
    (nextBilling: Billing.BillingOverview, nextFeedback: TurboCompanyBillingPage.Feedback) => {
      setBilling(nextBilling);
      setFeedback(nextFeedback);
      setActionError(null);
      clearBillingSearch();
    },
    [clearBillingSearch],
  );

  const applyRefreshedBilling = React.useCallback(
    (nextBilling: Billing.BillingOverview) => {
      const resolution = resolveCheckoutConfirmation(nextBilling, search.checkoutId);

      if (resolution.checkoutResolved && resolution.feedback) {
        finishCheckoutConfirmation(nextBilling, resolution.feedback);
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
      setFeedback(null);
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
        Billing.redirectToExternalBillingUrl(result.session.url);
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

  const openPaymentMethodSession = React.useCallback(async () => {
    setActionError(null);

    const result = await Billing.beginPaymentMethodSession(paths.companyBillingPath());

    if (result.outcome === "session_created") {
      Billing.redirectToExternalBillingUrl(result.session.url);
      return;
    }

    if (result.billing) {
      setBilling(result.billing);
    }

    setActionError("We couldn't open payment method management right now. Please try again.");
    showErrorToast("Payment method unavailable", "We couldn't open payment method management in Polar. Please try again.");
  }, [paths]);

  const openCustomerPortalSession = React.useCallback(async () => {
    setActionError(null);

    const result = await Billing.beginCustomerPortalSession(paths.companyBillingPath());

    if (result.outcome === "session_created") {
      Billing.redirectToExternalBillingUrl(result.session.url);
      return;
    }

    if (result.billing) {
      setBilling(result.billing);
    }

    setActionError("We couldn't open billing management right now. Please try again.");
    showErrorToast("Billing management unavailable", "We couldn't open the Polar billing portal. Please try again.");
  }, [paths]);

  const reactivatePlan = React.useCallback(async () => {
    setActionError(null);
    setFeedback(null);

    const result = await Billing.reactivateSubscription();

    if (result.outcome === "billing_updated") {
      setBilling(result.billing);
      setFeedback(buildCompanyBillingReactivationFeedback(result.billing));
      return;
    }

    if (result.billing) {
      setBilling(result.billing);
    }

    setActionError("We couldn't reactivate the plan right now. Please try again.");
    showErrorToast("Reactivation unavailable", "We couldn't update the subscription in Polar. Please try again.");
  }, []);

  const refreshFromBillingUpdate = React.useCallback(() => {
    void Billing.refreshBilling({}).then((refreshed) => {
      applyRefreshedBilling(refreshed);
    });
  }, [applyRefreshedBilling]);

  const refreshBillingManually = React.useCallback(async () => {
    setActionError(null);

    try {
      const refreshed = await Billing.refreshBilling({});
      applyRefreshedBilling(refreshed);
    } catch {
      setActionError("We couldn't refresh billing right now. Please try again.");
      showErrorToast("Refresh unavailable", "We couldn't refresh billing from Polar. Please try again.");
    }
  }, [applyRefreshedBilling]);

  Billing.useBillingUpdatedSignal(refreshFromBillingUpdate);

  React.useEffect(() => {
    const resolution = resolveCheckoutConfirmation(billing, search.checkoutId);

    if (resolution.checkoutResolved && resolution.feedback) {
      finishCheckoutConfirmation(billing, resolution.feedback);
    }
  }, [billing, finishCheckoutConfirmation, search.checkoutId]);

  return (
    <TurboCompanyBillingPage
      title={[companyName, "Billing"]}
      navigation={[{ label: "Company Administration", to: paths.companyAdminPath() }]}
      billing={billing}
      isConfirmingCheckout={isConfirmingCheckout}
      confirmingTarget={checkoutReturnTarget}
      feedback={feedback}
      actionError={actionError}
      onOpenSelection={selection.target ? () => openPlanSelection() : null}
      onCompleteUpgrade={canUseCheckout && pendingTarget ? () => void startCheckout(pendingTarget) : null}
      onCancelPlan={canManagePaidSubscription && !billing.account.cancelAtPeriodEnd ? openCancellationPage : null}
      onReactivatePlan={canManagePaidSubscription && billing.account.cancelAtPeriodEnd ? () => void reactivatePlan() : null}
      onUpdatePaymentMethod={canManagePaidSubscription ? () => void openPaymentMethodSession() : null}
      onManageBilling={canManagePaidSubscription ? () => void openCustomerPortalSession() : null}
      onRefreshBilling={canManuallyRefreshBilling ? () => void refreshBillingManually() : null}
      testId="company-billing-page"
    />
  );
}
