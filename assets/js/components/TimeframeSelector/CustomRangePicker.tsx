import React from "react";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Timeframe, SetTimeframe } from "./timeframe";

export function CustomRangePicker({ timeframe, setTimeframe }: { timeframe: Timeframe; setTimeframe: SetTimeframe }) {
  return (
    <div className="flex items-start gap-6">
      <div className="flex flex-col items-start justify-start h-full">
        <div className="font-bold text-sm mb-1">Start Date</div>
        <DatePicker
          inline
          selected={timeframe.startDate}
          onChange={(date) => setTimeframe({ ...timeframe, startDate: date })}
          startDate={timeframe.startDate}
          endDate={timeframe.endDate}
          showFourColumnMonthYearPicker
          renderCustomHeader={Header}
        />
      </div>

      <div className="flex flex-col items-center justify-center h-[240px]">
        <div className="w-px bg-stroke-base rounded-xl h-8 pt-20 mt-10"></div>
      </div>

      <div className="flex flex-col items-start justify-start h-full">
        <div className="font-bold text-sm mb-1">Due Date</div>

        <DatePicker
          inline
          selected={timeframe.endDate}
          startDate={timeframe.startDate}
          endDate={timeframe.endDate}
          onChange={(date) => setTimeframe({ ...timeframe, endDate: date })}
          minDate={timeframe.startDate}
          renderCustomHeader={Header}
          showFourColumnMonthYearPicker
        />
      </div>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Header({ date, decreaseMonth, increaseMonth }) {
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return (
    <div className="flex items-center w-full px-1 pb-1 gap-4 font-medium">
      <LeftChevron onClick={decreaseMonth} />
      <div>
        {month} {year}
      </div>
      <RightChevron onClick={increaseMonth} />
    </div>
  );
}
