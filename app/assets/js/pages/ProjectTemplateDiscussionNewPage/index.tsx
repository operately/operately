import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { type ProjectTemplate } from "@/api";
import { useCreateTemplateDiscussion } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { showErrorToast, TemplateDiscussionForm } from "turboui";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateDiscussionNewPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const { template } = useLoadedData();
  const createDiscussionMutation = useCreateTemplateDiscussion({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });

  async function createDiscussion(values: TemplateDiscussionForm.Values) {
    try {
      const result = await createDiscussionMutation.mutateAsync({
        templateId: template.id,
        title: values.title,
        body: JSON.stringify(values.body),
      });
      navigate(paths.projectTemplateDiscussionPath(template.id, result.discussion.id));
      return true;
    } catch {
      showErrorToast(i18n.t("Discussion not created"), i18n.t("Check the form and try again."));
      return false;
    }
  }

  return (
    <TemplateDiscussionForm
      pageTitle={[t("New Discussion"), template.name]}
      navigation={navigation(template, paths)}
      richTextHandlers={richTextHandlers}
      cancelLink={paths.projectTemplatePath(template.id, { tab: "discussions" })}
      submitLabel={t("Post Discussion")}
      onSubmit={createDiscussion}
    />
  );
}

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: i18n.t("Project Templates") },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id, { tab: "discussions" }), label: i18n.t("Discussions") },
  ];
}
