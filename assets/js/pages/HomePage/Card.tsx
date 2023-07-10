import React from "react";

import { Link } from "react-router-dom";

// string interpolation won't work here
// because tailwind removes unused classes
// so we need to use an array
const colSpanOptions = ["col-span-0", "col-span-1", "col-span-2", "col-span-3"];

export function Card({ linkTo, children, colSpan = 1 }) {
  return (
    <Link
      to={linkTo}
      className={
        "h-72 rounded-[20px] p-4 hover:scale-[1.01] transition-transform border border-dark-4 cursor-pointer" +
        " " +
        colSpanOptions[colSpan]
      }
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
