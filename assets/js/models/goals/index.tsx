import { makeQueryFn } from "@/graphql/client";

import { GetGoalsDocument, GetGoalsQueryVariables, GetGoalDocument, GetGoalQueryVariables } from "@/gql/generated";
import { Goal } from "@/gql/generated";

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
