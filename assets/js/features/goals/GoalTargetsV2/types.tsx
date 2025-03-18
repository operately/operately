import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

export type Target = GoalCheckIns.Target | Goals.Target;

export function isCheckInTarget(target: Target): target is GoalCheckIns.Target {
  return "previousValue" in target;
}
