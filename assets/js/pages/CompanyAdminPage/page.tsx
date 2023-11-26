import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Person } from "@/gql";

import Avatar from "@/components/Avatar";

import { useLoadedData } from "./loader";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={[company.name, "Admininstration"]}>
      <Paper.Root size="small">
        <Paper.Body minHeight="none">
          <div className="uppercase text-sm text-content-dimmed">Company Admininstration</div>
          <div className="text-content-accent text-3xl font-extrabold">{company.name}</div>

          <div className="text-content-accent font-bold mt-8 text-lg">What's this?</div>
          <p>
            This is the company administration page where owners and admins can manage the company's settings. They have
            special permissions to add or remove people, change who can access the applicacation, and more. If you need
            something done, contact one of them.
          </p>

          <div className="text-content-accent font-bold mt-8 text-lg">Administrators</div>
          <CompanyAdmins />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function CompanyAdmins() {
  const { company } = useLoadedData();

  return (
    <div className="flex flex-wrap mt-2">
      {company.admins!.map((admin) => (
        <CompanyAdmin key={admin!.id} admin={admin! as Person} />
      ))}
    </div>
  );
}

function CompanyAdmin({ admin }: { admin: Person }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar person={admin} size="small" />
      <div className="font-medium">{admin.fullName}</div>
    </div>
  );
}
