import Api, { type ProjectTemplate } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { compareIds } from "@/routes/paths";

export async function loader({ params }) {
  const templateInput = { id: params.templateId };

  const { template } = await Api.project_templates.getQuery(templateInput);

  const node = getResourceNode(template, params.id);
  const commentsInput = { templateId: template.id, parentType: "document" as const, parentId: node.document.id };

  await Api.project_templates.listCommentsQuery(commentsInput);

  return { templateInput, nodeId: params.id, commentsInput };
}

export function useLoadedData() {
  const { templateInput, nodeId, commentsInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.project_templates.getQueryOptions(templateInput));
  const { data: commentsData } = useLoadedQuery(Api.project_templates.listCommentsQueryOptions(commentsInput));

  const template = data?.template;

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!template.space?.id) throw new Error("Template space is unavailable");

  const node = getResourceNode(template, nodeId);

  if (!commentsData?.comments) throw new Error("Template comments are unavailable");

  return { template, node, comments: commentsData.comments };
}

function getResourceNode(template: ProjectTemplate, nodeId: string) {
  if (!template?.id) throw new Error("Template data is unavailable");
  const node = template.resourceNodes?.find((resource) => compareIds(resource.id, nodeId));

  if (!node?.id || node.type !== "document" || !node.document?.id) {
    throw new Response("Not found", { status: 404 });
  }

  return { ...node, document: node.document };
}
