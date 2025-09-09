import * as Api from "@/api";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as React from "react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { DivLink, IconBuildingEstate, IconSparkles, Link } from "turboui";

import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import plurarize from "@/utils/plurarize";
import classnames from "classnames";

export default { name: "LobbyPage", loader, Page } as PageModule;

interface LoaderResult {
  account: Api.Account;
  companies: Api.Company[];
}

async function loader(): Promise<LoaderResult> {
  return {
    account: await Api.getAccount({}).then((res) => res.account!),
    companies: await Api.getCompanies({
      includeMemberCount: true,
    }).then((res) => res.companies!),
  };
}

function Page() {
  const { account, companies } = Pages.useLoadedData<LoaderResult>();

  assertPresent(account.fullName);
  const firstName = People.firstName({ fullName: account.fullName });

  return (
    <Pages.Page title={"Lobby"} testId="lobby-page">
      <div className="p-4 py-8 sm:p-8 lg:p-12">
        <OperatelyLogo width="32px" height="32px" />
        <div className="font-medium mt-4 sm:mt-8">Welcome to Operately, {firstName}!</div>
        <div className="font-medium hidden sm:block">Let's get you started</div>
        <CompanyCards companies={companies} />
        <AdminsLink />
      </div>
    </Pages.Page>
  );
}

function AdminsLink() {
  const { account } = Pages.useLoadedData<LoaderResult>();

  if (!account.siteAdmin) return null;

  const adminLink = (
    <Link to="/admin" className="font-medium">
      Admin Panel
    </Link>
  );

  return <div className="font-medium mt-8">Or, visit the {adminLink}.</div>;
}

function CompanyCards({ companies }: { companies: Api.Company[] }) {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 mt-8">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}

      <AddCompanyCard />
    </div>
  );
}

function CompanyCard({ company }: { company: Api.Company }) {
  const className = classnames(
    "cursor-pointer",
    "rounded-lg",
    "bg-surface-base",
    "px-4 py-3 w-full sm:w-64 sm:px-4 sm:py-3",
    "border border-surface-outline",
    "relative",
    "hover:shadow transition-shadow",
  );

  return (
    <DivLink to={Paths.companyHomePath(company.id!)} className={className}>
      <IconBuildingEstate size={40} className="text-cyan-500" strokeWidth={1} />
      <div className="font-medium mt-2">{company.name}</div>
      <div className="text-xs">{plurarize(company.memberCount!, "member", "members")}</div>
    </DivLink>
  );
}

function AddCompanyCard() {
  const className = classnames(
    "cursor-pointer",
    "rounded-lg",
    "bg-accent-1",
    "text-white-1",
    "px-4 py-3 w-full sm:w-64 sm:px-4 sm:py-3",
    "border border-surface-outline",
    "relative",
    "hover:shadow transition-shadow",
  );

  return (
    <DivLink to={Paths.newCompanyPath()} className={className} testId="add-company-card">
      <div className="font-bold sm:text-lg">+ Create organization</div>
      <div className="text-xs sm:text-sm font-medium">Start fresh with a new company account</div>
      <div className="absolute bottom-2 right-2">
        <IconSparkles size={24} className="text-white-1" strokeWidth={1.5} />
      </div>
    </DivLink>
  );
}
