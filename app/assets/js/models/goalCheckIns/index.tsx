import Api from "@/api";
import * as api from "@/api";
import { isPresent } from "@/utils/isPresent";

export type Update = api.GoalProgressUpdate;
export type Target = api.GoalTargetUpdates;

export const getGoalProgressUpdate = Api.goal_check_ins.get;
export const useAcknowledgeGoalProgressUpdate = Api.goal_check_ins.useAcknowledge;
export const useEditGoalProgressUpdate = Api.goal_check_ins.useUpdate;
export const usePostGoalProgressUpdate = Api.goal_check_ins.useCreate;

export function targetChangeSentiment(target: Target): "positive" | "negative" | "neutral" {
  if (!isPresent(target.value)) return "neutral";
  if (!isPresent(target.previousValue)) return "neutral";
  if (!isPresent(target.from)) return "neutral";
  if (!isPresent(target.to)) return "neutral";

  const diff = target.value - target.previousValue;
  if (diff === 0) return "neutral";

  if (target.from < target.to) {
    return diff > 0 ? "positive" : "negative";
  } else {
    return diff > 0 ? "negative" : "positive";
  }
}
