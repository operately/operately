import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import * as Billing from "@/models/billing";
import { useHasSupportSessionCookie } from "@/features/SupportSessions";
import { usePaths } from "@/routes/paths";
import { useLocation } from "react-router-dom";
import { IconAlertTriangleFilled, SecondaryButton } from "turboui";

import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export function BillingDangerBanner() {
  const { company, billingAccessState, billingLimitWarnings } = useCompanyLoaderData();
  const paths = usePaths();
  const location = useLocation();
  const hasSupportSession = useHasSupportSessionCookie();

  const hiddenOnRoute = Billing.isBillingManagementPath(location.pathname, paths.companyBillingPath());
  const canManageBilling = Boolean(company.permissions?.canManageBilling);

  const banner = React.useMemo(() => {
    if (hiddenOnRoute) {
      return null;
    }

    return Billing.buildBillingDangerBanner(billingAccessState, billingLimitWarnings, canManageBilling, {
      companyBillingPath: () => paths.companyBillingPath(),
      companyBillingPlansPath: (opts) => paths.companyBillingPlansPath(opts),
    });
  }, [billingAccessState, billingLimitWarnings, canManageBilling, hiddenOnRoute, paths]);

  if (!banner) {
    return null;
  }

  const testId = banner.kind === "payment_default" ? "payment-default-banner" : "company-billing-danger-banner";
  const ctaTestId = banner.kind === "payment_default" ? "payment-default-banner-cta" : "company-billing-danger-banner-cta";

  return (
    <div
      className={`fixed left-0 right-0 z-[999] border-t-2 border-red-950/40 bg-red-700 shadow-2xl ${hasSupportSession ? "bottom-14 sm:bottom-12" : "bottom-0"}`}
      data-test-id={testId}
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0 flex flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white-1 shadow-sm">
            <IconAlertTriangleFilled size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white-1">{banner.title}</div>
            <p className="mt-1 text-sm text-white-1">{renderDescription(banner)}</p>

            {banner.kind === "over_limit" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {banner.usageRows.map((row) => (
                  <div
                    key={row.label}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      row.state === "blocked"
                        ? "border-white/20 bg-white/15 font-semibold text-white-1"
                        : "border-white/20 bg-white/10 text-white-1/90"
                    }`}
                  >
                    <span className="font-semibold text-white-1">{row.label}:</span>{" "}
                    {row.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {banner.cta && (
          <div className="flex shrink-0 items-start gap-2">
            <SecondaryButton
              linkTo={banner.cta.to}
              size="sm"
              testId={ctaTestId}
              className="!border-white/20 !bg-white !text-callout-error-content shadow-sm hover:!bg-red-50 hover:!text-callout-error-content"
            >
              {banner.cta.label}
            </SecondaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function renderDescription(banner: ReturnType<typeof Billing.buildBillingDangerBanner>) {
  if (!banner) return null;

  if (banner.kind === "payment_default") {
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
          {banner.shouldContactAdmin && " Contact a company admin or owner."}
        </>
      );
    }

    return banner.shouldContactAdmin
      ? "This company is read-only because payment was not resolved in time. Collaborative work is blocked until a company admin or owner resolves the payment issue."
      : "This company is read-only because payment was not resolved in time. Collaborative work is blocked until the payment issue is resolved.";
  }

  const blockedMemberLimit = banner.blockedLimitKeys.includes("member_count");
  const blockedStorageLimit = banner.blockedLimitKeys.includes("storage_bytes");
  const blockedActions = describeBlockedActions(blockedMemberLimit, blockedStorageLimit);

  return banner.shouldContactAdmin
    ? `${blockedActions} are blocked until the company is back within its plan limits. Contact a company admin or owner.`
    : `${blockedActions} are blocked until the company is back within its plan limits. Review billing to fix it.`;
}

function describeBlockedActions(blockedMemberLimit: boolean, blockedStorageLimit: boolean) {
  if (blockedMemberLimit && blockedStorageLimit) {
    return "Invites, restores, and uploads";
  }

  if (blockedMemberLimit) {
    return "Invites and restores";
  }

  return "Uploads";
}
