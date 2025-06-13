import React from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Link } from "react-router-dom";
import { Avatar } from "turboui";

import { usePaths } from "@/routes/paths";
export function User() {
  const paths = usePaths();
  const me = useMe();

  if (!me) return null;

  return (
    <Link
      to={paths.accountPath()}
      className="flex items-center cursor-pointer border border-stroke-base rounded-full"
      style={{ height: "32px", width: "32px" }}
      data-test-id="account-menu"
    >
      <Avatar person={me} size={30} />
    </Link>
  );
}
