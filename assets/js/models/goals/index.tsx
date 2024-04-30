import { makeQueryFn } from "@/graphql/client";
export { useEditGoalTimeframeMutation } from './useEditGoalTimeframeMutation';

import { GetGoalsDocument, GetGoalsQueryVariables, GetGoalDocument, GetGoalQueryVariables } from "@/gql/generated";
import { Goal, Target } from "@/gql/generated";

export type { Target, Goal } from "@/gql/generated";

export const getGoal = makeQueryFn(GetGoalDocument, "goal") as (v: GetGoalQueryVariables) => Promise<Goal>;
export const getGoals = makeQueryFn(GetGoalsDocument, "goals") as (v: GetGoalsQueryVariables) => Promise<Goal[]>;

export { useCloseGoalMutation } from "./useCloseGoalMutation";
export { useArchiveGoalMutation } from "./useArchiveGoalMutation";
export { useDisconnectGoalFromProjectMutation } from "./useDisconnectGoalFromProjectMutation";
export { useConnectGoalToProjectMutation } from "./useConnectGoalToProjectMutation";
export { useEditGoalMutation } from "./useEditGoalMutation";
export { useCreateGoalMutation } from "./useCreateGoalMutation";
export { useChangeGoalParentMutation } from "./useChangeGoalParentMutation";

export { groupBySpace } from "./groupBySpace";
export { filterPossibleParentGoals } from "./filterPossibleParentGoals";

export function targetProgressPercentage(target: Target): number {
  if (target.from <= target.to) {
    if (target.value < target.from) {
      return 0;
    } else if (target.value > target.to) {
      return 100;
    } else {
      return ((target.value - target.from) / (target.to - target.from)) * 100;
    }
  } else {
    if (target.value > target.from) {
      return 0;
    } else if (target.value < target.to) {
      return 100;
    } else {
      return ((target.from - target.value) / (target.from - target.to)) * 100;
    }
  }
}
