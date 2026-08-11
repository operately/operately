import Api, { type ProjectTemplate } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { showErrorToast, TemplateDiscussionForm } from "turboui";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateDiscussionNewPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
}

async function loader({ params }): Promise<LoadedData> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "project_templates",
    path: Paths.companyHomePath(params.companyId),
  });

  return Api.project_templates.get({ id: params.templateId });
}

function Page() {
  const { template } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });

  async function createDiscussion(values: TemplateDiscussionForm.Values) {
    try {
      const result = await Api.project_templates.createDiscussion({
        templateId: template.id,
        title: values.title,
        body: JSON.stringify(values.body),
      });
      navigate(paths.projectTemplateDiscussionPath(template.id, result.discussion.id));
      return true;
    } catch {
      showErrorToast("Discussion not created", "Check the form and try again.");
      return false;
    }
  }

  return (
    <TemplateDiscussionForm
      pageTitle={["New Discussion", template.name]}
      navigation={navigation(template, paths)}
      richTextHandlers={richTextHandlers}
      cancelLink={paths.projectTemplatePath(template.id) + "?tab=discussions"}
      submitLabel="Post Discussion"
      onSubmit={createDiscussion}
    />
  );
}

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id) + "?tab=discussions", label: "Discussions" },
  ];
}
