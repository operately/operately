import React from "react";
import { useNavigate } from "react-router";

import * as Pages from "@/components/Pages";
import * as ReactionsModel from "@/models/reactions";
import { documents, resourceHubLandingPath, useCopyDocumentListContext } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";

import { useComments, useCommentSectionProps } from "@/features/CommentSection";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { assertPresent } from "@/utils/assertions";
import { DocumentPage, displayDate } from "turboui";

import { useLoadedData } from "./loader";
import { buildDocumentPageNavigation, buildNavigationDocument } from "./navigation";
import { useDocumentPageOptions } from "./Options";

export function Page() {
  const { document, folder, resourceHub, isCurrentUserSubscribed } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const refresh = Pages.useRefresh();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers();
  const [isCopyFormOpen, _, openCopyForm, closeCopyForm] = useBoolState(false);
  const [showDeleteConfirmModal, toggleDeleteConfirmModal] = useBoolState(false);
  const [remove] = documents.useDelete();
  const [publish] = documents.usePublish();

  const navigationDocument = buildNavigationDocument(document, resourceHub);
  const pageResourceHub = navigationDocument.resourceHub;
  const copyListContext = useCopyDocumentListContext(folder ?? pageResourceHub, document);
  const options = useDocumentPageOptions({ showCopyModal: openCopyForm, showDeleteModal: toggleDeleteConfirmModal });

  assertPresent(document.notifications, "notifications must be present in document");
  assertPresent(document.author, "author must be present in document");
  assertPresent(document.permissions?.canCommentOnDocument, "permissions must be present in document");
  assertPresent(document.potentialSubscribers, "potentialSubscribers must be present in document");
  assertPresent(document.subscriptionList, "subscriptionList must be present in document");
  useClearNotificationsOnLoad(document.notifications);

  React.useEffect(closeCopyForm, [document.id]);

  const reactions = document.reactions!.map((r) => r!);
  const entity = ReactionsModel.entity(document.id!, "resource_hub_document");
  const reactionsForm = ReactionsModel.useReactionsForm(entity, reactions);
  const commentsForm = useComments({ parentType: "resource_hub_document", document });
  const comments = useCommentSectionProps({
    form: commentsForm,
    commentParentType: "resource_hub_document",
    canComment: document.permissions.canCommentOnDocument,
  });
  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: document.potentialSubscribers,
    subscriptionList: document.subscriptionList,
    resourceName: "document",
    type: "resource_hub_document",
    onRefresh: refresh,
  });

  const isDraft = document.state === "draft";

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
    refresh();
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
          editPath: paths.resourceHubEditDocumentPath(document.id!),
          onPublish: handlePublish,
          formattedTimePreferences,
        }}
      />
    );
  }

  return <DocumentPage {...shared} hideDraftActions />;
}
