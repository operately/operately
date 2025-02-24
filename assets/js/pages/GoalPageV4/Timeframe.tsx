import * as React from "react";

import { DimmedLink } from "@/components/Link";

export function Timeframe() {
  return (
    <div className="mt-6">
      <div className="mb-2 uppercase text-xs font-bold tracking-wider">Timeframe</div>

      <div className="flex flex-col gap-2">
        <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg px-2 py-2 flex items-center justify-between gap-1 relative overflow-hidden group cursor-pointer">
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-stone-300 opacity-50 group-hover:bg-indigo-200 transition"
            style={{ width: "20%" }}
          />
          <div className="border-l border-stone-300 top-px bottom-px absolute" style={{ left: "20%" }} />

          <span className="text-xs font-medium z-1 relative">Jan 1</span>
          <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
          <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
          <span className="text-xs font-medium z-1 relative">Dec 31</span>
        </div>

        <div className="text-xs text-content-dimmed">
          10 months left &bull; <DimmedLink to="">View on timeline</DimmedLink>
        </div>
      </div>
    </div>
  );
}
