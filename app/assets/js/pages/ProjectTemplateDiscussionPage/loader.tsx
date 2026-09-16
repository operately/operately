import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const templateInput = { id: params.templateId };
  const discussionInput = { templateId: params.templateId, discussionId: params.id };
  const commentsInput = { templateId: params.templateId, parentType: "discussion" as const, parentId: params.id };

  await Promise.all([
    Api.project_templates.getQuery(templateInput),
    Api.project_templates.getDiscussionQuery(discussionInput),
    Api.project_templates.listCommentsQuery(commentsInput),
  ]);

  return { templateInput, discussionInput, commentsInput };
}

export function useLoadedData() {
  const { templateInput, discussionInput, commentsInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.project_templates.getQueryOptions(templateInput));
  const { data: discussionData } = useLoadedQuery(Api.project_templates.getDiscussionQueryOptions(discussionInput));
  const { data: commentsData } = useLoadedQuery(Api.project_templates.listCommentsQueryOptions(commentsInput));
  const template = data?.template;

  if (!template?.id) throw new Error("Template data is unavailable");
  if (!template.space?.id) throw new Error("Template space is unavailable");
  if (!discussionData?.discussion?.id) throw new Error("Template discussion is unavailable");
  if (!commentsData?.comments) throw new Error("Template comments are unavailable");

  return { template, discussion: discussionData.discussion, comments: commentsData.comments };
}
