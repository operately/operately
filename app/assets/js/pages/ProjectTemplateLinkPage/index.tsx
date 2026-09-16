import { useDeleteTemplateResource } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { useTemplateComments } from "@/models/projectTemplates/useTemplateComments";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { IconEdit, IconTrash, LinkPage, showErrorToast, type ResourceHubLinkType } from "turboui";
import React from "react";
import { useNavigate } from "react-router";

export default { name: "ProjectTemplateLinkPage", loader, Page } as PageModule;

function Page() {
  const { template, node, comments } = useLoadedData();
  const deleteResourceMutation = useDeleteTemplateResource({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const formattedTimePreferences = useFormattedTimePreferences();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const link = node.link;
  const canEdit = Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess);
  const docsAndFilesLink = paths.projectTemplatePath(template.id, { tab: "docs-and-files" });
  const commentsProps = useTemplateComments({
    templateId: template.id,
    parentType: "link",
    parentId: link.id,
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
      showErrorToast("Resource not deleted", "The link is still on this page. Try again.");
    }
  }

  return (
    <LinkPage
      pageTitle={[link.name, template.name]}
      navigation={buildProjectTemplateResourceNavigation(template, paths, { parentFolderId: node.parentFolderId })}
      options={[
        {
          type: "link",
          icon: IconEdit,
          label: "Edit",
          link: paths.projectTemplateEditLinkPath(template.id, node.id),
          keepOutsideOnBigScreen: true,
          testId: "edit-link-link",
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
      testId="project-template-link-page"
      linkType={link.type as ResourceHubLinkType}
      title={link.name}
      url={link.url}
      author={link.author ?? null}
      postedAt={link.insertedAt}
      formattedTimePreferences={formattedTimePreferences}
      description={link.description ?? null}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      hideReactions
      comments={commentsProps}
      hideSubscriptions
      deleteModal={{
        isOpen: showDeleteModal,
        onClose: toggleDeleteModal,
        linkName: link.name,
        onConfirm: handleDelete,
      }}
    />
  );
}
