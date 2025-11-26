import * as api from "@/api";
import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";
import { StatusSelector } from "turboui";

export { useProjectMilestoneOrdering } from "./useProjectMilestoneOrdering";
export { useTaskStatuses } from "./useTaskStatuses";

export type Project = api.Project;
export type ProjectContributor = api.ProjectContributor;
export type Milestone = api.Milestone;
export type ProjectRetrospective = api.ProjectRetrospective;
export type Discussion = api.CommentThread;
export type Resource = api.ProjectKeyResource;
export type ProjectChildrenCount = api.ProjectChildrenCount;

export {
  getProject,
  getProjectRetrospective,
  getProjects,
  useCloseProject,
  useCreateProject,
  useEditProjectName,
  useEditProjectRetrospective,
  useGetProjects,
  useMoveProjectToSpace,
  usePauseProject,
  useRemoveProjectContributor,
  useResumeProject,
  useUpdateProjectContributor,
  useUpdateProjectDescription,
} from "@/api";

export function isOverdue(project: Pick<Project, "timeframe">) {
  assertPresent(project.timeframe, "project timeline must be defined");

  const deadline = Time.parse(project.timeframe.contextualEndDate?.date);

  return deadline && !Time.isToday(deadline) && Time.isPast(deadline);
}

export function isMilestoneOverdue(milestone: Pick<Milestone, "status" | "timeframe">) {
  if (milestone.status !== "pending") return false;

  const day = Time.parse(milestone.timeframe?.contextualEndDate?.date);
  if (!day) return false;

  return !Time.isToday(day) && Time.isPast(day);
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

function mapProjectTaskStatusColorToUi(
  color: string | null | undefined,
): Pick<StatusSelector.StatusOption, "color" | "icon"> {
  switch (color) {
    case "blue":
      return { color: "brand", icon: "circleDot" };
    case "green":
      return { color: "success", icon: "circleCheck" };
    case "red":
      return { color: "danger", icon: "circleX" };
    case "gray":
    default:
      return { color: "dimmed", icon: "circleDashed" };
  }
}

export function mapProjectTaskStatusesToUi(backend: api.ProjectTaskStatus[] | null | undefined): StatusSelector.StatusOption[] {
  if (!backend || backend.length === 0) return [];

  return backend
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((status, index) => {
      const { color, icon } = mapProjectTaskStatusColorToUi(status.color);

      return {
        id: status.id ?? `status-${index}`,
        label: status.label ?? "",
        value: status.value ?? status.id ?? "",
        index: status.index ?? index,
        closed: status.closed ?? false,
        color,
        icon,
      };
    });
}
