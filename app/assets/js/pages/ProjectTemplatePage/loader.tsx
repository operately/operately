import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { invalidateTemplateEditorQueries } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const queryInput = { id: params.id };
  await Api.project_templates.getQuery(queryInput);
  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.project_templates.getQueryOptions(queryInput));
  const template = data?.template;

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!template.space?.id) throw new Error("Template space is unavailable");

  return { template };
}

export function useRefresh() {
  const client = useQueryClient();
  const { template } = useLoadedData();
  const scope = { templateId: template.id, spaceId: template.space.id };

  return () => invalidateTemplateEditorQueries(client, scope, "active");
}

export type LoadedData = ReturnType<typeof useLoadedData>;
