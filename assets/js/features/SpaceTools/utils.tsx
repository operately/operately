import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

export function calculateGoalsStatus(_: Goal[]) {
  // todo
  return { on_track: 5, caution: 3, issue: 1, total: 9 };
}

export function calculateProjectsStatus(projects: Project[]) {
  const result = { on_track: 0, caution: 0, issue: 0, total: 0 };

  projects.forEach((project) => {
    if (project.isOutdated) {
      result.issue++;
    } else if (!project.lastCheckIn) {
      result.on_track++;
    } else {
      result[project.lastCheckIn.status!]++;
    }

    result.total++;
  });

  return result;
}
