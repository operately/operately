import React from "react";

export function Section({ title, children }) {
  return (
    <div className="border-t border-stroke-base py-6">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm">{title}</div>
        </div>

        <div className="w-4/5">{children}</div>
      </div>
    </div>
  );
}
