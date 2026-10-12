import React from "react";
import { useTranslation } from "react-i18next";
import type { Company } from "../ApiTypes";
import { IconBuildingEstate } from "../icons";
import { DivLink } from "../Link";
import { OperatelyLogo } from "../Logo";
import { PageOpen } from "../Page";

export namespace CompanyPickerPage {
  export interface Props {
    companies: Pick<Company, "id" | "name" | "memberCount">[];
    companyPath: (companyId: string) => string;
    description: React.ReactNode;
    emptyState?: React.ReactNode;
    renderCompanyDetails?: (company: Props["companies"][number]) => React.ReactNode;
    testId?: string;
  }
}

export function CompanyPickerPage({
  companies,
  companyPath,
  description,
  emptyState,
  renderCompanyDetails,
  testId,
}: CompanyPickerPage.Props) {
  const { t } = useTranslation();

  return (
    <PageOpen title={t("Select Company")} size="small" className="mt-24" testId={testId}>
      <div className="relative bg-surface-base min-h-dvh sm:min-h-0 sm:border sm:border-surface-outline sm:rounded-lg sm:shadow-xl">
        <div className="px-10 py-8">
          <div className="flex items-center justify-between mb-8 gap-3">
            <div className="min-w-0 break-words">
              <div className="text-content-accent text-xl font-semibold">{t("Select a company")}</div>
              {description}
            </div>
            <div className="shrink-0">
              <OperatelyLogo width="40" height="40" />
            </div>
          </div>

          {companies.length === 0 ? (
            <div className="text-center text-content-dimmed py-8">{emptyState}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {companies.map((company) => (
                <DivLink
                  key={company.id}
                  to={companyPath(company.id)}
                  className="cursor-pointer rounded-lg bg-surface-base px-4 py-3 border border-surface-outline relative hover:shadow transition-shadow flex items-center gap-3"
                >
                  <IconBuildingEstate size={40} className="text-cyan-500 shrink-0" strokeWidth={1} />
                  <div className="flex-1 min-w-0 break-words">
                    <div className="font-medium">{company.name}</div>
                    {renderCompanyDetails && (
                      <div className="text-xs text-content-dimmed">{renderCompanyDetails(company)}</div>
                    )}
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
