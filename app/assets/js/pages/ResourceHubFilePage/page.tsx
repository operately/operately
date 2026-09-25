import { useTaskList } from "@/models/richContent/taskListLifecycle";
import React from "react";
import { useNavigate } from "react-router";

import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { type QueryClient } from "@tanstack/react-query";
import { invalidateResourceHubInteractionQueries } from "@/models/resourceHubs/resourceHubInteractionQueries";
import { resourceHubLandingPath, useDeleteFile } from "@/models/resourceHubs";
import { findFileSize, useDownloadFile } from "@/models/blobs";
import { usePaths } from "@/routes/paths";

import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { assertPresent } from "@/utils/assertions";
import { FilePage } from "turboui";

import { useFilePageOptions } from "./Options";
import { useLoadedData, useRefresh } from "./loader";
import { buildFilePageNavigation } from "./navigation";

export function Page() {
  const { file, isCurrentUserSubscribed } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const taskList = useTaskList({
    resourceType: "file",
    resourceId: file.id,
    field: "description",
    canEdit: file.permissions?.canEditFile ?? false,
  });
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);

  const mutationScope = {
    spaceId: file.space?.id,
    resourceHubId: file.resourceHubId,
    parentFolderId: file.parentFolderId,
  };
  const { mutateAsync: remove } = useDeleteFile(mutationScope);
  const options = useFilePageOptions({ showDeleteModal: toggleDeleteModal });

  assertPresent(file.name, "name must be present in file");
  assertPresent(file.author, "author must be present in file");
  assertPresent(file.insertedAt, "insertedAt must be present in file");
  assertPresent(file.description, "description must be present in file");
  assertPresent(file.blob, "blob must be present in file");
  assertPresent(file.blob.url, "url must be present in file.blob");
  assertPresent(file.blob.size, "size must be present in file.blob");
  assertPresent(file.permissions?.canCommentOnFile, "permissions must be present in file");
  assertPresent(file.reactions, "reactions must be present in file");
  assertPresent(file.potentialSubscribers, "potentialSubscribers must be present in file");
  assertPresent(file.subscriptionList, "subscriptionList must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.name);
  const entity = { id: file.id, type: "resource_hub_file" as const };
  const invalidateQueries = (client: QueryClient, refetchType: "active" | "none") =>
    invalidateResourceHubInteractionQueries(client, { ...entity, ...mutationScope }, refetchType);

  const reactionsForm = useOptimisticReactions({
    entity,
    initialReactions: file.reactions ?? undefined,
    onRefresh: refresh,
  });
  const comments = useCommentSection({
    entity,
    mentionSearchScope: { type: "resource_hub", id: file.resourceHubId },
    invalidateQueries,
    canComment: file.permissions.canCommentOnFile,
  });
  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: file.potentialSubscribers,
    subscriptionList: file.subscriptionList,
    resourceName: "file",
    type: "resource_hub_file",
    onRefresh: refresh,
  });

  async function handleDelete() {
    await remove({ fileId: file.id });

    if (file.parentFolder) {
      navigate(paths.resourceHubFolderPath(file.parentFolder.id!));
    } else {
      navigate(resourceHubLandingPath(paths, file));
    }
  }

  if (!comments) return null;

  return (
    <FilePage
      taskList={taskList}
      pageTitle={file.name}
      navigation={buildFilePageNavigation(file, paths)}
      options={options}
      testId="resource-hub-file-page"
      title={file.name}
      author={file.author}
      postedAt={file.insertedAt}
      formattedTimePreferences={formattedTimePreferences}
      filename={file.blob.filename || file.name}
      fileSize={findFileSize(file.blob.size)}
      viewUrl={file.blob.url}
      onDownload={downloadFile}
      blob={{
        url: file.blob.url,
        contentType: file.blob.contentType,
        width: file.blob.width,
        height: file.blob.height,
      }}
      description={file.description}
      mentionedPersonLookup={mentionedPersonLookup}
      reactions={{
        ...reactionsForm,
        size: 24,
        canAddReaction: file.permissions.canCommentOnFile,
      }}
      comments={comments}
      subscriptions={{
        ...subscriptionsState,
        isCurrentUserSubscribed,
        canEditSubscribers: file.permissions?.canEditFile || false,
      }}
      deleteModal={{
        isOpen: showDeleteModal,
        onClose: toggleDeleteModal,
        fileName: file.name,
        onConfirm: handleDelete,
      }}
    />
  );
}
