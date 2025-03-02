import React from "react";

export function Section({ title, children, icon }) {
  return (
    <div className="pt-8 not-first:pt-10 px-32 relative">
      <div className="text-xl font-bold mb-4 flex items-center gap-2 relative">{title}</div>
      <div>{children}</div>
    </div>
  );
}
// <div className={`absolute top-0 right-0 w-2 bottom-0 ${color}`} />
