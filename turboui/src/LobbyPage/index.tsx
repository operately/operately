import React from "react";

import { CurrentVersion } from "../CurrentVersion";
import { IconBuildingEstate, IconSparkles } from "../icons";
import { DivLink, Link } from "../Link";
import { OperatelyLogo } from "../Logo";
import { useHtmlTitle } from "../Page/useHtmlTitle";
import classNames from "../utils/classnames";
import { plurarize } from "../utils/plurarize";

export namespace LobbyPage {
  export interface Company {
    id: string;
    name: string;
    memberCount: number;
    link: string;
  }

  export interface Props {
    firstName: string;
    companies: Company[];
    newCompanyPath: string;
    adminPath?: string | null;
    version?: string | null;
    showCurrentVersion?: boolean;
  }
}

export function LobbyPage(props: LobbyPage.Props) {
  useHtmlTitle("Lobby");

  return (
    <div data-test-id="lobby-page">
      <div className="flex min-h-dvh flex-col p-4 py-8 sm:p-8 lg:p-12">
        <div>
          <OperatelyLogo width="32px" height="32px" />
          <div className="font-medium mt-4 sm:mt-8">Welcome to Operately, {props.firstName}!</div>
          <div className="font-medium hidden sm:block">Let's get you started</div>
          <CompanyCards companies={props.companies} newCompanyPath={props.newCompanyPath} />
          <AdminsLink adminPath={props.adminPath} />
        </div>

        {props.showCurrentVersion && (
          <div className="mt-auto pt-12">
            <CurrentVersion version={props.version} />
          </div>
        )}
      </div>
    </div>
  );
}

function AdminsLink({ adminPath }: { adminPath?: string | null }) {
  if (!adminPath) return null;

  const adminLink = (
    <Link to={adminPath} className="font-medium">
      Admin Panel
    </Link>
  );

  return <div className="font-medium mt-8">Or, visit the {adminLink}.</div>;
}

function CompanyCards({ companies, newCompanyPath }: { companies: LobbyPage.Company[]; newCompanyPath: string }) {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 mt-8">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}

      <AddCompanyCard newCompanyPath={newCompanyPath} />
    </div>
  );
}

function CompanyCard({ company }: { company: LobbyPage.Company }) {
  const className = classNames(
    "cursor-pointer",
    "rounded-lg",
    "bg-surface-base",
    "px-4 py-3 w-full sm:w-64 sm:px-4 sm:py-3",
    "border border-surface-outline",
    "relative",
    "hover:shadow transition-shadow",
  );

  return (
    <DivLink to={company.link} className={className}>
      <IconBuildingEstate size={40} className="text-cyan-500" strokeWidth={1} />
      <div className="font-medium mt-2">{company.name}</div>
      <div className="text-xs">{plurarize(company.memberCount, "member", "members")}</div>
    </DivLink>
  );
}

function AddCompanyCard({ newCompanyPath }: { newCompanyPath: string }) {
  const className = classNames(
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
    <DivLink to={newCompanyPath} className={className} testId="add-company-card">
      <div className="font-bold sm:text-lg">+ Create organization</div>
      <div className="text-xs sm:text-sm font-medium">Start fresh with a new company account</div>
      <div className="absolute bottom-2 right-2">
        <IconSparkles size={24} className="text-white-1" strokeWidth={1.5} />
      </div>
    </DivLink>
  );
}
