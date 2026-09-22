import React from "react";
import { useNavigate } from "react-router";

import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import { type QueryClient } from "@tanstack/react-query";
import { invalidateResourceHubInteractionQueries } from "@/models/resourceHubs/resourceHubInteractionQueries";
import {
  resourceHubLandingPath,
  useCopyDocumentListContext,
  useDeleteDocument,
  usePublishDocument,
} from "@/models/resourceHubs";
import { compareIds, usePaths } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentCompanyContext";

import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { assertPresent } from "@/utils/assertions";
import { DocumentPage, displayDate } from "turboui";

import { useLoadedData, useRefresh } from "./loader";
import { buildDocumentPageNavigation, buildNavigationDocument } from "./navigation";
import { useDocumentPageOptions } from "./Options";

export function Page() {
  const { document, folder, resourceHub, isCurrentUserSubscribed } = useLoadedData();
  const me = useMe();
  const paths = usePaths();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const [isCopyFormOpen, _, openCopyForm, closeCopyForm] = useBoolState(false);
  const [showDeleteConfirmModal, toggleDeleteConfirmModal] = useBoolState(false);

  const mutationScope = {
    spaceId: document.space?.id,
    resourceHubId: document.resourceHubId,
    parentFolderId: document.parentFolderId,
  };

  const { mutateAsync: remove } = useDeleteDocument(mutationScope);
  const { mutateAsync: publish } = usePublishDocument(mutationScope);

  const navigationDocument = buildNavigationDocument(document, resourceHub);
  const pageResourceHub = navigationDocument.resourceHub;
  const copyListContext = useCopyDocumentListContext(folder ?? pageResourceHub, document);
  const options = useDocumentPageOptions({ showCopyModal: openCopyForm, showDeleteModal: toggleDeleteConfirmModal });

  assertPresent(document.notifications, "notifications must be present in document");
  assertPresent(document.author, "author must be present in document");
  assertPresent(document.permissions?.canCommentOnDocument, "permissions must be present in document");
  assertPresent(document.potentialSubscribers, "potentialSubscribers must be present in document");
  assertPresent(document.subscriptionList, "subscriptionList must be present in document");

  React.useEffect(closeCopyForm, [document.id]);

  const entity = { id: document.id, type: "resource_hub_document" as const };
  const invalidateQueries = (client: QueryClient, refetchType: "active" | "none") =>
    invalidateResourceHubInteractionQueries(client, { ...entity, ...mutationScope }, refetchType);

  const reactionsForm = useOptimisticReactions({
    entity,
    initialReactions: document.reactions ?? undefined,
    onRefresh: refresh,
  });
  const comments = useCommentSection({
    entity,
    mentionSearchScope: { type: "resource_hub", id: document.resourceHubId },
    invalidateQueries,
    canComment: document.permissions.canCommentOnDocument,
  });
  useReadNotificationsOnLoad(document.notifications, (client) => invalidateQueries(client, "none"));

  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: document.potentialSubscribers,
    subscriptionList: document.subscriptionList,
    resourceName: "document",
    type: "resource_hub_document",
    onRefresh: refresh,
  });

  const isDraft = document.state === "draft";
  const canPublish = Boolean(document.author && me && compareIds(me.id, document.author.id));

  async function handleDelete() {
    await remove({ documentId: document.id });

    if (folder) {
      navigate(paths.resourceHubFolderPath(folder.id!));
    } else {
      navigate(resourceHubLandingPath(paths, document));
    }
  }

  async function handlePublish() {
    await publish({ documentId: document.id });
    await refresh();
  }

  if (!comments) return null;

  const shared = {
    pageTitle: document.name!,
    navigation: buildDocumentPageNavigation(document, resourceHub, paths),
    options,
    testId: "resource-hub-document-page",
    title: document.name!,
    author: document.author,
    state: document.state!,
    publishedAt: displayDate(document),
    modifiedAt: document.updatedAt,
    formattedTimePreferences,
    content: document.content!,
    mentionedPersonLookup,
    reactions: {
      ...reactionsForm,
      size: 24,
      canAddReaction: document.permissions.canCommentOnDocument,
    },
    comments,
    subscriptions: {
      ...subscriptionsState,
      isCurrentUserSubscribed,
      canEditSubscribers: document.permissions?.canEditDocument || false,
    },
    copyModal: {
      isOpen: isCopyFormOpen,
      onClose: closeCopyForm,
      listContext: copyListContext,
      document,
    },
    deleteModal: {
      isOpen: showDeleteConfirmModal,
      onClose: toggleDeleteConfirmModal,
      documentName: document.name!,
      onConfirm: handleDelete,
    },
  };

  if (isDraft) {
    return (
      <DocumentPage
        {...shared}
        draftActions={{
          state: "draft",
          updatedAt: document.updatedAt!,
          editPath: paths.resourceHubEditDocumentPath(document.id),
          onPublish: canPublish ? handlePublish : undefined,
          formattedTimePreferences,
        }}
      />
    );
  }

  return <DocumentPage {...shared} hideDraftActions />;
}
