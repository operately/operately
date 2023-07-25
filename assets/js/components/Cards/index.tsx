import React from "react";
import classnames from "classnames";

import { Link } from "react-router-dom";

export function Card({ children, linkTo }) {
  return (
    <Link to={linkTo}>
      <div
        className={classnames(
          "p-4",
          "bg-dark-4 rounded-lg",
          "cursor-pointer",
          "shadow-sm hover:shadow-lg",
          "overflow-hidden",
        )}
        style={{
          height: "260px",
        }}
      >
        {children}
      </div>
    </Link>
  );
}

export function Header({ children }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-shade-1 -mx-4 -mt-4 px-4 py-3">
      {children}
    </div>
  );
}

export function Title({ children }) {
  return <div className="font-bold flex items-center">{children}</div>;
}

export function Body({ children }) {
  return <div className="h-full">{children}</div>;
}
