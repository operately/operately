import * as React from "react";
import DatePicker from "react-datepicker";

import { LeftChevron, RightChevron } from "./Chevrons";
import { Range, SetRange } from "./useRange";

export function YearPicker({ range, setRange }: { range: Range; setRange: SetRange }) {
  return (
    <DatePicker
      inline
      selected={range.startDate}
      onChange={(date) => setRange(date, range.endDate)}
      calendarClassName="w-full"
      showYearPicker
      yearItemNumber={6}
      renderYearContent={renderYearContent}
      renderCustomHeader={Header}
    />
  );
}

function Header({ date, decreaseYear, increaseYear }) {
  return (
    <div className="flex items-center w-full px-1 pb-1 gap-2 font-medium mb-2">
      <LeftChevron onClick={decreaseYear} />
      <div>{date.getFullYear()}</div>
      <RightChevron onClick={increaseYear} />
    </div>
  );
}

function renderYearContent(year: number) {
  return <div className="text-left px-2 py-2 flex items-center justify-between font-medium">{year}</div>;
}
