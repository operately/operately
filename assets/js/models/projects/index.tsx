import client from "@/graphql/client";

import type { Project, ProjectContributor, Milestone } from "@/gql";
import * as Time from "@/utils/time";
import {
  GetProjectDocument,
  GetProjectQueryVariables,
  GetProjectsDocument,
  GetProjectsQueryVariables,
} from "@/gql/generated";

export type { Project, ProjectContributor, Milestone } from "@/gql";

export { groupBySpace } from "./groupBySpace";
export { useMoveProjectToSpaceMutation } from "./useMoveProjectToSpaceMutation";
export { useCloseProjectMutation } from "./useCloseProjectMutation";
export { useEditNameMutation } from "./useEditNameMutation";
export { useUpdateDescriptionMutation } from "./useUpdateDescriptionMutation";
export { useEditTimelineMutation } from "./useEditTimelineMutation";
export { useArchiveMutation } from "./useArchiveMutation";
export { useCreateMutation } from "./useCreateMutation";

export { useProjectContributorCandidatesQuery } from "./useProjectContributorCandidatesQuery";
export { useAddProjectContributorMutation } from "./useAddProjectContributorMutation";
export { useUpdateProjectContributorMutation } from "./useUpdateProjectContributorMutation";
export { useRemoveProjectContributorMutation } from "./useRemoveProjectContributorMutation";
export { useResumeProjectMutation } from "./useResumeProjectMutation";
export { usePauseProjectMutation } from "./usePauseProjectMutation";

export async function getProject(id: string, variables: GetProjectQueryVariables): Promise<Project> {
  let data = await client.query({
    query: GetProjectDocument,
    variables: { ...variables, id },
    fetchPolicy: "network-only",
  });

  return data.data.project;
}

export async function getProjects(variables: GetProjectsQueryVariables): Promise<Project[]> {
  variables.filters = variables.filters || {};
  variables.filters.filter = variables.filters.filter || "all-projects";

  let data = await client.query({
    query: GetProjectsDocument,
    variables: variables,
    fetchPolicy: "network-only",
  });

  return data.data.projects;
}

export function sortByName(projects: Project[]) {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
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
