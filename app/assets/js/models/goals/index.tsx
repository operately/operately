import * as api from "@/api";

export type Goal = api.Goal;
export type Target = api.Target;
export type Timeframe = api.Timeframe;

export {
  getGoal,
  getGoals,
  listGoalContributors,
  useGetGoals,
  useCreateGoal,
  useEditGoal,
  useConnectGoalToProject,
  useDisconnectGoalFromProject,
  useEditGoalTimeframe,
  useEditGoalDiscussion,
  useCloseGoal,
  useArchiveGoal,
  useChangeGoalParent,
  useReopenGoal,
  useDeleteGoal,
} from "@/api";

export { filterPossibleParentGoals } from "./filterPossibleParentGoals";
export { findGoalChildren } from "./findGoalChildren";

export type GoalActivities =
  | "goal_timeframe_editing"
  | "goal_closing"
  | "goal_check_in"
  | "goal_reopening"
  | "goal_discussion_creation";

export const GOAL_ACTIVITIES: GoalActivities[] = [
  "goal_timeframe_editing",
  "goal_closing",
  "goal_check_in",
  "goal_reopening",
  "goal_discussion_creation",
];

export function getPeople(goal: Goal) {
  const champion = goal.champion;
  const reviewer = goal.reviewer;

  return [champion, reviewer].filter((person) => person !== null);
}

export function targetProgressPercentage(target: Target, clamped: boolean = true): number {
  const from = target.from!;
  const to = target.to!;
  const value = target.value!;

  let percentage: number;
  if (from < to) {
    percentage = ((value - from) / (to - from)) * 100;
  } else {
    percentage = ((from - value) / (from - to)) * 100;
  }

  if (clamped) {
    return Math.max(0, Math.min(100, percentage));
  }

  return percentage;
}

export function assertGoalStatusValidity(
  status: string,
): asserts status is "on_track" | "caution" | "concern" | "issue" | "pending" {
  if (!["on_track", "caution", "concern", "issue", "pending"].includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
}
