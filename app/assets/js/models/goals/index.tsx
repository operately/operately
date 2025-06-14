import * as api from "@/api";

export type Goal = api.Goal;
export type Target = api.Target;
export type Timeframe = api.Timeframe;

export {
  createGoalDiscussion,
  getGoal,
  getGoals,
  listGoalContributors,
  useArchiveGoal,
  useChangeGoalParent,
  useCloseGoal,
  useConnectGoalToProject,
  useCreateGoal,
  useDeleteGoal,
  useDisconnectGoalFromProject,
  useEditGoal,
  useEditGoalDiscussion,
  useEditGoalTimeframe,
  useGetGoals,
  useReopenGoal,
} from "@/api";

export { filterPossibleParentGoals } from "./filterPossibleParentGoals";

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
