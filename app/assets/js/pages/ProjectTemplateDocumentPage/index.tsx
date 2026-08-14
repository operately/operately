import Api, { type ProjectTemplate, type ProjectTemplateComment, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useTemplateComments } from "@/models/projectTemplates/useTemplateComments";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { compareIds, Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { DocumentPage, IconEdit, IconTrash, showErrorToast } from "turboui";
import React from "react";
import { useNavigate } from "react-router";

export default { name: "ProjectTemplateDocumentPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  node: ProjectTemplateResourceNode;
  comments: ProjectTemplateComment[];
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

  const { comments } = await Api.project_templates.listComments({
    templateId: template.id,
    parentType: "document",
    parentId: node.document.id,
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
  const document = node.document!;
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
      await Api.project_templates.deleteResource({ templateId: template.id, nodeId: node.id });
      navigate(docsAndFilesLink);
    } catch {
      showErrorToast("Resource not deleted", "The document is still on this page. Try again.");
    }
  }

  return (
    <DocumentPage
      pageTitle={[document.name, template.name]}
      navigation={navigation(template, paths)}
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

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id, { tab: "docs-and-files" }), label: "Docs & Files" },
  ];
}
