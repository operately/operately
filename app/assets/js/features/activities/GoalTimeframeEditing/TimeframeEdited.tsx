import React from "react";

import { IconArrowRight } from "@tabler/icons-react";
import * as Timeframes from "@/utils/timeframes";
import * as Goals from "@/models/goals";

interface Props {
  oldTimeframe: Goals.Timeframe;
  newTimeframe: Goals.Timeframe;
}

export function TimeframeEdited({ oldTimeframe, newTimeframe }: Props) {
  const start = Timeframes.parse(oldTimeframe);
  const end = Timeframes.parse(newTimeframe);

  return (
    <div className="my-2 flex items-center gap-1 text-sm">
      <div className="flex items-center gap-1 font-medium">
        <div className="border border-stroke-base rounded-md px-2 bg-stone-400/20 font-medium text-sm">
          {Timeframes.format(start)}
        </div>
      </div>

      <IconArrowRight size={14} />

      <div className="flex items-center gap-1 font-medium">
        <div className="border border-stroke-base rounded-md px-2 bg-stone-400/20 font-medium text-sm">
          {Timeframes.format(end)}
        </div>
      </div>
    </div>
  );
}
