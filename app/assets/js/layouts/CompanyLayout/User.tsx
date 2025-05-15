import React from "react";

import { Avatar } from "turboui";
import { Link } from "react-router-dom";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { Paths } from "@/routes/paths";

export function User() {
  const me = useMe();

  if (!me) return null;

  return (
    <Link
      to={Paths.accountPath()}
      className="flex items-center cursor-pointer border border-stroke-base rounded-full"
      style={{ height: "32px", width: "32px" }}
      data-test-id="account-menu"
    >
      <Avatar person={me} size={30} />
    </Link>
  );
}
