import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { type ResourceHubLinkType } from "turboui";

export async function loader({ params, request }) {
  const templateInput = { id: params.templateId };
  const url = new URL(request.url);
  const parentFolderId = url.searchParams.get("folderId") || undefined;
  const linkType = (url.searchParams.get("type") || "other") as ResourceHubLinkType;

  await Api.project_templates.getQuery(templateInput);

  return { templateInput, parentFolderId, linkType };
}

export function useLoadedData() {
  const { templateInput, parentFolderId, linkType } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.project_templates.getQueryOptions(templateInput));
  const template = data?.template;

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!template.space?.id) throw new Error("Template space is unavailable");

  return { template, parentFolderId, linkType };
}
