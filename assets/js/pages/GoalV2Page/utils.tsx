import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";
import { Target } from "@/features/goals/GoalTargetsV2";
import { parseToInteger } from "@/utils/numbers";

export function parseTargets(targets: Target[]) {
  return targets.map((t, index) => ({
    id: t.id,
    name: t.name,
    from: parseToInteger(t.from!),
    to: parseToInteger(t.to!),
    unit: t.unit,
    index: index,
  }));
}

export function findTimeLeft(timeframe: Goals.Timeframe) {
  const now = new Date();
  const endDate = Time.parse(timeframe.endDate!);

  if (!endDate) return "";

  const isPast = endDate < now;
  const { months, weeks, days } = Time.getDateDifference(isPast ? endDate : now, isPast ? now : endDate);
  const timeStatus = isPast ? "late" : "left";

  if (months > 0) {
    return months === 1 ? `1 month ${timeStatus}` : `${months} months ${timeStatus}`;
  }
  if (weeks > 0) {
    return weeks === 1 ? `1 week ${timeStatus}` : `${weeks} weeks ${timeStatus}`;
  }
  if (days > 0) {
    return days === 1 ? `1 day ${timeStatus}` : `${days} days ${timeStatus}`;
  }
  return "Due today";
}

export function serializeTimeframe(newTimeframe, oldTimeframe) {
  const timeframesEqual = Timeframes.equalDates(
    newTimeframe as Timeframes.Timeframe,
    oldTimeframe as Timeframes.Timeframe,
  );

  if (timeframesEqual) {
    return Timeframes.serialize(oldTimeframe);
  } else {
    // If the timeframe changes, "type" is set to days.
    return Timeframes.serialize({ ...newTimeframe, type: "days" });
  }
}
