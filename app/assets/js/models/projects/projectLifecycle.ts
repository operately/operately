import Api from "@/api";
import { QueryClient, type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateProjectLifecycleQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.listQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.searchQueryKeyPrefix() }),
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
async function invalidateProjectDetailsQueries(queryClient: QueryClient, additionalKeys: QueryKey[] = []) {
  try {
    await Promise.all([
      invalidateProjectLifecycleQueries(queryClient),
      queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() }),
      ...additionalKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    ]);
  } catch (error) {
    console.error("Failed to refresh project queries", error);
  }
}

export function useUpdateProjectName() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateNameMutationOptions(),
    onSuccess: () => {
      void invalidateProjectDetailsQueries(queryClient, [Api.tasks.getQueryKeyPrefix()]);
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
