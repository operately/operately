import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";
import { formatCompanyBillingDate, formatCompanyBillingPlanLabel } from "./formatting";

export function buildCompanyBillingSuccessFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  return {
    kind: "success",
    message: "Upgrade confirmed",
    description: `This company is now on ${formatCompanyBillingPlanLabel(billing.account.planKey, billing.account.billingInterval, "its new paid plan")}.`,
  };
}

export function buildCompanyBillingRecoveryFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  if (billing.account.pendingPlanKey) {
    return {
      kind: "pending",
      message: "Checkout not completed yet",
      description: `You can start checkout again for ${formatCompanyBillingPlanLabel(billing.account.pendingPlanKey, billing.account.pendingBillingInterval)}.`,
    };
  }

  return {
    kind: "incomplete",
    message: "Checkout not completed",
    description: "We couldn't confirm the checkout. You can go back to plan selection and try again.",
  };
}

export function buildCompanyBillingPlanChangeFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  if (billing.account.scheduledPlanKey) {
    const planLabel = formatCompanyBillingPlanLabel(
      billing.account.scheduledPlanKey,
      billing.account.scheduledBillingInterval,
      "the new plan",
    );
    const effectiveDate = formatCompanyBillingDate(billing.account.scheduledChangeEffectiveAt);

    return {
      kind: "success",
      message: "Plan change scheduled",
      description: effectiveDate
        ? `${planLabel} will take effect at the next renewal on ${effectiveDate}.`
        : `${planLabel} will take effect at the next renewal.`,
    };
  }

  return {
    kind: "success",
    message: "Plan updated",
    description: `This company is now on ${formatCompanyBillingPlanLabel(billing.account.planKey, billing.account.billingInterval, "its new plan")}.`,
  };
}

export function buildCompanyBillingCancellationFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  const endDate = formatCompanyBillingDate(billing.account.currentPeriodEnd);

  return {
    kind: "success",
    message: "Cancellation scheduled",
    description: endDate
      ? `This company will stay on its current paid plan until ${endDate}.`
      : "This company will stay on its current paid plan until the end of the current billing period.",
  };
}

export function buildCompanyBillingReactivationFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  return {
    kind: "success",
    message: "Current plan kept",
    description: `This company will remain on ${formatCompanyBillingPlanLabel(billing.account.planKey, billing.account.billingInterval, "its current paid plan")}.`,
  };
}
