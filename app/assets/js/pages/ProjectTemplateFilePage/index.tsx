import { useDeleteTemplateResource } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { findFileSize, useDownloadFile } from "@/models/blobs";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichTextHandlers } from "@/hooks/useRichTextHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { useTemplateComments } from "@/models/projectTemplates/useTemplateComments";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { FilePage, IconDownload, IconEdit, IconTrash, showErrorToast } from "turboui";
import React from "react";
import { useNavigate } from "react-router";

export default { name: "ProjectTemplateFilePage", loader, Page } as PageModule;

function Page() {
  const { template, node, comments } = useLoadedData();
  const deleteResourceMutation = useDeleteTemplateResource({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const formattedTimePreferences = useFormattedTimePreferences();
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const file = node.file;
  const blob = file.blob;
  const [downloadFile] = useDownloadFile(blob.url, file.name);
  const canEdit = !template.archivedAt && Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess);
  const richTextHandlers = useRichTextHandlers({
    scope: { type: "space", id: template.space.id },
    templateComments: true,
    taskList: { resourceType: "template_file", resourceId: file.id, field: "description", canEdit },
  });
  const docsAndFilesLink = paths.projectTemplatePath(template.id, { tab: "docs-and-files" });
  const commentsProps = useTemplateComments({
    templateId: template.id,
    parentType: "file",
    parentId: file.id,
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
      showErrorToast("Resource not deleted", "The file is still on this page. Try again.");
    }
  }

  return (
    <FilePage
      pageTitle={[file.name, template.name]}
      navigation={buildProjectTemplateResourceNavigation(template, paths, { parentFolderId: node.parentFolderId })}
      options={[
        {
          type: "action",
          icon: IconDownload,
          label: "Download",
          onClick: downloadFile,
          testId: "download-file-link",
        },
        {
          type: "link",
          icon: IconEdit,
          label: "Edit",
          link: paths.projectTemplateEditFilePath(template.id, node.id),
          keepOutsideOnBigScreen: true,
          testId: "edit-file-link",
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
      testId="project-template-file-page"
      title={file.name}
      author={file.author ?? null}
      postedAt={file.insertedAt}
      formattedTimePreferences={formattedTimePreferences}
      filename={blob.filename || file.name}
      fileSize={findFileSize(blob.size ?? 0)}
      viewUrl={blob.url}
      onDownload={downloadFile}
      blob={{
        url: blob.url,
        contentType: blob.contentType,
        width: blob.width,
        height: blob.height,
      }}
      description={file.description ?? null}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      taskList={richTextHandlers.taskList}
      hideReactions
      comments={commentsProps}
      hideSubscriptions
      deleteModal={{
        isOpen: showDeleteModal,
        onClose: toggleDeleteModal,
        fileName: file.name,
        onConfirm: handleDelete,
      }}
    />
  );
}
