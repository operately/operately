import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";
import {
  AvatarList,
  DivLink,
  IconBuilding,
  IconBuildingCommunity,
  IconInfoCircle,
  IconMail,
  Tabs,
  Tooltip,
  useTabs,
} from "turboui";

export const loader = async () => {
  return {};
};

export function Page() {
  const tabs = useTabs("active", [
    { id: "active", label: "Active Companies", icon: <IconBuildingCommunity size={16} /> },
    { id: "all", label: "All Companies", icon: <IconBuilding size={16} /> },
  ]);

  return (
    <Pages.Page title={"Administration"} testId="saas-admin-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <Options />
          <PageHeader activeTab={tabs.active} />
          <div className="-mx-4 -mb-px">
            <Tabs tabs={tabs} />
          </div>
          <CompanyListContainer activeTab={tabs.active} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageHeader({ activeTab }: { activeTab: string }) {
  if (activeTab === "active") {
    return <HeaderWithInfo />;
  }

  return <Paper.Header title="All Companies" />;
}

function HeaderWithInfo() {
  const tooltipContent = (
    <div className="max-w-xs">
      <div className="font-bold text-sm mb-2">Active Company Criteria</div>
      <ul className="text-xs space-y-1">
        <li>• Have multiple team members (2 or more)</li>
        <li>• Have multiple goals and projects (2 or more)</li>
        <li>• Show recent activity within the last 14 days</li>
      </ul>
    </div>
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Active Companies</h1>
        <Tooltip content={tooltipContent} testId="active-companies-info">
          <IconInfoCircle size={16} className="text-content-dimmed hover:text-content-accent cursor-help" />
        </Tooltip>
      </div>
    </div>
  );
}

function CompanyListContainer({ activeTab }: { activeTab: string }) {
  if (activeTab === "active") {
    return <ActiveCompanyList />;
  } else {
    return <AllCompanyList />;
  }
}

function AllCompanyList() {
  const { data: companiesData, loading, error } = AdminApi.useGetCompanies({});

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent">Loading companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading companies: {error.message}</p>
      </div>
    );
  }

  const companies = companiesData?.companies || [];

  return <CompanyTable companies={companies} />;
}

function ActiveCompanyList() {
  const { data: companiesData, loading, error } = AdminApi.useGetActiveCompanies({});

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent">Loading active companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading active companies: {error.message}</p>
      </div>
    );
  }

  const companies = companiesData?.companies || [];

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent text-lg">No active companies found</p>
        <p className="text-content-subtle text-sm mt-2">Companies need to meet all activity criteria to appear here</p>
      </div>
    );
  }

  return <CompanyTable companies={companies} />;
}

function CompanyTable({ companies }: { companies: AdminApi.Company[] }) {
  return (
    <div>
      <TableRow header>
        <div>#</div>
        <div>Company</div>
        <div className="text-right">People</div>
        <div className="text-right">Spaces</div>
        <div className="text-right">Goals</div>
        <div className="text-right">Projects</div>
        <div className="text-right">Owners</div>
        <div className="text-right">Last Activity</div>
        <div className="text-right">Created At</div>
      </TableRow>

      {companies.map((company, index) => (
        <TableRow key={company.id} linkTo={`/admin/companies/${company.id}`}>
          <div>{index + 1}</div>
          <div>{company.name}</div>
          <div className="text-right">{company.peopleCount}</div>
          <div className="text-right">{company.spacesCount}</div>
          <div className="text-right">{company.goalsCount}</div>
          <div className="text-right">{company.projectsCount}</div>

          <div className="flex justify-end -mt-0.5">
            <AvatarList people={company.owners!} size={20} maxElements={3} stacked />
          </div>

          <div className="text-right">
            {company.lastActivityAt && <FormattedTime time={company.lastActivityAt!} format="relative" />}
          </div>

          <div className="text-right">
            <FormattedTime time={company.insertedAt!} format="relative" />
          </div>
        </TableRow>
      ))}

      {window.appConfig.version && (
        <div className="flex justify-start mt-6 text-xs">
          <div className="bg-surface-dimmed px-3 py-1 rounded-full">Version: {window.appConfig.version}</div>
        </div>
      )}
    </div>
  );
}

function TableRow({ header, children, linkTo }: { header?: boolean; children: React.ReactNode; linkTo?: string }) {
  const className = classNames("grid pt-3 pb-2 items-center gap-2", {
    "border-y border-stroke-base": header,
    "border-b border-stroke-base": !header,
    "font-bold text-xs uppercase": header,
    "text-sm": !header,
    "-mx-4 px-4": true,
    "bg-surface-dimmed": header,
    "hover:bg-surface-highlight": !header,
    "cursor-pointer": !header,
  });

  const style = { gridTemplateColumns: "0.5fr 4fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr" };

  if (linkTo) {
    return <DivLink to={linkTo} className={className} style={style} children={children} />;
  } else {
    return <div className={className} style={style} children={children} />;
  }
}

function Options() {
  return (
    <PageOptions.Root testId="options-button">
      <PageOptions.Link icon={IconMail} title="Email Configuration" to="/admin/email-settings" />
    </PageOptions.Root>
  );
}
