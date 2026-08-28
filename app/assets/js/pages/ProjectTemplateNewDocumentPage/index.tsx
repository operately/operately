import Api, { type ProjectTemplate } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { NewDocumentPage, showErrorToast } from "turboui";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateNewDocumentPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  parentFolderId: string | undefined;
}

async function loader({ params, request }): Promise<LoadedData> {

  const url = new URL(request.url);
  const parentFolderId = url.searchParams.get("folderId") || undefined;
  const { template } = await Api.project_templates.get({ id: params.templateId });

  return { template, parentFolderId };
}

function Page() {
  const { template, parentFolderId } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const docsAndFilesLink = paths.projectTemplatePath(template.id, { tab: "docs-and-files", folderId: parentFolderId });

  async function createDocument(values: NewDocumentPage.Values, _meta: { isDraft: boolean }) {
    try {
      const result = await Api.project_templates.createDocument({
        templateId: template.id,
        parentFolderId,
        name: values.title,
        content: JSON.stringify(values.content),
      });
      navigate(paths.projectTemplateDocumentPath(template.id, result.document.nodeId));
      return true;
    } catch {
      showErrorToast("Document not created", "Check the form and try again.");
      return false;
    }
  }

  return (
    <NewDocumentPage
      pageTitle={["New Document", template.name]}
      navigation={buildProjectTemplateResourceNavigation(template, paths, { parentFolderId })}
      testId="project-template-new-document-page"
      richTextHandlers={richTextHandlers}
      cancelLink={docsAndFilesLink}
      hideSubscriptions
      hideDraftActions
      onSubmit={createDocument}
    />
  );
}

