import * as React from "react";
import { Person } from "@/gql";

import Avatar from "@/components/Avatar";

import { useLoadedData } from "./loader";

export function CompanyAdmins() {
  const { company } = useLoadedData();

  return (
    <div>
      <div className="text-content-accent font-bold mt-8 text-lg">Administrators</div>

      <div className="flex flex-wrap mt-2">
        {company.admins!.map((admin) => (
          <CompanyAdmin key={admin!.id} admin={admin! as Person} />
        ))}
      </div>
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
