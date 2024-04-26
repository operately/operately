import React from "react";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Range, SetRange } from "./useRange";

export function CustomRangePicker({ range, setRange }: { range: Range; setRange: SetRange }) {
  return (
    <div className="flex items-start gap-6">
      <div className="flex flex-col items-start justify-start h-full">
        <div className="font-bold text-sm mb-1">Start Date</div>
        <DatePicker
          inline
          selected={range.startDate}
          onChange={(date) => setRange(date, range.endDate)}
          startDate={range.startDate}
          endDate={range.endDate}
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
          selected={range.endDate}
          startDate={range.startDate}
          endDate={range.endDate}
          onChange={(date) => setRange(range.startDate, date)}
          minDate={range.startDate}
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
