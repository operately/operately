import * as React from "react";
import * as People from "@/models/people";

import Avatar from "@/components/Avatar";

import { useLoadedData } from "./loader";

export function AccountOwners() {
  const { company } = useLoadedData();

  return (
    <div>
      <div className="text-content-accent font-bold mt-8 text-lg">Account Owners</div>

      <div className="flex flex-wrap mt-2 gap-4">
        {company.admins!.map((admin) => (
          <Owner key={admin!.id} admin={admin!} />
        ))}
      </div>
    </div>
  );
}

function Owner({ admin }: { admin: People.Person }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar person={admin} size="small" />
      <div className="font-medium">{admin.fullName}</div>
    </div>
  );
}
