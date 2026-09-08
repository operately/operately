import Api from "@/api";
import { QueryClient, type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";

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

// These fields still have legacy PageCache callers. Refresh failures must not
// turn a successful write into a failed save and roll back their optimistic UI.
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
      if (data.success === false) return;
      void invalidateProjectDetailsQueries(queryClient);
    },
  });
}

export function useUpdateProjectDueDate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateDueDateMutationOptions(),
    onSuccess: (data) => {
      if (data.success === false) return;
      void invalidateProjectDetailsQueries(queryClient);
    },
  });
}

export function useUpdateProjectParentGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateParentGoalMutationOptions(),
    onSuccess: (data) => {
      if (data.success === false) return;
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
