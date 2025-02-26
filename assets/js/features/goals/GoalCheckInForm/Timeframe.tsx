import React from "react";
import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";

import { Goal } from "@/models/goals";
import FormattedTime from "@/components/FormattedTime";
import { IconDots } from "@tabler/icons-react";
import { TimeframeSelector } from "@/components/TimeframeSelector";

const increaseByOneMonth = (date: Date) => {
  if (Time.isLastDayOfMonth(date)) {
    return new Date(date.getFullYear(), date.getMonth() + 2, 0);
  } else if (Time.isFirstDayOfMonth(date)) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  } else {
    return Time.addDays(date, 30);
  }
};

const decreaseByOneMonth = (date: Date) => {
  if (Time.isLastDayOfMonth(date)) {
    return new Date(date.getFullYear(), date.getMonth(), 0);
  } else if (Time.isFirstDayOfMonth(date)) {
    return new Date(date.getFullYear(), date.getMonth() - 1, 1);
  } else {
    return Time.addDays(date, -30);
  }
};

export function Timeframe({ goal }: { goal: Goal }) {
  const [timeframe, setTimeframe] = React.useState(Timeframes.parse(goal.timeframe!));

  const plusOneMonth = () => {
    setTimeframe({
      ...timeframe,
      endDate: increaseByOneMonth(timeframe.endDate!),
    });
  };

  const minusOneMonth = () => {
    setTimeframe({
      ...timeframe,
      endDate: decreaseByOneMonth(timeframe.endDate!),
    });
  };

  return (
    <div>
      <div className="mb-2 font-bold">Still on track for this deadline?</div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Chronograph start={timeframe.startDate!} end={timeframe.endDate!} />
        </div>

        <div className="flex items-center gap-2">
          <SubtleButton onClick={minusOneMonth}>-1 month</SubtleButton>
          <SubtleButton onClick={plusOneMonth}>+1 month</SubtleButton>

          <TimeframeSelector
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            alignContent="center"
            customTrigger={
              <SubtleButton>
                <IconDots size={14} />
              </SubtleButton>
            }
          />
        </div>
      </div>
    </div>
  );
}

function SubtleButton({ onClick = undefined, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <div className="text-xs bg-surface-dimmed px-2 py-1 rounded cursor-pointer" onClick={onClick}>
      {children}
    </div>
  );
}

function Chronograph({ start, end }: { start: Date; end: Date }) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const diffToday = new Date().getTime() - new Date(start).getTime();
  const progress = (diffToday / diff) * 100;

  return (
    <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg px-2 py-2 flex items-center justify-between gap-1 relative overflow-hidden group cursor-pointer">
      <div className="absolute top-0 left-0 bottom-0 bg-indigo-500" style={{ width: progress + "%" }} />

      <span className="text-xs z-1 relative text-white-1 font-bold">
        <FormattedTime time={start} format="short-date" />
      </span>
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="text-xs font-medium z-1 relative">
        <FormattedTime time={end} format="short-date" />
      </span>
    </div>
  );
}
