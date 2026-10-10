import { useEffect, useRef } from "react";
import type { CuratedTemplate, TemplateInput, TemplateSaveIntent } from "turboui";
import { useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { assertPresent } from "@/utils/assertions";
import AdminApi from "@/ee/admin_api";

export const curatedTemplatesPath = "/admin/curated-templates";
export const curatedTemplatePath = (id: string) => `${curatedTemplatesPath}/${id}`;

export async function invalidateCuratedTemplates(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: AdminApi.curated_templates.listQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: AdminApi.curated_templates.getQueryKeyPrefix() }),
  ]);
}

function useCreateCuratedTemplate() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.curated_templates.createMutationOptions(),
    onSuccess: () => invalidateCuratedTemplates(client),
  });
}
function useUpdateCuratedTemplate() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.curated_templates.updateMutationOptions(),
    onSuccess: () => invalidateCuratedTemplates(client),
  });
}
function usePublishCuratedTemplate() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.curated_templates.publishMutationOptions(),
    onSuccess: () => invalidateCuratedTemplates(client),
  });
}
export function useDeleteCuratedTemplate() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.curated_templates.deleteMutationOptions(),
    onSuccess: () => client.invalidateQueries({ queryKey: AdminApi.curated_templates.listQueryKeyPrefix() }),
  });
}
// Keep the saved draft after publication fails, so retries update it rather than create another.
export function useSaveCuratedTemplate(initialTemplate?: CuratedTemplate) {
  const persisted = useRef(initialTemplate);
  useEffect(() => {
    persisted.current = initialTemplate;
  }, [initialTemplate]);
  const create = useCreateCuratedTemplate();
  const update = useUpdateCuratedTemplate();
  const publish = usePublishCuratedTemplate();

  const save = async (input: TemplateInput, intent: TemplateSaveIntent) => {
    const current = persisted.current;
    const saved = current
      ? await update.mutateAsync({ ...input, id: current.id, expectedUpdatedAt: current.updatedAt })
      : await create.mutateAsync(input);
    if (saved.errors.length || !saved.template) return saved;

    persisted.current = saved.template;
    if (intent === "draft" || saved.template.state === "published") return saved;

    const result = await publish.mutateAsync({ id: saved.template.id, expectedUpdatedAt: saved.template.updatedAt });
    if (result.template) persisted.current = result.template;
    return result;
  };

  const getIdentity = () => {
    assertPresent(persisted.current, "Template is required for this action");
    return { id: persisted.current.id, expectedUpdatedAt: persisted.current.updatedAt };
  };

  return { save, getIdentity };
}
