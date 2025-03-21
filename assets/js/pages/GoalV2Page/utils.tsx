import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";
import { Target } from "@/features/goals/GoalTargetsV2";
import { parseToInteger } from "@/utils/numbers";
import plurarize from "@/utils/plurarize";

function parseTarget(t: Target, index: number): Goals.Target {
  return {
    id: t.id,
    name: t.name,
    from: parseToInteger(t.from!),
    to: parseToInteger(t.to!),
    unit: t.unit,
    index: index,
  };
}

export function parseTargets(targets: Target[]) {
  const updated: Goals.Target[] = [];
  const added: Goals.Target[] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]!;
    const parsedTarget = parseTarget(target, i);

    if (target.isNew) {
      delete parsedTarget.id;
      added.push(parsedTarget);
    } else {
      updated.push(parsedTarget);
    }
  }

  return { updated, added };
}

export function findTimeLeft(timeframe: Goals.Timeframe) {
  const today = Time.today();
  const endDate = Time.parseDate(timeframe.endDate!);

  if (!endDate) return "";
  if (Time.isToday(endDate)) return "Due today";

  const isPast = endDate < today;
  const { months, weeks, days } = Time.getDateDifference(isPast ? endDate : today, isPast ? today : endDate);
  const timeStatus = isPast ? "late" : "left";
  let amount: string;

  if (months > 0) {
    amount = plurarize(months, "month", "months");
  } else if (weeks > 0) {
    amount = plurarize(weeks, "week", "weeks");
  } else {
    amount = plurarize(days, "day", "days");
  }

  return amount + " " + timeStatus;
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
