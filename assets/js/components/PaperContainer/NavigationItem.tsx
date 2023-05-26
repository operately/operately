import React from "react";
import Icon from "../Icon";

interface NavigationItemProps {
  icon: string;
  title: string;
}

export default function NavigationItem({
  icon,
  title,
}: NavigationItemProps): JSX.Element {
  return (
    <div
      className="flex items-center gap-2.5 text-brand-1 underline cursor-pointer"
      style={{
        textUnderlineOffset: "0.22rem",
        textUnderlineColor: "var(--color-brand-1)",
      }}
    >
      <Icon size="base" name={icon} color="dark-2" hoverColor="dark-2" />
      {title}
    </div>
  );
}
