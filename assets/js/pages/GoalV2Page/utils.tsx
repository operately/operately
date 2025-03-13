import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";

export function parseTargets(targets: Goals.Target[]) {
  return targets.map((t, index) => ({
    id: t.id,
    name: t.name,
    from: t.from,
    to: t.to,
    unit: t.unit,
    index: index,
  }));
}

export function findTimeLeft(timeframe: Goals.Timeframe) {
  const { months, weeks, days } = Time.getDateDifference(timeframe.startDate!, timeframe.endDate!);

  if (months > 0) {
    return months === 1 ? "1 month left" : `${months} months left`;
  }
  if (weeks > 0) {
    return weeks === 1 ? "1 week left" : `${weeks} weeks left`;
  }
  if (days > 0) {
    return days === 1 ? "1 day left" : `${days} days left`;
  }
  return "";
}

export function serializeTimeframe(newTimeframe, oldTimeframe) {
  const timeframesEqual = Timeframes.equalDates(
    newTimeframe as Timeframes.Timeframe,
    oldTimeframe as Timeframes.Timeframe,
  );

  if (timeframesEqual) {
    return Timeframes.serialize(oldTimeframe);
  } else {
    return Timeframes.serialize({ ...newTimeframe, type: "days" });
  }
}
