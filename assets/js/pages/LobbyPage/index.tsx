import * as Api from "@/api";
import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { Logo } from "@/layouts/DefaultLayout/Logo";
import { DivLink } from "@/components/Link";

import classnames from "classnames";

interface LoaderResult {
  companies: Api.Company[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    companies: await Api.getCompanies({
      includeMemberCount: true,
    }).then((res) => res.companies!),
  };
}

export function Page() {
  const { companies } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={"Lobby"}>
      <div className="m-12">
        <Logo width="32px" height="32px" />
        <div className="font-medium mt-8">Hey there! How's it going?</div>
        <div className="font-medium">Select one of your organizations below to get started:</div>
        <CompanyCards companies={companies} />
      </div>
    </Pages.Page>
  );
}

function CompanyCards({ companies }: { companies: Api.Company[] }) {
  return (
    <div className="flex flex-wrap gap-4 mt-8">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}

      <AddCompanyCard />
    </div>
  );
}

function CompanyCard({ company }) {
  const className = classnames(
    "cursor-pointer",
    "rounded-lg",
    "bg-surface",
    "px-4 py-3 w-64",
    "border border-surface-outline",
    "relative",
    "hover:shadow transition-shadow",
  );

  return (
    <DivLink to={`/${company.id}`} className={className}>
      <Icons.IconBuildingEstate size={40} className="text-cyan-500" strokeWidth={1} />
      <div className="font-medium mt-2">{company.name}</div>
      <div className="text-xs">12 members</div>
    </DivLink>
  );
}

function AddCompanyCard() {
  const className = classnames(
    "cursor-pointer",
    "rounded-lg",
    "bg-accent-1",
    "text-white-1",
    "px-4 py-3 w-64",
    "border border-surface-outline",
    "relative",
    "hover:shadow transition-shadow",
  );

  return (
    <DivLink to={`/new`} className={className}>
      <div className="font-bold text-lg">+ Create new</div>
      <div className="text-sm font-medium">Add new organization</div>
      <div className="flex justify-end mt-3">
        <Icons.IconSparkles size={32} className="text-white-1" strokeWidth={1} />
      </div>
    </DivLink>
  );
}
