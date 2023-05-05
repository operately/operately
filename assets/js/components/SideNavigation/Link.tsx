import React from "react";

import { NavLink } from "react-router-dom";
import Icon from "../Icon";

interface LinkProps {
  to: string;
  title: string | null;
  icon: string;
}

export default function Link({ to, title, icon }: LinkProps): JSX.Element {
  const baseClass =
    "block rounded px-2 py-1.5 text-[16px] flex gap-1.5 items-center font-semibold";

  const classNameHandler = ({ isActive, isPending }) => {
    if (isActive) return baseClass + " text-dark-base bg-light-base";
    if (isPending) return baseClass + " text-dark-base bg-light-base";

    return baseClass + " text-dark-1 hover:bg-light-gray";
  };

  return (
    <li>
      <NavLink to={to} className={classNameHandler}>
        {({ isActive, isPending }) => {
          if (isActive || isPending) {
            return (
              <>
                <Icon name={icon} size="base" color="brand" />
                <div className="mt-0.5">{title}</div>
              </>
            );
          } else {
            return (
              <>
                <Icon name={icon} size="base" color="dark" />
                <div className="mt-0.5">{title}</div>
              </>
            );
          }
        }}
      </NavLink>
    </li>
  );
}
