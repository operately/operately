import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";
import { AvatarList, DivLink } from "turboui";

interface LoaderData {
  companies: AdminApi.Company[];
}

export const loader = async () => {
  return { companies: await AdminApi.getCompanies({}).then((res) => res.companies) };
};

export function Page() {
  return (
    <Pages.Page title={"Admininstration"} testId="saas-admin-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <Paper.Header title="All Organizations" />
          <Navigation />
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
          className="px-4 py-2 text-sm rounded bg-surface-dimmed hover:bg-surface-highlight border-b-2 border-accent-1"
        >
          All Organizations
        </DivLink>
        <DivLink to="/admin/active-organizations" className="px-4 py-2 text-sm rounded hover:bg-surface-highlight">
          Active Organizations
        </DivLink>
      </div>
    </div>
  );
}

function CompanyList() {
  const { companies } = Pages.useLoadedData<LoaderData>();

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
