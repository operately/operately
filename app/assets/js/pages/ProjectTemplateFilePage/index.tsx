import Api, { type ProjectTemplate, type ProjectTemplateComment, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { findFileSize, useDownloadFile } from "@/models/blobs";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { useTemplateComments } from "@/models/projectTemplates/useTemplateComments";
import { compareIds, Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { FilePage, IconDownload, IconEdit, IconTrash, showErrorToast } from "turboui";
import React from "react";
import { useNavigate } from "react-router";

export default { name: "ProjectTemplateFilePage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  node: ProjectTemplateResourceNode;
  comments: ProjectTemplateComment[];
}

async function loader({ params }): Promise<LoadedData> {

  const { template } = await Api.project_templates.get({ id: params.templateId });
  const node = template.resourceNodes?.find((resourceNode) => compareIds(resourceNode.id, params.id));

  if (!node) throw new Response("Not found", { status: 404 });
  if (node.type !== "file" || !node.file?.blob?.url) {
    throw new Response("Not found", { status: 404 });
  }

  const { comments } = await Api.project_templates.listComments({
    templateId: template.id,
    parentType: "file",
    parentId: node.file.id,
  });

  return { template, node, comments };
}

function Page() {
  const { template, node, comments } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const navigate = useNavigate();
  const formattedTimePreferences = useFormattedTimePreferences();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const file = node.file!;
  const blob = file.blob!;
  const [downloadFile] = useDownloadFile(blob.url!, file.name);
  const canEdit = Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess);
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
      await Api.project_templates.deleteResource({ templateId: template.id, nodeId: node.id });
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
      viewUrl={blob.url!}
      onDownload={downloadFile}
      blob={{
        url: blob.url!,
        contentType: blob.contentType,
        width: blob.width,
        height: blob.height,
      }}
      description={file.description ?? null}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
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

