import React from "react";

import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";
import { useMe } from "../../graphql/Me";

export default function User() {
  const { data, loading, error } = useMe();

  if (loading) return <div></div>;
  if (error) return <div></div>;

  return <Avatar size={AvatarSize.Small} person={data.me} />;
}
