import * as api from "@/api";

export type Update = api.GoalProgressUpdate;
export type Target = api.GoalTargetUpdates;

export {
  getGoalProgressUpdate,
  getGoalProgressUpdates,
  postGoalProgressUpdate,
  editGoalProgressUpdate,
  usePostGoalProgressUpdate,
  useEditGoalProgressUpdate,
  useAcknowledgeGoalProgressUpdate,
} from "@/api";

export function targetChangeSentiment(target: Target): "positive" | "negative" | "neutral" {
  if (!target.value) return "neutral";
  if (!target.previousValue) return "neutral";
  if (!target.from || !target.to) return "neutral";

  const diff = target.value - target.previousValue;
  if (diff === 0) return "neutral";

  if (target.from < target.to) {
    return diff > 0 ? "positive" : "negative";
  } else {
    return diff > 0 ? "negative" : "positive";
  }
}
