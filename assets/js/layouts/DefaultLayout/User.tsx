import React from "react";

import Avatar from "@/components/Avatar";
import { Link } from "react-router-dom";
import { useMe } from "@/contexts/CurrentUserContext";

export function User() {
  const me = useMe();

  return (
    <Link
      to="/account"
      className="flex items-center cursor-pointer border border-stroke-base rounded-full"
      style={{ height: "32px", width: "32px" }}
    >
      <Avatar person={me} size={30} />
    </Link>
  );
}
