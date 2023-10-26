import React from "react";
import * as Icons from "tabler-icons-react";

export default function GoalsAndKpis(): JSX.Element {
  return (
    <div>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2 uppercase font-bold tracking-wide">
          GOALS & KPIs
        </div>
      </div>

      <div className="border-b border-shade-2 py-4 -mx-8 px-8 pb-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-4 py-3 bg-shade-1 rounded-lg">
            <Icons.Target size={20} className="text-pink-400" /> Increase
            revenue by 20% by the end of Q3
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-shade-1 rounded-lg">
            <div className="flex items-center gap-2">
              <Icons.Graph size={20} className="text-lime-400" /> Montlhy
              Reccuring Revenue
            </div>

            <div className="font-bold flex items-center">
              $ 10,451,321
              <Icons.TrendingUp size={20} className="text-green-400 ml-2" />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 border border-shade-3 rounded-lg border-dashed">
            <Icons.Plus size={20} /> Add Goal or KPI
          </div>
        </div>
      </div>
    </div>
  );
}
