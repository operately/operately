import { formatCompanyBillingPlanLabel } from "turboui/CompanyBilling";
import type { BillingLimitError } from "./limitError";

export type BillingLimitViewerRole = "owner" | "company_admin" | "regular";

export interface BillingLimitGuidance {
  title: string;
  description: string;
  usageSummary: string;
  recommendedPlanLabel: string | null;
  cta: { label: string; to: string } | null;
}

interface BillingLimitGuidanceRoutes {
  companyBillingPath: () => string;
  companyBillingPlansPath: (opts?: { plan?: string | null; billingPeriod?: string | null }) => string;
}

export function buildMemberLimitGuidance(
  error: BillingLimitError,
  role: BillingLimitViewerRole,
  routes: BillingLimitGuidanceRoutes,
): BillingLimitGuidance {
  const recommendedPlanLabel = error.recommendedUpgrade.target
    ? formatCompanyBillingPlanLabel(error.recommendedUpgrade.target.plan, error.recommendedUpgrade.target.billingInterval)
    : null;

  const usageSummary = `This company has ${error.currentUsage} active members. The plan includes ${error.limit}.`;

  if (role === "owner" || role === "company_admin") {
    return {
      title: "This company has reached its member limit",
      description: "Review billing to change the plan and add or restore people.",
      usageSummary,
      recommendedPlanLabel,
      cta: {
        label: "Review billing",
        to: error.recommendedUpgrade.target
          ? routes.companyBillingPlansPath({
              plan: error.recommendedUpgrade.target.plan,
              billingPeriod: error.recommendedUpgrade.target.billingInterval,
            })
          : routes.companyBillingPath(),
      },
    };
  }

  return {
    title: "This company has reached its member limit",
    description: "Contact an admin or owner to review billing and change the plan before trying again.",
    usageSummary,
    recommendedPlanLabel: null,
    cta: null,
  };
}
