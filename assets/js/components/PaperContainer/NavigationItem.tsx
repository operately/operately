import React from "react";
import Icon from "../Icon";
import { Link } from "react-router-dom";

interface NavigationItemProps {
  icon: string;
  title: string;
  to: string;
}

export default function NavigationItem({
  icon,
  title,
  to,
}: NavigationItemProps): JSX.Element {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 text-brand-1 underline cursor-pointer"
      style={{
        textUnderlineOffset: "0.22rem",
        textDecorationColor: "var(--color-brand-1)",
      }}
    >
      <Icon size="base" name={icon} color="dark-2" hoverColor="dark-2" />
      {title}
    </Link>
  );
}
