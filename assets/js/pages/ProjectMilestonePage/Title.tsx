import * as React from "react";

export function Title({ milestone }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="text-2xl font-extrabold text-content-accent hover:bg-shade-1 flex-1 -m-1.5 p-1.5">
        {milestone.title}
      </div>
    </div>
  );
}
