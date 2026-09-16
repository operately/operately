import { useCreateTemplateDocument } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { NewDocumentPage, showErrorToast } from "turboui";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateNewDocumentPage", loader, Page } as PageModule;

function Page() {
  const { template, parentFolderId } = useLoadedData();
  const createDocumentMutation = useCreateTemplateDocument({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const docsAndFilesLink = paths.projectTemplatePath(template.id, { tab: "docs-and-files", folderId: parentFolderId });

  async function createDocument(values: NewDocumentPage.Values, _meta: { isDraft: boolean }) {
    try {
      const result = await createDocumentMutation.mutateAsync({
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
