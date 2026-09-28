import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";
import { formatCompanyBillingDate, formatCompanyBillingPlanLabel } from "./formatting";
import i18n, { translationText } from "../i18n";

export function buildCompanyBillingSuccessFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  return {
    kind: "success",
    message: i18n.t("Upgrade confirmed"),
    description: i18n.t("This company is now on {{plan}}.", {
      plan: formatCompanyBillingPlanLabel(billing.account.planKey, billing.account.billingInterval, translationText(i18n.t("its new paid plan"))),
    }),
  };
}

export function buildCompanyBillingRecoveryFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  if (billing.account.pendingPlanKey) {
    return {
      kind: "pending",
        message: i18n.t("Checkout not completed yet"),
        description: i18n.t("You can start checkout again for {{plan}}.", {
          plan: formatCompanyBillingPlanLabel(billing.account.pendingPlanKey, billing.account.pendingBillingInterval),
        }),
    };
  }

  return {
    kind: "incomplete",
      message: i18n.t("Checkout not completed"),
      description: i18n.t("We couldn't confirm the checkout. You can go back to plan selection and try again."),
  };
}

export function buildCompanyBillingPlanChangeFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  if (billing.account.scheduledPlanKey) {
    const planLabel = formatCompanyBillingPlanLabel(
      billing.account.scheduledPlanKey,
      billing.account.scheduledBillingInterval,
      translationText(i18n.t("the new plan")),
    );
    const effectiveDate = formatCompanyBillingDate(billing.account.scheduledChangeEffectiveAt);

    return {
      kind: "success",
        message: i18n.t("Plan change scheduled"),
        description: effectiveDate
          ? i18n.t("{{plan}} will take effect at the next renewal on {{date}}.", { plan: planLabel, date: effectiveDate })
          : i18n.t("{{plan}} will take effect at the next renewal.", { plan: planLabel }),
    };
  }

  return {
    kind: "success",
      message: i18n.t("Plan updated"),
      description: i18n.t("This company is now on {{plan}}.", {
        plan: formatCompanyBillingPlanLabel(billing.account.planKey, billing.account.billingInterval, translationText(i18n.t("its new plan"))),
      }),
  };
}

export function buildCompanyBillingCancellationFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  const endDate = formatCompanyBillingDate(billing.account.currentPeriodEnd);

  return {
    kind: "success",
      message: i18n.t("Cancellation scheduled"),
      description: endDate
        ? i18n.t("This company will stay on its current paid plan until {{date}}.", { date: endDate })
        : i18n.t("This company will stay on its current paid plan until the end of the current billing period."),
  };
}

export function buildCompanyBillingReactivationFeedback(
  billing: CompanyBillingPageTypes.BillingOverview,
): CompanyBillingPageTypes.Feedback {
  return {
    kind: "success",
      message: i18n.t("Current plan kept"),
      description: i18n.t("This company will remain on {{plan}}.", {
        plan: formatCompanyBillingPlanLabel(billing.account.planKey, billing.account.billingInterval, translationText(i18n.t("its current paid plan"))),
      }),
  };
}
