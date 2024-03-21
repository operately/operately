export type { Goal } from "@/gql/generated";
export type { Target } from "@/gql/generated";

export { getGoals } from "./getGoals";
export { getGoal } from "./getGoal";
export { useArchiveGoalMutation } from "./useArchiveGoalMutation";
export { useDisconnectGoalFromProjectMutation } from "./useDisconnectGoalFromProjectMutation";
export { useConnectGoalToProjectMutation } from "./useConnectGoalToProjectMutation";
export { useEditGoalMutation } from "./useEditGoalMutation";
export { useCreateGoalMutation } from "./useCreateGoalMutation";
export { groupBySpace } from "./groupBySpace";
export { useChangeGoalParentMutation } from "./useChangeGoalParentMutation";
export { filterPossibleParentGoals } from "./filterPossibleParentGoals";
