import Api, { type ProjectTemplate, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { compareIds, Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { DocumentEditPage, showErrorToast } from "turboui";
import type { DocumentEditPage as DocumentEditPageTypes } from "turboui/DocumentEditPage/types";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateEditDocumentPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  node: ProjectTemplateResourceNode;
}

async function loader({ params }): Promise<LoadedData> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "project_templates",
    path: Paths.companyHomePath(params.companyId),
  });

  const { template } = await Api.project_templates.get({ id: params.templateId });
  const node = template.resourceNodes?.find((resourceNode) => compareIds(resourceNode.id, params.id));

  if (!node) throw new Response("Not found", { status: 404 });
  if (node.type !== "document" || !node.document) {
    throw new Response("Not found", { status: 404 });
  }

  return { template, node };
}

function Page() {
  const { template, node } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const navigate = useNavigate();
  const document = node.document!;
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const cancelLink = paths.projectTemplateDocumentPath(template.id, node.id);

  async function handleSubmit(
    values: DocumentEditPageTypes.Values,
    meta: { action: "save" | "publish-draft"; contentChanged: boolean },
  ) {
    try {
      if (meta.contentChanged) {
        await Api.project_templates.updateDocument({
          templateId: template.id,
          documentId: document.id,
          name: values.title,
          content: JSON.stringify(values.content),
        });
      }
      navigate(cancelLink);
      return true;
    } catch {
      showErrorToast("Document not updated", "Check the form and try again.");
      return false;
    }
  }

  return (
    <DocumentEditPage
      pageTitle={["Edit Document", template.name]}
      navigation={navigation(template, document.name, cancelLink, paths)}
      testId="project-template-edit-document-page"
      richTextHandlers={richTextHandlers}
      initialTitle={document.name}
      initialContent={JSON.parse(document.content)}
      cancelLink={cancelLink}
      hideSubscriptions
      hidePublishAction
      onSubmit={handleSubmit}
    />
  );
}

function navigation(template: ProjectTemplate, documentName: string, documentLink: string, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id) + "?tab=docs-and-files", label: "Docs & Files" },
    { to: documentLink, label: documentName },
  ];
}
