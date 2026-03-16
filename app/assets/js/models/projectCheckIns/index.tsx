import Api from "@/api";
import * as api from "@/api";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { parsePersonForTurboUi } from "../people";
import * as Time from "@/utils/time";

export type ProjectCheckIn = api.ProjectCheckIn;

export const getProjectCheckIn = Api.project_check_ins.get;
export const useAcknowledgeProjectCheckIn = Api.project_check_ins.useAcknowledge;
export const useEditProjectCheckIn = Api.project_check_ins.useUpdate;
export const usePostProjectCheckIn = Api.project_check_ins.useCreate;

export function parseCheckInsForTurboUi(paths: Paths, checkIns: api.ProjectCheckIn[]) {
  return checkIns.map((checkIn) => {
    assertPresent(checkIn.author, "author must be present in check-in");

    return {
      id: checkIn.id,
      author: parsePersonForTurboUi(paths, checkIn.author)!,
      date: Time.parse(checkIn.insertedAt)!,
      link: paths.projectCheckInPath(checkIn.id),
      content: JSON.parse(checkIn.description || "{}"),
      commentCount: checkIn.commentsCount || 0,
      status: checkIn.status,
    };
  });
}
