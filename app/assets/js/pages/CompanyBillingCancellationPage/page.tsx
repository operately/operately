import * as Billing from "@/models/billing";
import * as React from "react";

import {
  buildCompanyBillingCancellationFeedback,
  isCompanyBillingPaidStatus,
} from "turboui/CompanyBilling";
import { CompanyBillingPage as TurboCompanyBillingPage } from "turboui/CompanyBillingPage";
import { CompanyBillingCancellationPage as TurboCompanyBillingCancellationPage } from "turboui/CompanyBillingCancellationPage";
import { showErrorToast } from "turboui";
import { useLoadedData } from "./loader";
import { useNavigate, useRouteLoaderData } from "react-router-dom";
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

  const companyName = companyRootData?.company?.name || "Billing";

  const keepCurrentPlan = React.useCallback(() => {
    navigate(paths.companyBillingPath());
  }, [navigate, paths]);

  const cancelPlan = React.useCallback(async () => {
    setActionError(null);
    setIsSubmitting(true);

    const result = await Billing.cancelSubscription();

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

    setActionError("We couldn't cancel the plan right now. Please try again.");
    showErrorToast("Cancellation unavailable", "We couldn't update the subscription in Polar. Please try again.");
    setIsSubmitting(false);
  }, [navigate, paths]);

  return (
    <TurboCompanyBillingCancellationPage
      title={[companyName, "Cancel plan"]}
      navigation={[
        { label: "Company Administration", to: paths.companyAdminPath() },
        { label: "Billing", to: paths.companyBillingPath() },
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
