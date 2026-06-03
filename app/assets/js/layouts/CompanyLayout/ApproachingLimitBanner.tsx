import * as React from "react";

import * as Billing from "@/models/billing";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useHasSupportSessionCookie } from "@/features/SupportSessions";
import { includesId, usePaths } from "@/routes/paths";
import { useLocation } from "react-router-dom";
import { IconAlertTriangleFilled, IconSparkles, IconX, PrimaryButton } from "turboui";

import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export function ApproachingLimitBanner() {
  const { company, billingAccessState, billingLimitWarnings } = useCompanyLoaderData();
  const me = useMe();
  const paths = usePaths();
  const location = useLocation();
  const [dismissedVersion, setDismissedVersion] = React.useState(0);
  const hasSupportSession = useHasSupportSessionCookie();

  const viewerRole = getViewerRole(company, me);
  const canManageBilling = Boolean(company.permissions?.canManageBilling);

  const hiddenOnRoute = Billing.isBillingManagementPath(location.pathname, paths.companyBillingPath());

  const banner = React.useMemo(() => {
    if (!billingLimitWarnings || hiddenOnRoute || Billing.isPaymentRecoveryAccessState(billingAccessState)) {
      return null;
    }

    const builtBanner = Billing.buildApproachingLimitBanner(billingLimitWarnings, viewerRole, canManageBilling, {
      companyBillingPath: () => paths.companyBillingPath(),
      companyBillingPlansPath: (opts) => paths.companyBillingPlansPath(opts),
    });

    if (!builtBanner) {
      return null;
    }

    if (builtBanner.mode === "approaching" && Billing.isApproachingLimitBannerDismissed(billingLimitWarnings, company.id, { now: Date.now() })) {
      return null;
    }

    return builtBanner;
  }, [billingAccessState, billingLimitWarnings, canManageBilling, company.id, hiddenOnRoute, paths, viewerRole, dismissedVersion]);

  const handleDismiss = React.useCallback(() => {
    if (!banner) return;

    Billing.dismissApproachingLimitBanner(company.id, banner.activeLimitKeys);
    setDismissedVersion((value) => value + 1);
  }, [banner, company.id]);

  if (!banner) {
    return null;
  }

  const isOverLimit = banner.mode === "over_limit";

  return (
    <div
      className={`fixed left-0 right-0 z-[999] border-t border-surface-outline shadow-lg ${isOverLimit ? "bg-callout-error-bg" : "bg-callout-warning-bg"} ${hasSupportSession ? "bottom-14 sm:bottom-12" : "bottom-0"}`}
      data-test-id="approaching-limit-banner"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex flex-1 items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-surface-outline bg-surface-base shadow-sm ${isOverLimit ? "text-callout-error-content" : "text-callout-warning-content"}`}
          >
            {isOverLimit ? <IconAlertTriangleFilled size={16} /> : <IconSparkles size={16} />}
          </div>

          <div className="min-w-0 flex-1">
            <div className={`text-sm font-semibold ${isOverLimit ? "text-callout-error-content" : "text-content-accent"}`}>{banner.title}</div>
            <p className={`mt-1 text-sm ${isOverLimit ? "text-callout-error-content" : "text-content-dimmed"}`}>{banner.description}</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {banner.usageRows.map((row) => (
                <div
                  key={row.label}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    row.state === "blocked"
                      ? "border-surface-outline bg-surface-base font-semibold text-callout-error-content"
                      : "border-surface-outline bg-surface-base text-content-dimmed"
                  }`}
                >
                  <span className={row.state === "blocked" ? "font-semibold text-callout-error-content" : "font-semibold text-content-accent"}>
                    {row.label}:
                  </span>{" "}
                  {row.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          {banner.cta && (
            <PrimaryButton linkTo={banner.cta.to} size="sm" testId="approaching-limit-banner-cta">
              {banner.cta.label}
            </PrimaryButton>
          )}

          {!isOverLimit && (
            <button
              type="button"
              className="rounded-full border border-transparent p-2 text-content-dimmed transition hover:border-surface-outline hover:bg-surface-base hover:text-content-accent"
              data-test-id="approaching-limit-banner-dismiss"
              aria-label="Dismiss approaching limit banner"
              onClick={handleDismiss}
            >
              <IconX size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getViewerRole(
  company: ReturnType<typeof useCompanyLoaderData>["company"],
  me: ReturnType<typeof useMe>,
): Billing.BillingLimitViewerRole {
  return includesId(
    company.owners?.map((owner) => owner.id) || [],
    me?.id,
  )
    ? "owner"
    : company.permissions?.isAdmin
      ? "company_admin"
      : "regular";
}
