import React from "react";
import { useNavigate } from "react-router";

import * as Pages from "@/components/Pages";
import * as Reactions from "@/models/reactions";
import { documents } from "@/models/resourceHubs";
import { resourceHubLandingPath } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";

import { CommentSection, useComments } from "@/features/CommentSection";
import { DocumentTitle } from "@/features/documents/DocumentTitle";
import { OngoingDraftActions } from "@/features/drafts";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import {
  CopyDocumentModalWrapper,
  Forms,
  Modal,
  Page as TurboUIPage,
  RichContent,
  CurrentSubscriptions,
  Spacer,
  displayDate,
} from "turboui";
import { useCopyDocumentListContext } from "@/models/resourceHubs";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { useBoolState } from "@/hooks/useBoolState";
import { assertPresent } from "@/utils/assertions";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

import { useLoadedData } from "./loader";
import { buildDocumentPageNavigation, buildNavigationDocument } from "./navigation";
import { useDocumentPageOptions } from "./Options";

export function Page() {
  const { document, folder, resourceHub } = useLoadedData();
  const paths = usePaths();
  const [isCopyFormOpen, _, openCopyForm, closeCopyForm] = useBoolState(false);
  const [showDeleteConfirmModal, toggleDeleteConfirmModal] = useBoolState(false);
  const navigationDocument = buildNavigationDocument(document, resourceHub);
  const pageResourceHub = navigationDocument.resourceHub;
  const copyListContext = useCopyDocumentListContext(folder ?? pageResourceHub, document);
  const options = useDocumentPageOptions({ showCopyModal: openCopyForm, showDeleteModal: toggleDeleteConfirmModal });

  assertPresent(document.notifications, "notifications must be present in document");
  useClearNotificationsOnLoad(document.notifications);

  React.useEffect(closeCopyForm, [document.id]);

  return (
    <TurboUIPage
      title={document.name!}
      size="large"
      navigation={buildDocumentPageNavigation(document, resourceHub, paths)}
      options={options}
      testId="resource-hub-document-page"
    >
      <div className="min-h-[600px] px-4 py-10 sm:px-12 lg:px-28">
        <ContinueEditingDraft />

        <Title />
        <Body />
        <DocumentReactions />
        <DocumentComments />
        <DocumentSubscriptions />
      </div>

      <DeleteDocumentModal isOpen={showDeleteConfirmModal} toggleModal={toggleDeleteConfirmModal} />

      <CopyDocumentModalWrapper
        listContext={copyListContext}
        document={document}
        isOpen={isCopyFormOpen}
        hideModal={closeCopyForm}
      />
    </TurboUIPage>
  );
}

function Title() {
  const { document } = useLoadedData();

  assertPresent(document.author, "author must be present in document");

  return (
    <DocumentTitle
      title={document.name}
      author={document.author}
      publishedAt={displayDate(document)}
      modifiedAt={document.updatedAt}
      state={document.state}
    />
  );
}

function Body() {
  const { document } = useLoadedData();
  const { mentionedPersonLookup } = useRichEditorHandlers();

  return (
    <>
      <Spacer size={4} />
      <RichContent
        content={document.content!}
        className="text-md sm:text-lg"
        mentionedPersonLookup={mentionedPersonLookup}
        parseContent
      />
    </>
  );
}

function DocumentReactions() {
  const { document } = useLoadedData();

  assertPresent(document.permissions?.canCommentOnDocument, "permissions must be present in document");

  const reactions = document.reactions!.map((r) => r!);
  const entity = Reactions.entity(document.id!, "resource_hub_document");
  const addReactionForm = useReactionsForm(entity, reactions);

  return (
    <>
      <Spacer size={2} />
      <ReactionList size={24} form={addReactionForm} canAddReaction={document.permissions.canCommentOnDocument} />
    </>
  );
}

function DocumentComments() {
  const { document } = useLoadedData();
  const commentsForm = useComments({ parentType: "resource_hub_document", document: document });

  assertPresent(document.permissions?.canCommentOnDocument, "permissions must be present in document");

  return (
    <>
      <Spacer size={4} />
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="resource_hub_document"
        canComment={document.permissions.canCommentOnDocument}
      />
    </>
  );
}

interface DeleteDocumentModalProps {
  isOpen: boolean;
  toggleModal: () => void;
}

function DeleteDocumentModal({ isOpen, toggleModal }: DeleteDocumentModalProps) {
  const navigate = useNavigate();
  const { document, folder } = useLoadedData();
  const [remove] = documents.useDelete();
  const paths = usePaths();

  const form = Forms.useForm({
    fields: {},
    cancel: toggleModal,
    submit: async () => {
      await remove({ documentId: document.id });

      if (folder) {
        navigate(paths.resourceHubFolderPath(folder.id!));
      } else {
        navigate(resourceHubLandingPath(paths, document));
      }
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={toggleModal}>
      <Forms.Form form={form}>
        <p>
          Are you sure you want to delete the document "<b>{document.name}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}

function DocumentSubscriptions() {
  const { document, isCurrentUserSubscribed } = useLoadedData();
  const refresh = Pages.useRefresh();

  if (!document.potentialSubscribers || !document.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: document.potentialSubscribers,
    subscriptionList: document.subscriptionList,
    resourceName: "document",
    type: "resource_hub_document",
    onRefresh: refresh,
  });

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={document.permissions?.canEditDocument || false}
      />
    </>
  );
}

function ContinueEditingDraft() {
  const paths = usePaths();
  const { document } = useLoadedData();

  const [publish] = documents.usePublish();
  const refresh = Pages.useRefresh();
  const editPath = paths.resourceHubEditDocumentPath(document.id!);

  const publishHandler = async () => {
    await publish({ documentId: document.id });
    refresh();
  };

  return <OngoingDraftActions resource={document} editResourcePath={editPath} publish={publishHandler} />;
}
