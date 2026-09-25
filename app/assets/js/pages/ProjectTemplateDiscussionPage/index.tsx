import { type ProjectTemplate } from "@/api";
import { loader, useLoadedData } from "./loader";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichTextHandlers } from "@/hooks/useRichTextHandlers";
import { useTemplateComments } from "@/models/projectTemplates/useTemplateComments";
import * as People from "@/models/people";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { TemplateDiscussionPage } from "turboui";
import React from "react";

export default { name: "ProjectTemplateDiscussionPage", loader, Page } as PageModule;

function Page() {
  const { template, discussion, comments } = useLoadedData();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const canEdit = !template.archivedAt && Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess);
  const richTextHandlers = useRichTextHandlers({
    scope: { type: "space", id: template.space.id },
    templateComments: true,
    taskList: { resourceType: "template_discussion", resourceId: discussion.id, field: "body", canEdit },
  });
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
