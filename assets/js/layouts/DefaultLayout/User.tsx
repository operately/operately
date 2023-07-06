import React from "react";

import Avatar, { AvatarSize } from "../../components/Avatar";
import { useMe } from "../../graphql/Me";
import * as Icons from "@tabler/icons-react";

export default function User() {
  const { data, loading, error } = useMe();

  if (loading) return <div></div>;
  if (error) return <div></div>;

  return (
    <div className="flex items-center gap-2">
      <Avatar person={data.me} />
    </div>
  );
}
