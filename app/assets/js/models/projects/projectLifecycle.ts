import { invalidateTaskLifecycleQueries } from "../tasks/taskLifecycle";
import Api from "@/api";
import {
  QueryClient,
  type QueryKey,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

type RefetchType = "active" | "none";

export async function invalidateProjectLifecycleQueries(
  queryClient: QueryClient,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.listQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.searchQueryKeyPrefix(), refetchType }),
  ]);
}

export async function invalidateClosedProjectQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    invalidateProjectLifecycleQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: Api.projects.getRetrospectiveQueryKeyPrefix() }),
  ]);
}

export async function invalidateProjectRetrospectiveQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.getRetrospectiveQueryKeyPrefix() }),
  ]);
}

export function usePauseProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.pauseMutationOptions(),
    onSuccess: () => {
      void invalidateProjectLifecycleQueries(queryClient);
    },
  });
}

export function useResumeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.resumeMutationOptions(),
    onSuccess: () => {
      void invalidateProjectLifecycleQueries(queryClient);
    },
  });
}

export function useCloseProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.closeMutationOptions(),
    onSuccess: () => {
      void invalidateClosedProjectQueries(queryClient);
    },
  });
}

export function useEditProjectRetrospective() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateRetrospectiveMutationOptions(),
    onSuccess: () => {
      void invalidateProjectRetrospectiveQueries(queryClient);
    },
  });
}

export function useAcknowledgeProjectRetrospective() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.acknowledgeRetrospectiveMutationOptions(),
    onSuccess: () => {
      void invalidateProjectRetrospectiveQueries(queryClient);
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.createMutationOptions(),
    onSuccess: () => {
      void invalidateProjectLifecycleQueries(queryClient);
    },
  });
}

export function useCreateProjectFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.createProjectMutationOptions(),
    onSuccess: () => {
      void invalidateProjectLifecycleQueries(queryClient);
    },
  });
}

function isFailedMutationResult(data: unknown): boolean {
  return Boolean(data && typeof data === "object" && "success" in data && data.success === false);
}

// Refresh failures must not turn a successful write into a failed save
// and roll back optimistic UI.
async function invalidateProjectDetailsQueries(
  queryClient: QueryClient,
  additionalKeys: QueryKey[] = [],
  refetchType: RefetchType = "active",
) {
  try {
    await Promise.all([
      invalidateProjectLifecycleQueries(queryClient, refetchType),
      queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix(), refetchType }),
      ...additionalKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey, refetchType })),
    ]);
  } catch (error) {
    console.error("Failed to refresh project queries", error);
  }
}

// Callers that refresh their page after saving use "none" to avoid fetching twice.
export function useUpdateProjectName(refetchType: RefetchType = "active") {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateNameMutationOptions(),
    onSuccess: () => {
      void invalidateProjectDetailsQueries(queryClient, [Api.tasks.getQueryKeyPrefix()], refetchType);
    },
  });
}

export function useUpdateProjectDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateDescriptionMutationOptions(),
    onSuccess: () => {
      void invalidateProjectDetailsQueries(queryClient);
    },
  });
}

export function useUpdateProjectStartDate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateStartDateMutationOptions(),
    onSuccess: (data) => {
      if (isFailedMutationResult(data)) return;
      void invalidateProjectDetailsQueries(queryClient);
    },
  });
}

export function useUpdateProjectDueDate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateDueDateMutationOptions(),
    onSuccess: (data) => {
      if (isFailedMutationResult(data)) return;
      void invalidateProjectDetailsQueries(queryClient);
    },
  });
}

export function useUpdateProjectParentGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateParentGoalMutationOptions(),
    onSuccess: (data) => {
      if (isFailedMutationResult(data)) return;
      void invalidateProjectDetailsQueries(queryClient, [Api.goals.getQueryKeyPrefix()]);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.deleteMutationOptions(),
    onSuccess: () => {
      void invalidateProjectDetailsQueries(queryClient, [Api.goals.getQueryKeyPrefix()]);
    },
  });
}

// Project Page mutations share the same subscribed project data and related lists.
function useProjectPageMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const client = useQueryClient();
  return useMutation({
    ...options,
    onSuccess: (data) => {
      if (isFailedMutationResult(data)) return;
      void invalidateProjectDetailsQueries(client, [
        Api.projects.countChildrenQueryKeyPrefix(),
        Api.tasks.listQueryKeyPrefix(),
        Api.tasks.getQueryKeyPrefix(),
        Api.projects.getMilestoneQueryKeyPrefix(),
        Api.people.getBindedQueryKeyPrefix(),
      ]);
    },
  });
}

export function useUpdateProjectPermissions() {
  return useProjectPageMutation(Api.projects.updatePermissionsMutationOptions());
}

export function useMoveProjectToSpace() {
  return useProjectPageMutation(Api.projects.moveToSpaceMutationOptions());
}

export function useUpdateProjectChampion() {
  return useProjectPageMutation(Api.projects.updateChampionMutationOptions());
}

export function useUpdateProjectReviewer() {
  return useProjectPageMutation(Api.projects.updateReviewerMutationOptions());
}

export function useUpdateProjectTasksView() {
  return useProjectPageMutation(Api.projects.updateTasksViewMutationOptions());
}

export function useCreateProjectMilestone() {
  return useProjectPageMutation(Api.projects.createMilestoneMutationOptions());
}

export function useUpdateProjectMilestone() {
  return useProjectPageMutation(Api.projects.updateMilestoneMutationOptions());
}

export function useUpdateProjectMilestoneOrdering() {
  return useProjectPageMutation(Api.projects.updateMilestoneOrderingMutationOptions());
}

export function useCreateProjectContributor() {
  return useProjectPageMutation(Api.projects.createContributorMutationOptions());
}

export function useUpdateProjectContributor() {
  return useProjectPageMutation(Api.projects.updateContributorMutationOptions());
}

export function useDeleteProjectContributor() {
  return useProjectPageMutation(Api.projects.deleteContributorMutationOptions());
}

export function useUpdateProjectTaskStatuses() {
  return useProjectTaskMutation(Api.projects.updateTaskStatusesMutationOptions());
}

export function useUpdateProjectKanban() {
  return useProjectTaskMutation(Api.projects.updateKanbanMutationOptions());
}

function useProjectTaskMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const client = useQueryClient();
  return useMutation({
    ...options,
    onSuccess: (data) => {
      if (isFailedMutationResult(data)) return;
      void Promise.all([invalidateProjectLifecycleQueries(client), invalidateTaskLifecycleQueries(client)]).catch(
        (error) => console.error("Failed to refresh project task queries", error),
      );
    },
  });
}
