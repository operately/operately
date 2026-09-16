import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { invalidateTemplateEditorQueries } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { useQueryClient } from "@tanstack/react-query";
import { compareIds, Paths } from "@/routes/paths";
import { redirect } from "react-router";

export async function loader({ params }) {
  const queryInput = { id: params.templateId };
  const { template } = await Api.project_templates.getQuery(queryInput);

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!(template.milestones ?? []).some((item) => compareIds(item.id, params.id))) {
    throw redirect(new Paths({ companyId: params.companyId }).projectTemplatePath(params.templateId));
  }

  return { queryInput, milestoneId: params.id };
}

export function useLoadedData() {
  const { queryInput, milestoneId } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.project_templates.getQueryOptions(queryInput));
  const template = data?.template;

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!template.space?.id) throw new Error("Template space is unavailable");

  const milestone = (template.milestones ?? []).find((item) => compareIds(item.id, milestoneId));

  if (!milestone) throw new Error("Template milestone is unavailable");

  return { template, milestone };
}

export function useRefresh() {
  const client = useQueryClient();
  const { template } = useLoadedData();
  const scope = { templateId: template.id, spaceId: template.space.id };

  return () => invalidateTemplateEditorQueries(client, scope, "active");
}
