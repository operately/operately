import * as api from "@/api";
export type Update = api.GoalProgressUpdate;

export {
  getGoalProgressUpdate,
  getGoalProgressUpdates,
  postGoalProgressUpdate,
  editGoalProgressUpdate,
  usePostGoalProgressUpdate,
  useEditGoalProgressUpdate,
  useAcknowledgeGoalProgressUpdate,
} from "@/api";
