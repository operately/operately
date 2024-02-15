import type { Project, ProjectContributor, Milestone } from "@/gql";
export type { Project, ProjectContributor, Milestone } from "@/gql";

import * as Time from "@/utils/time";

export { groupBySpace } from "./groupBySpace";
export { getProjects } from "./getProjects";
export { getProject } from "./getProject";

export function sortByName(projects: Project[]) {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortContributorsByRole(contributors: ProjectContributor[]): ProjectContributor[] {
  return [...contributors].sort((a, b) => {
    if (a!.role === "champion") return -2;
    if (b!.role === "reviewer") return 1;

    return 0;
  });
}

export function isMilestoneOverdue(milestone: Pick<Milestone, "status" | "deadlineAt">) {
  if (milestone.status !== "pending") return false;

  const day = Time.parseDate(milestone.deadlineAt);
  if (!day) return false;

  return !Time.isToday(day) && Time.isPast(day);
}
