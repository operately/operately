export type TimeframeType = "month" | "quarter" | "year" | "days";

export interface Timeframe {
  startDate: Date | null;
  endDate: Date | null;
  type: TimeframeType;
}

export type SetTimeframe = (timeframe: Timeframe) => void;
