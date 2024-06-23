import { makeQueryFn } from "@/graphql/client";

import { GetGoalDocument, GetGoalQueryVariables } from "@/gql/generated";
import { Target } from "@/gql/generated";

import * as api from "@/api";
import * as gql from "@/gql";

export type Goal = api.Goal | gql.Goal;

export type { Target } from "@/gql/generated";

export { getGoals } from "@/api";

export { useEditGoalTimeframeMutation, useEditGoalDiscussionMutation } from "@/gql/generated";

export const getGoal = makeQueryFn(GetGoalDocument, "goal") as (v: GetGoalQueryVariables) => Promise<Goal>;

export { useCloseGoalMutation } from "./useCloseGoalMutation";
export { useArchiveGoalMutation } from "./useArchiveGoalMutation";
export { useDisconnectGoalFromProjectMutation } from "./useDisconnectGoalFromProjectMutation";
export { useConnectGoalToProjectMutation } from "./useConnectGoalToProjectMutation";
export { useCreateGoalMutation } from "./useCreateGoalMutation";
export { useEditGoalMutation } from "./useEditGoalMutation";
export { useChangeGoalParentMutation } from "./useChangeGoalParentMutation";
export { useReopenGoalMutation } from "./useReopenGoalMutation";

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
