import * as Billing from "@/models/billing";
import * as React from "react";

import { buildCompanyBillingCancellationFeedback, isCompanyBillingPaidStatus } from "turboui/CompanyBilling";
import { CompanyBillingPage as TurboCompanyBillingPage } from "turboui/CompanyBillingPage";
import { CompanyBillingCancellationPage as TurboCompanyBillingCancellationPage } from "turboui/CompanyBillingCancellationPage";
import { showErrorToast } from "turboui";
import { useTranslation } from "react-i18next";
import { useLoadedData } from "./loader";
import { useNavigate, useRouteLoaderData } from "react-router";
import { translationText } from "@/i18n";
import { usePaths } from "@/routes/paths";

interface CompanyRootData {
  company?: {
    name?: string | null;
  } | null;
}

interface BillingPageLocationState {
  billing?: Billing.BillingOverview;
  feedback?: TurboCompanyBillingPage.Feedback;
}

export function Page() {
  const { t } = useTranslation();
  const billingActions = Billing.useBillingActions();
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

  const companyName = companyRootData?.company?.name || translationText(t("Billing"));

  const keepCurrentPlan = React.useCallback(() => {
    navigate(paths.companyBillingPath());
  }, [navigate, paths]);

  const cancelPlan = React.useCallback(async () => {
    setActionError(null);
    setIsSubmitting(true);

    const result = await billingActions.cancelSubscription();

    if (result.outcome === "billing_updated") {
      navigate(paths.companyBillingPath(), {
        state: {
          billing: result.billing,
          feedback: buildCompanyBillingCancellationFeedback(result.billing),
        } satisfies BillingPageLocationState,
      });
      return;
    }

    if (result.billing) {
      setBilling(result.billing);

      if (!isCompanyBillingPaidStatus(result.billing.account.status) || result.billing.account.cancelAtPeriodEnd) {
        navigate(paths.companyBillingPath(), {
          state: { billing: result.billing } satisfies BillingPageLocationState,
        });
        return;
      }
    }

    setActionError(t("We couldn't schedule the cancellation right now. Please try again."));
    showErrorToast(t("Cancellation unavailable"), t("We couldn't schedule the cancellation right now. Please try again."));
    setIsSubmitting(false);
  }, [billingActions, navigate, paths]);

  return (
    <TurboCompanyBillingCancellationPage
      title={[companyName, translationText(t("Cancel plan"))]}
      navigation={[
        { label: t("Company Administration"), to: paths.companyAdminPath() },
        { label: t("Billing"), to: paths.companyBillingPath() },
      ]}
      billing={billing}
      actionError={actionError}
      isSubmitting={isSubmitting}
      onKeepCurrentPlan={keepCurrentPlan}
      onCancelPlan={() => void cancelPlan()}
      testId="company-billing-cancellation-page"
    />
  );
}
