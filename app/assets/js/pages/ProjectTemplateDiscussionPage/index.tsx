import Api, { type ProjectTemplate, type ProjectTemplateDiscussion } from "@/api";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import * as People from "@/models/people";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { TemplateDiscussionPage } from "turboui";
import React from "react";

export default { name: "ProjectTemplateDiscussionPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  discussion: ProjectTemplateDiscussion;
}

async function loader({ params }): Promise<LoadedData> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "project_templates",
    path: Paths.companyHomePath(params.companyId),
  });

  const [templateResult, discussionResult] = await Promise.all([
    Api.project_templates.get({ id: params.templateId }),
    Api.project_templates.getDiscussion({ templateId: params.templateId, discussionId: params.id }),
  ]);

  return { template: templateResult.template, discussion: discussionResult.discussion };
}

function Page() {
  const { template, discussion } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const formattedTimePreferences = useFormattedTimePreferences();

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
      editLink={
        template.permissions?.canEdit ? paths.projectTemplateDiscussionEditPath(template.id, discussion.id) : undefined
      }
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
