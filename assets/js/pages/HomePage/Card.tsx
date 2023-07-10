import React from "react";

import { Link } from "react-router-dom";

export function Card({ linkTo, children }) {
  return (
    <Link
      to={linkTo}
      className={"h-full w-full block rounded-[20px] p-4 border border-dark-4"}
      style={{
        background: "linear-gradient(45deg, var(--color-dark-2), var(--color-dark-3))",
      }}
    >
      {children}
    </Link>
  );
}

export function CardSectionTitle({ title }) {
  return <div className="font-bold mb-2 text-xs uppercase text-pink-400">{title}</div>;
}
