import React from "react";

export function OpenBadge() {
  return (
    <div className="text-xs border border-green-500 text-green-700 rounded-xl px-2 py-0.5 bg-green-100 font-medium flex items-center shirnk-0 gap-1.5">
      <div className="h-2 w-2 bg-green-700 rounded-full" />
      Open
    </div>
  );
}

export function ClosedBadge() {
  return (
    <div className="text-xs border border-purple-500 text-purple-700 rounded-xl px-2 py-0.5 bg-purple-100 font-medium flex items-center shirnk-0 gap-1.5">
      <div className="h-2 w-2 bg-purple-700 rounded-full" />
      Closed
    </div>
  );
}
