import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as AdminApi from "@/ee/admin_api";

import classNames from "classnames";
import AvatarList from "@/components/AvatarList";
import FormattedTime from "@/components/FormattedTime";

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
          <Paper.Header title="Companies" />
          <CompanyList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function CompanyList() {
  const { companies } = Pages.useLoadedData<LoaderData>();

  return (
    <div>
      <TableRow header>
        <div>Company</div>
        <div className="text-right">People</div>
        <div className="text-right">Spaces</div>
        <div className="text-right">Goals</div>
        <div className="text-right">Projects</div>
        <div className="text-right">Owners</div>
        <div className="text-right">Last Activity</div>
      </TableRow>

      {companies.map((company) => (
        <TableRow key={company.id}>
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
        </TableRow>
      ))}
    </div>
  );
}

function TableRow({ header, children }: { header?: boolean; children: React.ReactNode }) {
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

  return (
    <div className={className} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
      {children}
    </div>
  );
}
