import { formatCompanyBillingPlanLabel } from "turboui/CompanyBilling";
import type { BillingLimitError } from "./limitError";
import i18n from "@/i18n";

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
    ? formatCompanyBillingPlanLabel(
        error.recommendedUpgrade.target.plan,
        error.recommendedUpgrade.target.billingInterval,
      )
    : null;

  const usageSummary = i18n.t("This company has {{currentUsage}} active members. The plan includes {{limit}}.", {
    currentUsage: error.currentUsage,
    limit: error.limit,
  });

  if (role === "owner" || role === "company_admin") {
    return {
      title: i18n.t("This company has reached its member limit"),
      description: i18n.t("Review billing to change the plan and add or restore people."),
      usageSummary,
      recommendedPlanLabel,
      cta: {
        label: i18n.t("Review billing"),
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
    title: i18n.t("This company has reached its member limit"),
    description: i18n.t("Contact an admin or owner to review billing and change the plan before trying again."),
    usageSummary,
    recommendedPlanLabel: null,
    cta: null,
  };
}
