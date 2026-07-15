import * as Time from "../utils/time";

export type CheckInTimestamp = string | Date;

export function parseCheckInTimestamp(timestamp: CheckInTimestamp): Date {
  const parsedTimestamp = Time.parse(timestamp);

  if (!parsedTimestamp) {
    throw new Error(`Invalid check-in timestamp ${timestamp}`);
  }

  return parsedTimestamp;
}
