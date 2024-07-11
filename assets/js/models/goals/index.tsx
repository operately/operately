import * as api from "@/api";

export type Goal = api.Goal;
export type Target = api.Target;

export {
  getGoal,
  getGoals,
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

export { groupBySpace } from "./groupBySpace";
export { filterPossibleParentGoals } from "./filterPossibleParentGoals";

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
