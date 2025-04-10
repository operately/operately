export type TimeframeType = "month" | "quarter" | "year" | "days";

export interface Timeframe {
  startDate: Date | null;
  endDate: Date | null;
  type: TimeframeType;
}

export type SetTimeframe = (timeframe: Timeframe) => void;

export interface TimeframeSelectorProps {
  timeframe: Timeframe;
  setTimeframe: SetTimeframe;
  size?: "xs" | "base";
  alignContent?: "start" | "end";
}

