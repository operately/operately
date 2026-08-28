import Api, { type ProjectTemplate, type ProjectTemplateComment, type ProjectTemplateDiscussion } from "@/api";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useTemplateComments } from "@/models/projectTemplates/useTemplateComments";
import * as People from "@/models/people";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { TemplateDiscussionPage } from "turboui";
import React from "react";

export default { name: "ProjectTemplateDiscussionPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  discussion: ProjectTemplateDiscussion;
  comments: ProjectTemplateComment[];
}

async function loader({ params }): Promise<LoadedData> {

  const [templateResult, discussionResult, commentsResult] = await Promise.all([
    Api.project_templates.get({ id: params.templateId }),
    Api.project_templates.getDiscussion({ templateId: params.templateId, discussionId: params.id }),
    Api.project_templates.listComments({ templateId: params.templateId, parentType: "discussion", parentId: params.id }),
  ]);

  return { template: templateResult.template, discussion: discussionResult.discussion, comments: commentsResult.comments };
}

function Page() {
  const { template, discussion, comments } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const formattedTimePreferences = useFormattedTimePreferences();
  const canEdit = Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess);
  const commentsProps = useTemplateComments({
    templateId: template.id,
    parentType: "discussion",
    parentId: discussion.id,
    comments,
    canEdit,
    richTextHandlers,
    formattedTimePreferences,
  });

  return (
    <TemplateDiscussionPage
      pageTitle={[discussion.title, template.name]}
      navigation={navigation(template, paths)}
      discussion={{
        title: discussion.title,
        body: JSON.parse(discussion.body || "{}"),
        author: discussion.author ? People.parsePersonForTurboUi(paths, discussion.author) : null,
        insertedAt: new Date(discussion.insertedAt),
      }}
      editLink={canEdit ? paths.projectTemplateDiscussionEditPath(template.id, discussion.id) : undefined}
      comments={commentsProps}
      richTextHandlers={richTextHandlers}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id, { tab: "discussions" }), label: "Discussions" },
  ];
}
