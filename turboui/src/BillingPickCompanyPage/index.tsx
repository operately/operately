import React from "react";
import { useTranslation } from "react-i18next";
import type { Company } from "../ApiTypes";
import { formatCompanyBillingPlanName } from "../CompanyBilling/formatting";
import { IconBuildingEstate } from "../icons";
import { tn } from "../i18n";
import { DivLink } from "../Link";
import { OperatelyLogo } from "../Logo";
import { PageOpen } from "../Page";
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
    <PageOpen title={t("Select Company")} size="small" className="mt-24" testId="billing-pick-company-page">
      <div className="relative bg-surface-base min-h-dvh sm:min-h-0 sm:border sm:border-surface-outline sm:rounded-lg sm:shadow-xl">
        <div className="px-10 py-8">
          <div className="flex items-center justify-between mb-8 gap-3">
            <div className="min-w-0 break-words">
              <div className="text-content-accent text-xl font-semibold">{t("Select a company")}</div>
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
            </div>
            <div className="shrink-0">
              <OperatelyLogo width="40" height="40" />
            </div>
          </div>

          {companies.length === 0 ? (
            <div className="text-center text-content-dimmed py-8">
              {t("You don't have access to manage billing for any companies yet.")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {companies.map((company) => (
                <DivLink
                  key={company.id}
                  to={billingPath(company.id)}
                  className="cursor-pointer rounded-lg bg-surface-base px-4 py-3 border border-surface-outline relative hover:shadow transition-shadow flex items-center gap-3"
                >
                  <IconBuildingEstate size={40} className="text-cyan-500 shrink-0" strokeWidth={1} />
                  <div className="flex-1 min-w-0 break-words">
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs text-content-dimmed">
                      {tn("1 member", "{{count}} members", company.memberCount ?? 0)}
                    </div>
                  </div>
                </DivLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageOpen>
  );
}
