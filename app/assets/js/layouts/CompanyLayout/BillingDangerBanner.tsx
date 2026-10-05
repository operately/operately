import * as React from "react";

import * as Billing from "@/models/billing";
import { useHasSupportSessionCookie } from "@/features/SupportSessions";
import { usePaths } from "@/routes/paths";
import { useLocation } from "react-router";
import { BillingDangerBanner as BillingDangerBannerUI } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export function BillingDangerBanner() {
  const formattedTimePreferences = useFormattedTimePreferences();
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

    return Billing.buildBillingDangerBanner(billingAccessState, canManageBilling, {
      companyBillingPath: () => paths.companyBillingPath(),
      companyBillingPlansPath: (opts) => paths.companyBillingPlansPath(opts),
    });
  }, [billingAccessState, canManageBilling, hiddenOnRoute, paths]);

  if (!banner) {
    return null;
  }

  return (
    <BillingDangerBannerUI
      banner={banner}
      formattedTimePreferences={formattedTimePreferences}
      hasSupportSession={hasSupportSession}
    />
  );
}
