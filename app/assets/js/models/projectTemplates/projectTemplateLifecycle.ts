import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateProjectTemplateListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: Api.project_templates.listQueryKeyPrefix() });
}

export function useCreateProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.createMutationOptions(),
    onSuccess: () => void invalidateProjectTemplateListQueries(queryClient),
  });
}

export function useDuplicateProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.duplicateMutationOptions(),
    onSuccess: () => void invalidateProjectTemplateListQueries(queryClient),
  });
}

export function useArchiveProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.archiveMutationOptions(),
    onSuccess: () => void invalidateProjectTemplateListQueries(queryClient),
  });
}

export function useRestoreProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.restoreMutationOptions(),
    onSuccess: () => void invalidateProjectTemplateListQueries(queryClient),
  });
}

export function useDeleteProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.deleteMutationOptions(),
    onSuccess: () => void invalidateProjectTemplateListQueries(queryClient),
  });
}
