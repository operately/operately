import React from 'react';

import { NavLink } from 'react-router-dom';

export default function Link({to, title}: {to: string, title: string}) {
  const baseClass = "block rounded m-2 p-2 py-1 text-[18px] font-medium ";

  const classNameHandler = ({isActive, isPending}) => {
    if(isActive) return baseClass + 'text-dark-base bg-brandPrimaryLight-2';
    if(isPending) return baseClass + 'text-dark-2 bg-brandPrimaryLight-2';

    return baseClass + 'text-dark-2';
  };

  return (
    <li>
      <NavLink to={to} className={classNameHandler}>{title}</NavLink>
    </li>
  );
}
