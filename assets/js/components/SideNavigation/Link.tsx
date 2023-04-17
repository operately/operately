import React from 'react';

import { NavLink } from 'react-router-dom';

interface LinkProps {
  to: string;
  title: string | null;
  icon: JSX.Element | null;
}

export default function Link({to, title, icon}: LinkProps) : JSX.Element {
  const baseClass = "block rounded mx-6 p-2 py-1 text-[18px] font-medium flex gap-2";

  const classNameHandler = ({isActive, isPending}) => {
    if(isActive) return baseClass + ' text-dark-base bg-brandPrimaryLight-2';
    if(isPending) return baseClass + ' text-dark-2 bg-brandPrimaryLight-2';

    return baseClass + ' text-dark-2';
  };

  return (
    <li>
      <NavLink to={to} className={classNameHandler}>
        <div>{icon}</div>
        <div>{title}</div>
      </NavLink>
    </li>
  );
}
