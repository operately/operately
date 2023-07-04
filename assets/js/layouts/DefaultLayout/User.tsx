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
      <div className="border border-shade-3 p-0.5 rounded-full">
        <Avatar size={AvatarSize.Tiny} person={data.me} />
      </div>
      <div className="text-sm font-medium text-white-1">{data.me.fullName}</div>
      <Icons.IconChevronDown size={16} />
    </div>
  );
}
