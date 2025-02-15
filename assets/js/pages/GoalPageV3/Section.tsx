import React from "react";

export function Section({ title, children, icon }) {
  return (
    <div className="pt-6 pb-4 px-20 relative">
      <div className="text-lg font-bold mb-4 flex items-center gap-2 -left-6 relative">
        {icon} {title}
      </div>
      <div>{children}</div>
    </div>
  );
}
// <div className={`absolute top-0 right-0 w-2 bottom-0 ${color}`} />
