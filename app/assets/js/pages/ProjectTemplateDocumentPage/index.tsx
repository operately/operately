import { useDeleteTemplateResource } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { useTemplateComments } from "@/models/projectTemplates/useTemplateComments";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { DocumentPage, IconEdit, IconTrash, showErrorToast } from "turboui";
import React from "react";
import { useNavigate } from "react-router";

export default { name: "ProjectTemplateDocumentPage", loader, Page } as PageModule;

function Page() {
  const { template, node, comments } = useLoadedData();
  const deleteResourceMutation = useDeleteTemplateResource({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const formattedTimePreferences = useFormattedTimePreferences();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const document = node.document;
  const canEdit = Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess);
  const docsAndFilesLink = paths.projectTemplatePath(template.id, { tab: "docs-and-files" });
  const commentsProps = useTemplateComments({
    templateId: template.id,
    parentType: "document",
    parentId: document.id,
    comments,
    canEdit,
    richTextHandlers,
    formattedTimePreferences,
  });

  async function handleDelete() {
    try {
      await deleteResourceMutation.mutateAsync({ templateId: template.id, nodeId: node.id });
      navigate(docsAndFilesLink);
    } catch {
      showErrorToast("Resource not deleted", "The document is still on this page. Try again.");
    }
  }

  return (
    <DocumentPage
      pageTitle={[document.name, template.name]}
      navigation={buildProjectTemplateResourceNavigation(template, paths, { parentFolderId: node.parentFolderId })}
      options={[
        {
          type: "link",
          icon: IconEdit,
          label: "Edit",
          link: paths.projectTemplateEditDocumentPath(template.id, node.id),
          keepOutsideOnBigScreen: true,
          testId: "edit-document-link",
        },
        {
          type: "action",
          icon: IconTrash,
          label: "Delete",
          onClick: toggleDeleteModal,
          hidden: !canEdit,
          testId: "delete-resource-link",
        },
      ]}
      testId="project-template-document-page"
      title={document.name}
      author={document.author ?? null}
      state="published"
      publishedAt={document.insertedAt}
      modifiedAt={document.updatedAt}
      formattedTimePreferences={formattedTimePreferences}
      content={document.content}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      resolveResourceLinkTitles={richTextHandlers.resolveResourceLinkTitles}
      hideDraftActions
      hideReactions
      comments={commentsProps}
      hideSubscriptions
      hideCopyModal
      deleteModal={{
        isOpen: showDeleteModal,
        onClose: toggleDeleteModal,
        documentName: document.name,
        onConfirm: handleDelete,
      }}
    />
  );
}
