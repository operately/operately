import React from "react";
import { useNavigate } from "react-router";

import * as Pages from "@/components/Pages";
import * as ReactionsModel from "@/models/reactions";
import { files, resourceHubLandingPath } from "@/models/resourceHubs";
import { findFileSize, useDownloadFile } from "@/models/blobs";
import { usePaths } from "@/routes/paths";

import { useComments, useCommentSectionProps } from "@/features/CommentSection";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { assertPresent } from "@/utils/assertions";
import { FilePage } from "turboui";

import { useFilePageOptions } from "./Options";
import { useLoadedData } from "./loader";
import { buildFilePageNavigation } from "./navigation";

export function Page() {
  const { file, isCurrentUserSubscribed } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const refresh = Pages.useRefresh();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const [remove] = files.useDelete();
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
  const reactions = file.reactions.map((r) => r!);
  const entity = ReactionsModel.entity(file.id!, "resource_hub_file");
  const reactionsForm = ReactionsModel.useReactionsForm(entity, reactions);
  const commentsForm = useComments({ parentType: "resource_hub_file", file });
  const comments = useCommentSectionProps({
    form: commentsForm,
    commentParentType: "resource_hub_file",
    canComment: file.permissions.canCommentOnFile,
  });
  const subscriptionsState = useCurrentSubscriptionsAdapter({
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
