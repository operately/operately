export type { Goal } from "@/gql/generated";
export type { Target } from "@/gql/generated";

export { getGoals } from "./getGoals";
export { getGoal } from "./getGoal";
export { useArchiveGoalMutation } from "./useArchiveGoalMutation";
export { useConnectGoalToProjectMutation } from "./useConnectGoalToProjectMutation";
export { useCreateGoalMutation } from "./useCreateGoalMutation";

export { groupBySpace } from "./groupBySpace";
