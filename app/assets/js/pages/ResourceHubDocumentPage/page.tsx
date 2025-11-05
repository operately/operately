import React from "react";
import { useNavigate } from "react-router-dom";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Reactions from "@/models/reactions";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

import { usePublishResourceHubDocument, useDeleteResourceHubDocument } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";

import { Spacer } from "@/components/Spacer";
import { CommentSection, useComments } from "@/features/CommentSection";
import { DocumentTitle } from "@/features/documents/DocumentTitle";
import { OngoingDraftActions } from "@/features/drafts";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CopyDocumentModal, ResourcePageNavigation } from "@/features/ResourceHub";
import { useCurrentSubscriptionsAdapter } from "@/features/Subscriptions";
import { useBoolState } from "@/hooks/useBoolState";
import { assertPresent } from "@/utils/assertions";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { RichContent, CurrentSubscriptions } from "turboui";

import { useLoadedData } from "./loader";
import { Options } from "./Options";

export function Page() {
  const { document, folder, resourceHub } = useLoadedData();
  const [isCopyFormOpen, _, openCopyForm, closeCopyForm] = useBoolState(false);
  const [showDeleteConfirmModal, toggleDeleteConfirmModal] = useBoolState(false);

  assertPresent(document.notifications, "notifications must be present in document");
  useClearNotificationsOnLoad(document.notifications);

  React.useEffect(closeCopyForm, [document.id]);

  return (
    <Pages.Page title={document.name!}>
      <Paper.Root size="large">
        <ResourcePageNavigation resource={document} />

        <Paper.Body minHeight="600px" className="lg:px-28">
          <Options showCopyModal={openCopyForm} showDeleteModal={toggleDeleteConfirmModal} />

          <ContinueEditingDraft />

          <Title />
          <Body />
          <DocumentReactions />
          <DocumentComments />
          <DocumentSubscriptions />

          <DeleteDocumentModal isOpen={showDeleteConfirmModal} toggleModal={toggleDeleteConfirmModal} />

          <CopyDocumentModal
            parent={folder ?? resourceHub}
            resource={document}
            isOpen={isCopyFormOpen}
            hideModal={closeCopyForm}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  const { document } = useLoadedData();

  assertPresent(document.author, "author must be present in document");

  return (
    <DocumentTitle
      title={document.name!}
      author={document.author}
      publishedAt={document.insertedAt!}
      state="published"
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
  const { document, folder, resourceHub } = useLoadedData();
  const [remove] = useDeleteResourceHubDocument();
  const paths = usePaths();

  const form = Forms.useForm({
    fields: {},
    cancel: toggleModal,
    submit: async () => {
      await remove({ documentId: document.id });

      if (folder) {
        navigate(paths.resourceHubFolderPath(folder.id!));
      } else {
        navigate(paths.resourceHubPath(resourceHub.id!));
      }
    },
  });

  return (
    <Modal isOpen={isOpen} hideModal={toggleModal}>
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
  const { document } = useLoadedData();
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

      <CurrentSubscriptions {...subscriptionsState} />
    </>
  );
}

function ContinueEditingDraft() {
  const paths = usePaths();
  const { document } = useLoadedData();

  const [publish] = usePublishResourceHubDocument();
  const refresh = Pages.useRefresh();
  const editPath = paths.resourceHubEditDocumentPath(document.id!);

  const publishHandler = async () => {
    await publish({ documentId: document.id });
    refresh();
  };

  return <OngoingDraftActions resource={document} editResourcePath={editPath} publish={publishHandler} />;
}
