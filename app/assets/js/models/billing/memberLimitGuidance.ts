import { formatPlanLabel } from "./planFormatting";
import type { BillingLimitError } from "./limitError";

export type BillingLimitViewerRole = "owner" | "company_admin" | "regular";

export interface BillingLimitGuidance {
  title: string;
  description: string;
  usageSummary: string;
  recommendedPlanLabel: string | null;
  cta: { label: string; to: string } | null;
}

export interface BillingLimitGuidanceRoutes {
  companyBillingPath: () => string;
  companyBillingPlansPath: (opts?: { plan?: string | null; billingPeriod?: string | null }) => string;
}

export function buildMemberLimitGuidance(
  error: BillingLimitError,
  role: BillingLimitViewerRole,
  routes: BillingLimitGuidanceRoutes,
): BillingLimitGuidance {
  const recommendedPlanLabel = error.recommendedUpgrade.target
    ? formatPlanLabel(error.recommendedUpgrade.target.plan, error.recommendedUpgrade.target.billingInterval)
    : null;

  const usageSummary = `This company has ${error.currentUsage} users. The limit is ${error.limit}.`;

  if (role === "owner") {
    return {
      title: "This company has reached its member limit",
      description: "Review the available company plans to add more people.",
      usageSummary,
      recommendedPlanLabel,
      cta: {
        label: "Review upgrade options",
        to: error.recommendedUpgrade.target
          ? routes.companyBillingPlansPath({
              plan: error.recommendedUpgrade.target.plan,
              billingPeriod: error.recommendedUpgrade.target.billingInterval,
            })
          : routes.companyBillingPath(),
      },
    };
  }

  if (role === "company_admin") {
    return {
      title: "This company has reached its member limit",
      description: "A company owner needs to upgrade the company plan before you can add or restore people.",
      usageSummary,
      recommendedPlanLabel,
      cta: null,
    };
  }

  return {
    title: "This company has reached its member limit",
    description: "Contact a company owner or company admin and ask them to upgrade the plan before trying again.",
    usageSummary,
    recommendedPlanLabel: null,
    cta: null,
  };
}
