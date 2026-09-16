import { type ProjectTemplate, type ProjectTemplateDiscussion } from "@/api";
import { useUpdateTemplateDiscussion } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { showErrorToast, TemplateDiscussionForm } from "turboui";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateDiscussionEditPage", loader, Page } as PageModule;

function Page() {
  const { template, discussion } = useLoadedData();
  const updateDiscussionMutation = useUpdateTemplateDiscussion({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });

  return (
    <TemplateDiscussionForm
      pageTitle={["Edit", discussion.title, template.name]}
      navigation={navigation(template, discussion, paths)}
      initialValues={{ title: discussion.title, body: JSON.parse(discussion.body || "{}") }}
      richTextHandlers={richTextHandlers}
      cancelLink={paths.projectTemplateDiscussionPath(template.id, discussion.id)}
      submitLabel="Save"
      onSubmit={async (values) => {
        try {
          await updateDiscussionMutation.mutateAsync({
            templateId: template.id,
            discussionId: discussion.id,
            title: values.title,
            body: JSON.stringify(values.body),
          });
          navigate(paths.projectTemplateDiscussionPath(template.id, discussion.id));
          return true;
        } catch {
          showErrorToast("Discussion not updated", "Check the form and try again.");
          return false;
        }
      }}
    />
  );
}

function navigation(template: ProjectTemplate, discussion: ProjectTemplateDiscussion, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id, { tab: "discussions" }), label: "Discussions" },
    { to: paths.projectTemplateDiscussionPath(template.id, discussion.id), label: discussion.title },
  ];
}
