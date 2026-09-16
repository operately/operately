import { useUpdateTemplateDocument } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { DocumentEditPage, showErrorToast } from "turboui";
import type { DocumentEditPage as DocumentEditPageTypes } from "turboui/DocumentEditPage/types";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateEditDocumentPage", loader, Page } as PageModule;

function Page() {
  const { template, node } = useLoadedData();
  const updateDocumentMutation = useUpdateTemplateDocument({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const document = node.document;
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const cancelLink = paths.projectTemplateDocumentPath(template.id, node.id);

  async function handleSubmit(
    values: DocumentEditPageTypes.Values,
    meta: { action: "save" | "publish-draft"; contentChanged: boolean },
  ) {
    try {
      if (meta.contentChanged) {
        await updateDocumentMutation.mutateAsync({
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
      navigation={buildProjectTemplateResourceNavigation(template, paths, {
        parentFolderId: node.parentFolderId,
        current: { to: cancelLink, label: document.name },
      })}
      testId="project-template-edit-document-page"
      richTextHandlers={richTextHandlers}
      initialTitle={document.name}
      initialContent={JSON.parse(document.content || "{}")}
      cancelLink={cancelLink}
      hideSubscriptions
      hidePublishAction
      onSubmit={handleSubmit}
    />
  );
}
