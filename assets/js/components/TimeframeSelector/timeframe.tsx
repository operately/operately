import * as Time from "@/utils/time";
import { TimeframeInput } from "@/gql";

export type TimeframeType = "month" | "quarter" | "year" | "days";

export interface Timeframe {
  startDate: Date | null;
  endDate: Date | null;
  type: TimeframeType;
}

export type SetTimeframe = (timeframe: Timeframe) => void;

export function serializeTimeframe(timeframe: Timeframe): TimeframeInput {
  return {
    startDate: timeframe.startDate && Time.toDateWithoutTime(timeframe.startDate),
    endDate: timeframe.endDate && Time.toDateWithoutTime(timeframe.endDate),
    type: timeframe.type,
  };
}
