import React from 'react';

import { NavLink } from 'react-router-dom';

interface LinkProps {
  to: string;
  title: string | null;
  icon: JSX.Element | null;
}

export default function Link({to, title, icon}: LinkProps) : JSX.Element {
  const baseClass = "block rounded p-2 py-1 text-[18px] flex gap-2 font-semibold";

  const classNameHandler = ({isActive, isPending}) => {
    if(isActive) return baseClass + ' text-dark-1 bg-light-base';
    if(isPending) return baseClass + ' text-dark-1 bg-light-base';

    return baseClass + ' text-dark-2 hover:bg-light-gray';
  };

  return (
    <li>
      <NavLink to={to} className={classNameHandler}>
        {({ isActive, isPending }) => {
          if(isActive || isPending) {
            return <>
              <div className="text-brand-base">{icon}</div>
              <div>{title}</div>
            </>;
          }
          else {
            return <>
              <div>{icon}</div>
              <div>{title}</div>
            </>;
          }
        }}
      </NavLink>
    </li>
  );
}
