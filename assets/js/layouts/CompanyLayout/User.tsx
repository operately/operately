import React from "react";

import Avatar from "@/components/Avatar";
import { DivLink } from "@/components/Link";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { Paths } from "@/routes/paths";

export function User() {
  const me = useMe();

  return (
    <DivLink
      to={Paths.accountPath()}
      className="flex items-center cursor-pointer border border-stroke-base rounded-full"
      style={{ height: "32px", width: "32px" }}
      data-test-id="account-menu"
    >
      <Avatar person={me} size={30} />
    </DivLink>
  );
}
