import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";

export function findUpdatedTargets(targets: Goals.Target[], updatedTargets: Goals.Target[]) {
  const originalTargets: Map<string, Goals.Target> = new Map();

  targets.forEach((target) => {
    originalTargets.set(target.id!, target);
  });

  const changedTargets = updatedTargets.filter((target) => {
    const originalTarget = originalTargets.get(target.id!);
    return target.value !== originalTarget?.value;
  });

  return changedTargets;
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
