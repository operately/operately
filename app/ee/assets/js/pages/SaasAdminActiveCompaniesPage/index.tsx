import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as AdminApi from "@/ee/admin_api";

import classNames from "classnames";
import FormattedTime from "@/components/FormattedTime";
import { DivLink, AvatarList } from "turboui";

interface LoaderData {
  companies: AdminApi.Company[];
}

export const loader = async () => {
  return { companies: await AdminApi.getActiveCompanies({}).then((res) => res.companies) };
};

export function Page() {
  return (
    <Pages.Page title={"Active Organizations"} testId="saas-admin-active-companies-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <Paper.Header title="Active Organizations" />
          <Navigation />
          <Description />
          <CompanyList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  return (
    <div className="mb-6">
      <div className="flex gap-4">
        <DivLink 
          to="/admin" 
          className="px-4 py-2 text-sm rounded hover:bg-surface-highlight"
        >
          All Organizations
        </DivLink>
        <DivLink 
          to="/admin/active-organizations" 
          className="px-4 py-2 text-sm rounded bg-surface-dimmed hover:bg-surface-highlight border-b-2 border-accent-1"
        >
          Active Organizations
        </DivLink>
      </div>
    </div>
  );
}

function Description() {
  return (
    <div className="mb-6">
      <p className="text-content-accent text-sm">
        These organizations show active engagement with Operately based on multiple criteria:
      </p>
      <ul className="text-content-accent text-sm mt-2 ml-4 list-disc">
        <li>Have multiple team members (2 or more)</li>
        <li>Have multiple goals and projects (2 or more each)</li>
        <li>Show recent activity within the last 30 days</li>
      </ul>
    </div>
  );
}

function CompanyList() {
  const { companies } = Pages.useLoadedData<LoaderData>();

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent text-lg">No active organizations found</p>
        <p className="text-content-subtle text-sm mt-2">
          Organizations need to meet all activity criteria to appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-content-accent">
          Found {companies.length} active organization{companies.length !== 1 ? 's' : ''}
        </p>
      </div>

      <TableRow header>
        <div>#</div>
        <div>Organization</div>
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
    </div>
  );
}

function TableRow({ header, children, linkTo }: { header?: boolean; children: React.ReactNode; linkTo?: string }) {
  const className = classNames("grid pt-3 pb-2 items-center gap-2", {
    "border-y border-stroke-base": header,
    "border-b border-stroke-base": !header,
    "font-bold text-xs uppercase": header,
    "text-sm": !header,
    "-mx-12 px-12": true,
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