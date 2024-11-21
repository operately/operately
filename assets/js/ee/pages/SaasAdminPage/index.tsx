import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as AdminApi from "@/ee/admin_api";

export const loader = Pages.emptyLoader;

export function Page() {
  const { data } = AdminApi.useGetCompanies({});

  if (!data) {
    return null;
  }

  return (
    <Pages.Page title={"Admininstration"} testId="saas-admin-page">
      <Paper.Root size="large">
        <Paper.Body>
          <Paper.Header title="Companies" />
          <CompanyList companies={data.companies!} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function CompanyList({ companies }: { companies: AdminApi.Company[] }) {
  return (
    <div>
      {companies.map((company) => (
        <div key={company.id} className="border-t border-stroke-base py-3">
          <h2>{company.name}</h2>
        </div>
      ))}
    </div>
  );
}
