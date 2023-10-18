import React from "react";

import Avatar from "../../components/Avatar";
import { useMe } from "../../graphql/Me";
import { Link } from "react-router-dom";

export default function User() {
  const { data, loading, error } = useMe();

  if (loading) return <div></div>;
  if (error) return <div></div>;

  return (
    <Link to="/account" className="flex items-center gap-2 cursor-pointer">
      <Avatar person={data.me} size={28} />
    </Link>
  );
}
