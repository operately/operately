import { Project } from "@/models/projects";
import { Goal } from "../../models/goals";

export function calculateProjectStatuses(resources: Project[]) {
  const result = { on_track: 0, caution: 0, off_track: 0, pending: 0, paused: 0, total: 0 };

  resources.forEach((resource) => {
    if (resource.state === "paused") {
      result.paused++;
    } else if (resource.isOutdated) {
      result.pending++;
    } else if (!resource.lastCheckIn) {
      result.pending++;
    } else {
      result[resource.lastCheckIn.status!]++;
    }

    result.total++;
  });

  return result;
}

export function calculateGoalStatuses(resources: Goal[]) {
  const result = { on_track: 0, caution: 0, off_track: 0, pending: 0, paused: 0, total: 0 };

  resources.forEach((resource) => {
    if (resource.isOutdated) {
      result.pending++;
    } else if (!resource.lastCheckIn) {
      result.pending++;
    } else {
      result[resource.lastCheckIn.status!]++;
    }

    result.total++;
  });

  return result;
}
