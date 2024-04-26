import React from "react";

export type Range = { startDate: Date | null; endDate: Date | null };
export type SetRange = (start: Date | null, end: Date | null) => void;

export function useRange(initialStart: Date | null, initialEnd: Date | null): [Range, SetRange] {
  const [startDate, setStartDate] = React.useState(initialStart);
  const [endDate, setEndDate] = React.useState(initialEnd);

  const range = { startDate, endDate };
  const setRange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  return [range, setRange];
}
