import * as api from "@/api";
import { isPresent } from "@/utils/isPresent";

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
