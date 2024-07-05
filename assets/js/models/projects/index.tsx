import * as Time from "@/utils/time";
import * as api from "@/api";

export type Project = api.Project;
export type ProjectContributor = api.ProjectContributor;
export type Milestone = api.Milestone;
export type KeyResource = api.ProjectKeyResource;

export { getProject, getProjects, useMoveProjectToSpace, useCreateProject } from "@/api";

export { groupBySpace } from "./groupBySpace";
export { useCloseProjectMutation } from "./useCloseProjectMutation";
export { useEditNameMutation } from "./useEditNameMutation";
export { useUpdateDescriptionMutation } from "./useUpdateDescriptionMutation";
export { useEditTimelineMutation } from "./useEditTimelineMutation";
export { useArchiveMutation } from "./useArchiveMutation";

export { useProjectContributorCandidatesQuery } from "./useProjectContributorCandidatesQuery";
export { useAddProjectContributorMutation } from "./useAddProjectContributorMutation";
export { useUpdateProjectContributorMutation } from "./useUpdateProjectContributorMutation";
export { useRemoveProjectContributorMutation } from "./useRemoveProjectContributorMutation";
export { useResumeProjectMutation } from "./useResumeProjectMutation";
export { usePauseProjectMutation } from "./usePauseProjectMutation";

export function sortByName(projects: Project[]) {
  return [...projects].sort((a, b) => a.name!.localeCompare(b.name!));
}

export function sortByClosedAt(projects: Project[]) {
  return [...projects].sort((a, b) => {
    const closedAtA = Time.parseDate(a.closedAt);
    const closedAtB = Time.parseDate(b.closedAt);

    if (!closedAtA && !closedAtB) return 0;
    if (!closedAtA) return 1;
    if (!closedAtB) return -1;

    return Time.compareAsc(closedAtB, closedAtA);
  });
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

export function allMilestonesCompleted(project: Project) {
  return project.milestones!.every((m) => m!.status === "done");
}

export function isPausable(project: Project) {
  return project.status === "active";
}

export function isResumable(project: Project) {
  return project.status === "paused";
}
