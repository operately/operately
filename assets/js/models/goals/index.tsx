import * as api from "@/api";

export type Goal = api.Goal;
export type Target = api.Target;

export {
  Timeframe,
  Update as CheckIn,
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
} from "@/api";

export { filterPossibleParentGoals } from "./filterPossibleParentGoals";

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

export function targetProgressPercentage(target: Target): number {
  const from = target.from!;
  const to = target.to!;
  const value = target.value!;

  if (from < to) {
    if (value < from) {
      return 0;
    } else if (value > to) {
      return 100;
    } else {
      return ((value - from) / (to - from)) * 100;
    }
  } else {
    if (value > from) {
      return 0;
    } else if (value < to) {
      return 100;
    } else {
      return ((from - value) / (from - to)) * 100;
    }
  }
}

export function assertGoalStatusValidity(
  status: string,
): asserts status is "on_track" | "caution" | "issue" | "pending" {
  if (!["on_track", "caution", "issue", "pending"].includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
}
