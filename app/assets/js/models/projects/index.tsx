import * as Time from "@/utils/time";
import * as api from "@/api";
import { assertPresent } from "@/utils/assertions";

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

export function getPeople(project: Project) {
  assertPresent(project.contributors, "project contributors must be present");

  return project.contributors.map((contributor) => {
    assertPresent(contributor, "project contributor must be present");
    assertPresent(contributor!.person, "project contributor person must be present");

    return {
      id: contributor.person.id!,
      fullName: contributor.person.fullName!,
      avatarUrl: contributor.person.avatarUrl!,
    }
  });
}

export function isClosed(project: Project) : boolean {
  assertPresent(project.status, "project status must be present");

  return project.status === "closed";
}

export function getProgress(project: Project) {
  assertPresent(project.milestones, "milestones must be present in project");

  const completedMilestones = project.milestones.filter((m) => m!.status === "done").length;
  const totalMilestones = project.milestones.length;

  return (completedMilestones / totalMilestones) * 100;
}

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

export function isOverdue(project: Project) {
  assertPresent(project.deadline, "project deadlineAt must be defined");

  const deadline = Time.parse(project.deadline);

  return Time.compareAsc(deadline, Time.today()) === -1;
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
