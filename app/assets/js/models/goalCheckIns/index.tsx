import Api from "@/api";
import * as api from "@/api";
import { isPresent } from "@/utils/isPresent";

export type Update = api.GoalProgressUpdate;
export type Target = api.GoalTargetUpdates;

export const getGoalProgressUpdate = Api.goals.getCheckIn;
export const useAcknowledgeGoalProgressUpdate = Api.goals.useAcknowledgeCheckIn;
export const useEditGoalProgressUpdate = Api.goals.useUpdateCheckIn;
export const usePostGoalProgressUpdate = Api.goals.useCreateCheckIn;

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
