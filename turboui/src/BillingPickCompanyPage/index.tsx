import React from "react";
import { useTranslation } from "react-i18next";
import type { Company } from "../ApiTypes";
import { formatCompanyBillingPlanName } from "../CompanyBilling/formatting";
import { tn } from "../i18n";
import { CompanyPickerPage } from "../CompanyPickerPage";
import { Trans } from "../Translate";

export namespace BillingPickCompanyPage {
  export interface Props {
    companies: Pick<Company, "id" | "name" | "memberCount">[];
    plan: string | null;
    billingPeriod: string | null;
    billingPath: (companyId: string) => string;
  }
}

export function BillingPickCompanyPage({ companies, plan, billingPeriod, billingPath }: BillingPickCompanyPage.Props) {
  const { t } = useTranslation();
  const interval =
    billingPeriod === "monthly" ? t("monthly") : billingPeriod === "yearly" ? t("yearly") : billingPeriod;

  return (
    <CompanyPickerPage
      companies={companies}
      companyPath={billingPath}
      testId="billing-pick-company-page"
      description={
        <>
          <div className="text-content-accent mt-1">{t("Which company would you like to manage billing for?")}</div>
          {plan && (
            <div className="text-content-dimmed text-sm mt-1">
              {interval ? (
                <Trans
                  i18nKey="Selected plan: <plan>{{plan}}</plan> <interval>({{interval}})</interval>"
                  values={{ plan: formatCompanyBillingPlanName(plan, plan), interval }}
                  components={{
                    plan: <span className="font-semibold" />,
                    interval: <span className="capitalize" />,
                  }}
                />
              ) : (
                <Trans
                  i18nKey="Selected plan: <plan>{{plan}}</plan>"
                  values={{ plan: formatCompanyBillingPlanName(plan, plan) }}
                  components={{ plan: <span className="font-semibold" /> }}
                />
              )}
            </div>
          )}
        </>
      }
      emptyState={t("You don't have access to manage billing for any companies yet.")}
      renderCompanyDetails={(company) => tn("1 member", "{{count}} members", company.memberCount ?? 0)}
    />
  );
}
