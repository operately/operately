import Api, { Company } from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { IconBuildingEstate } from "turboui";
import { PageModule } from "@/routes/types";
import classnames from "classnames";
import plurarize from "@/utils/plurarize";
import { useNavigate } from "react-router-dom";

export default { name: "BillingPickCompanyPage", loader, Page } as PageModule;

interface LoaderResult {
  companies: Company[];
}

async function loader(): Promise<LoaderResult> {
  const companies = await Api.companies
    .list({ includeMemberCount: true, isCompanyOwner: true })
    .then((res) => res.companies || []);

  return { companies };
}

function Page() {
  const { companies } = Pages.useLoadedData<LoaderResult>();
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan");
  const billingPeriod = params.get("billing_period");

  return (
    <Pages.Page title={["Select Company"]} testId="billing-pick-company-page">
      <Paper.Root size="small" className="mt-24">
        <Paper.Body>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-content-accent text-xl font-semibold">Select a company</div>
              <div className="text-content-accent mt-1">
                Which company would you like to manage billing for?
              </div>
              {plan && (
                <div className="text-content-dimmed text-sm mt-1">
                  Selected plan: <span className="font-semibold capitalize">{plan}</span>
                  {billingPeriod && (
                    <span className="capitalize"> ({billingPeriod})</span>
                  )}
                </div>
              )}
            </div>
            <OperatelyLogo width="40" height="40" />
          </div>

          <CompanyList companies={companies} plan={plan} billingPeriod={billingPeriod} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function CompanyList({
  companies,
  plan,
  billingPeriod,
}: {
  companies: Company[];
  plan: string | null;
  billingPeriod: string | null;
}) {
  if (companies.length === 0) {
    return (
      <div className="text-center text-content-dimmed py-8">
        You are not a member of any companies.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {companies.map((company) => (
        <CompanyRow key={company.id} company={company} plan={plan} billingPeriod={billingPeriod} />
      ))}
    </div>
  );
}

function CompanyRow({
  company,
  plan,
  billingPeriod,
}: {
  company: Company;
  plan: string | null;
  billingPeriod: string | null;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    const query = new URLSearchParams();
    if (plan) query.set("plan", plan);
    if (billingPeriod) query.set("billing_period", billingPeriod);

    const queryString = query.toString();
    const billingPath = `/${company.id}/admin/billing${queryString ? "?" + queryString : ""}`;
    navigate(billingPath);
  };

  const className = classnames(
    "cursor-pointer",
    "rounded-lg",
    "bg-surface-base",
    "px-4 py-3",
    "border border-surface-outline",
    "relative",
    "hover:shadow transition-shadow",
    "flex items-center gap-3",
  );

  return (
    <div onClick={handleClick} className={className}>
      <IconBuildingEstate size={40} className="text-cyan-500" strokeWidth={1} />
      <div className="flex-1">
        <div className="font-medium">{company.name}</div>
        <div className="text-xs text-content-dimmed">
          {plurarize(company.memberCount || 0, "member", "members")}
        </div>
      </div>
    </div>
  );
}
