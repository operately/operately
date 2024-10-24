import * as Time from "@/utils/time";
import * as api from "@/api";

export type Project = api.Project;
export type ProjectContributor = api.ProjectContributor;
export type Milestone = api.Milestone;
export type ProjectRetrospective = api.ProjectRetrospective;

export {
  getProject,
  getProjects,
  useGetProjects,
  getProjectRetrospective,
  useMoveProjectToSpace,
  useCreateProject,
  useCloseProject,
  useEditProjectName,
  useUpdateProjectDescription,
  useEditProjectTimeline,
  useArchiveProject,
  useUpdateProjectContributor,
  useResumeProject,
  usePauseProject,
  useRemoveProjectContributor,
  useEditProjectRetrospective,
} from "@/api";

export const PRIVACY_PUBLIC = "public";
export const PRIVACY_INTERNAL = "internal";
export const PRIVACY_CONFIDENTIAL = "confidential";
export const PRIVACY_SECRET = "secret";

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

export function isPausable(project: Project) {
  return project.status === "active";
}

export function isResumable(project: Project) {
  return project.status === "paused";
}

export function useContributorSearchFn(project: Project) {
  return async (query: string) => {
    const res = await api.searchProjectContributorCandidates({
      projectId: project.id!,
      query,
    });

    return res.people!.map((p) => p!);
  };
}
