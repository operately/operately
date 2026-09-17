import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const templateInput = { id: params.templateId };
  const discussionInput = { templateId: params.templateId, discussionId: params.id };

  await Promise.all([
    Api.project_templates.getQuery(templateInput),
    Api.project_templates.getDiscussionQuery(discussionInput),
  ]);

  return { templateInput, discussionInput };
}

export function useLoadedData() {
  const { templateInput, discussionInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.project_templates.getQueryOptions(templateInput));
  const { data: discussionData } = useLoadedQuery(Api.project_templates.getDiscussionQueryOptions(discussionInput));
  const template = data?.template;

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!template.space?.id) throw new Error("Template space is unavailable");
  if (!discussionData?.discussion?.id) throw new Error("Template discussion is unavailable");

  return { template, discussion: discussionData.discussion };
}
