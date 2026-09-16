import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateProjectTemplateListQueries(
  queryClient: QueryClient,
  templateId?: string,
): Promise<void> {
  const refreshes = [queryClient.invalidateQueries({ queryKey: Api.project_templates.listQueryKeyPrefix() })];

  if (templateId) {
    const queryKey = Api.project_templates.getQueryKeyPrefix();
    refreshes.push(
      queryClient.invalidateQueries({
        queryKey,
        refetchType: "none",
        predicate: (query) =>
          compareIds((query.queryKey[queryKey.length] as { id?: string } | undefined)?.id, templateId),
      }),
    );
  }

  await Promise.all(refreshes).catch((error) => {
    console.error("Failed to refresh project template queries", error);
  });
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
    onSuccess: (_result, { id }) => invalidateProjectTemplateListQueries(queryClient, id),
  });
}

export function useRestoreProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.restoreMutationOptions(),
    onSuccess: (_result, { id }) => invalidateProjectTemplateListQueries(queryClient, id),
  });
}

export function useDeleteProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.deleteMutationOptions(),
    onSuccess: (_result, { id }) => invalidateProjectTemplateListQueries(queryClient, id),
  });
}

export function useCreateProjectTemplateFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.project_templates.createFromProjectMutationOptions(),
    onSuccess: (data) => {
      if (!data.template || data.scheduleIssues.length > 0) return;
      void invalidateProjectTemplateListQueries(queryClient).catch((error) => {
        console.error("Failed to refresh project template queries", error);
      });
    },
  });
}
