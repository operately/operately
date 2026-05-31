import Api from "@/api";
import * as api from "@/api";
import { Paths } from "@/routes/paths";
import { isPresent } from "@/utils/isPresent";
import * as People from "@/models/people";
import * as Time from "@/utils/time";

export type Update = api.GoalProgressUpdate;
export type Target = api.GoalTargetUpdates;

export const getGoalProgressUpdate = Api.goals.getCheckIn;
export const useAcknowledgeGoalProgressUpdate = Api.goals.useAcknowledgeCheckIn;
export const useEditGoalProgressUpdate = Api.goals.useUpdateCheckIn;
export const usePostGoalProgressUpdate = Api.goals.useCreateCheckIn;

export function parseCheckInsForTurboUi(paths: Paths, checkIns: api.GoalProgressUpdate[]) {
  return checkIns.map((checkIn) => {
    return {
      id: checkIn.id,
      author: People.parsePersonForTurboUi(paths, checkIn.author),
      date: Time.parse(checkIn.insertedAt)!,
      link: paths.goalCheckInPath(checkIn.id),
      content: JSON.parse(checkIn.message!),
      commentCount: checkIn.commentsCount!,
      status: checkIn.status!,
    };
  });
}

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
