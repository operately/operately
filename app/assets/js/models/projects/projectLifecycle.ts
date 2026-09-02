import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

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
