import React from "react";
import classnames from "classnames";

import { Link } from "react-router-dom";

export function Card({ children, linkTo }) {
  return (
    <Link to={linkTo}>
      <div
        className={classnames(
          "p-4 h-52",
          "bg-dark-3 rounded-lg text-sm",
          "cursor-pointer",
          "shadow hover:shadow-lg",
          "border border-shade-2 hover:border-shade-3",
          "overflow-hidden",
        )}
      >
        {children}
      </div>
    </Link>
  );
}

export function Header({ children }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2 border-b border-shade-2 -m-4 px-4 py-3">
      {children}
    </div>
  );
}

export function Title({ children }) {
  return <div className="font-bold flex items-center">{children}</div>;
}

export function Body({ children }) {
  return <div>{children}</div>;
}
