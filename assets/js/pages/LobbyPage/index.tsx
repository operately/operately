import * as Api from "@/api";
import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as People from "@/models/people";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { DivLink, Link } from "@/components/Link";

import classnames from "classnames";
import { Paths } from "@/routes/paths";
import plurarize from "@/utils/plurarize";

interface LoaderResult {
  account: Api.Account;
  companies: Api.Company[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    account: await Api.getAccount({}).then((res) => res.account!),
    companies: await Api.getCompanies({
      includeMemberCount: true,
    }).then((res) => res.companies!),
  };
}

export function Page() {
  const { account, companies } = Pages.useLoadedData<LoaderResult>();

  const fistName = People.firstName(account);

  return (
    <Pages.Page title={"Lobby"} testId="lobby-page">
      <div className="p-4 py-8 sm:p-8 lg:p-12">
        <OperatelyLogo width="32px" height="32px" />
        <div className="font-medium mt-4 sm:mt-8">Hey there, {fistName}! How's it going?</div>
        <div className="font-medium hidden sm:block">Select one of your organizations below to get started:</div>
        <CompanyCards companies={companies} />
        <AdminsAndDevLinks />
      </div>
    </Pages.Page>
  );
}

function AdminsAndDevLinks() {
  const { account } = Pages.useLoadedData<LoaderResult>();

  const isAdmin = account.siteAdmin;
  const isDev = window.appConfig.showDevBar;

  if (!isAdmin && !isDev) return null;

  const adminLink = (
    <Link to="/admin" className="font-medium">
      Admin Panel
    </Link>
  );

  const designLink = (
    <Link to="/__design__" className="font-medium">
      Design System
    </Link>
  );

  if (isAdmin && isDev) {
    return (
      <div className="font-medium mt-8">
        Or, visit the {adminLink} or the {designLink}.
      </div>
    );
  }

  if (isAdmin) {
    return <div className="font-medium mt-8">Or, visit the {adminLink}.</div>;
  }

  if (isDev) {
    return <div className="font-medium mt-8">Or, visit the {designLink}.</div>;
  }

  throw new Error("This should never happen");
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
      <Icons.IconBuildingEstate size={40} className="text-cyan-500" strokeWidth={1} />
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
      <div className="font-bold sm:text-lg">+ Create new</div>
      <div className="text-xs sm:text-sm font-medium">Add new organization</div>
      <div className="flex justify-end mt-3">
        <Icons.IconSparkles size={32} className="text-white-1" strokeWidth={1} />
      </div>
    </DivLink>
  );
}
