import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import * as Billing from "@/models/billing";
import { useHasSupportSessionCookie } from "@/features/SupportSessions";
import { usePaths } from "@/routes/paths";
import { useLocation } from "react-router-dom";
import { IconAlertTriangleFilled, PrimaryButton } from "turboui";

import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export function PaymentDefaultBanner() {
  const { company, billingAccessState } = useCompanyLoaderData();
  const paths = usePaths();
  const location = useLocation();
  const hasSupportSession = useHasSupportSessionCookie();

  const hiddenOnRoute = Billing.isBillingManagementPath(location.pathname, paths.companyBillingPath());
  const canManageBilling = Boolean(company.permissions?.canManageBilling);

  const banner = React.useMemo(() => {
    if (hiddenOnRoute) {
      return null;
    }

    return Billing.buildPaymentDefaultBanner(billingAccessState, canManageBilling, {
      companyBillingPath: () => paths.companyBillingPath(),
    });
  }, [billingAccessState, canManageBilling, hiddenOnRoute, paths]);

  if (!banner) {
    return null;
  }

  return (
    <div
      className={`fixed left-0 right-0 z-[999] border-t border-surface-outline bg-callout-error-bg shadow-lg ${hasSupportSession ? "bottom-14 sm:bottom-12" : "bottom-0"}`}
      data-test-id="payment-default-banner"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-surface-outline bg-surface-base text-callout-error-content shadow-sm">
            <IconAlertTriangleFilled size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-callout-error-content">{banner.title}</div>
            <p className="mt-1 text-sm text-callout-error-content">{renderDescription(banner)}</p>
          </div>
        </div>

        {banner.cta && (
          <div className="flex shrink-0 items-start gap-2">
            <PrimaryButton linkTo={banner.cta.to} size="sm" testId="payment-default-banner-cta">
              {banner.cta.label}
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function renderDescription(banner: ReturnType<typeof Billing.buildPaymentDefaultBanner>) {
  if (!banner) return null;

  if (banner.mode === "payment_grace") {
    return (
      <>
        Payment needs to be resolved
        {banner.deadline ? (
          <>
            {" by "}
            <FormattedTime time={banner.deadline} format="long-date" />
          </>
        ) : (
          " soon"
        )}{" "}
        or this company will switch to read-only mode.
      </>
    );
  }

  return "This company is read-only because payment was not resolved in time. Collaborative work is blocked until an admin resolves the payment issue.";
}
