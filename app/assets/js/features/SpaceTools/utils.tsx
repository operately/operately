import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

export function calculateStatus(resources: Project[] | Goal[]) {
  const result = { on_track: 0, caution: 0, off_track: 0, pending: 0, paused: 0, total: 0 };

  resources.forEach((resource) => {
    // Check if this is a paused project
    if ('state' in resource && resource.state === 'paused') {
      result.paused++;
    } else if (resource.isOutdated) {
      result.pending++;
    } else if (!resource.lastCheckIn) {
      result.on_track++;
    } else {
      result[resource.lastCheckIn.status!]++;
    }

    result.total++;
  });

  return result;
}
