import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

export type Target = (GoalCheckIns.Target | Goals.Target) & { isNew?: boolean };

export type TargetNumericFields = "from" | "to" | "value";
export type TargetTextFields = "name" | "unit";

export const REQUIRED_FIELDS = ["from", "to", "value", "name", "unit"] as const;

export function isCheckInTarget(target: Target): target is GoalCheckIns.Target {
  return "previousValue" in target;
}
