import React from "react";
import * as Companies from "@/models/companies";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";

export function ToggleCompanyOwner() {
  return (
    <div className="">
      CompanyOwner [<Toggle />]
    </div>
  );
}

function Toggle() {
  const me = useMe();
  const id = window.location.pathname.split("/")[1];
  const { data, loading } = Companies.useGetCompany({ id: id, includeAdmins: true });

  const [add] = Companies.useAddCompanyAdmins();
  const [remove] = Companies.useRemoveCompanyAdmin();

  const isAdmin = data?.company?.admins?.some((admin) => compareIds(admin.id, me!.id));

  const status = isAdmin ? "YES" : "NO";
  const color = isAdmin ? "text-green-500" : "text-white-1";

  const className = color + " cursor-pointer";

  const toggle = async () => {
    if (isAdmin) {
      await remove({ personId: me!.id! });
      window.location.reload();
    } else {
      await add({ peopleIds: [me!.id!] });
      window.location.reload();
    }
  };

  return (
    <span className={className} onClick={toggle}>
      {loading ? "..." : status}
    </span>
  );
}
