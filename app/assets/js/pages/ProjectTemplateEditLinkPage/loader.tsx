import Api, { type ProjectTemplate } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { compareIds } from "@/routes/paths";

export async function loader({ params }) {
  const templateInput = { id: params.templateId };
  const { template } = await Api.project_templates.getQuery(templateInput);
  getResourceNode(template, params.id);

  return { templateInput, nodeId: params.id };
}

export function useLoadedData() {
  const { templateInput, nodeId } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.project_templates.getQueryOptions(templateInput));
  const template = data?.template;

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!template.space?.id) throw new Error("Template space is unavailable");
  const node = getResourceNode(template, nodeId);

  return { template, node };
}

function getResourceNode(template: ProjectTemplate, nodeId: string) {
  if (!template?.id) throw new Error("Template data is unavailable");
  const node = template.resourceNodes?.find((resource) => compareIds(resource.id, nodeId));

  if (!node?.id || node.type !== "link" || !node.link?.id) {
    throw new Response("Not found", { status: 404 });
  }

  return { ...node, link: node.link };
}
