import Api, { type ProjectTemplate, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { findFileSize, useDownloadFile } from "@/models/blobs";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { compareIds, Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { FilePage, IconDownload, IconEdit, IconTrash, showErrorToast } from "turboui";
import React from "react";
import { useNavigate } from "react-router";

export default { name: "ProjectTemplateFilePage", loader, Page } as PageModule;

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
  if (node.type !== "file" || !node.file?.blob?.url) {
    throw new Response("Not found", { status: 404 });
  }

  return { template, node };
}

function Page() {
  const { template, node } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const navigate = useNavigate();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const file = node.file!;
  const blob = file.blob!;
  const [downloadFile] = useDownloadFile(blob.url!, file.name);
  const canEdit = Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess);
  const docsAndFilesLink = paths.projectTemplatePath(template.id, { tab: "docs-and-files" });

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
      navigation={navigation(template, paths)}
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
      mentionedPersonLookup={mentionedPersonLookup}
      hideReactions
      hideComments
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

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id, { tab: "docs-and-files" }), label: "Docs & Files" },
  ];
}
