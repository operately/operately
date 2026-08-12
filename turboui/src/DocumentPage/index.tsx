import React from "react";

import type { AvatarPerson } from "../Avatar";
import { DocumentTitle } from "../DocumentTitle";
import * as Forms from "../Forms";
import type { FormattedTimePreferences } from "../FormattedTime";
import { Modal } from "../Modal";
import { OngoingDraftActions } from "../OngoingDraftActions";
import { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import { Reactions } from "../Reactions";
import RichContent from "../RichContent";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { CopyDocumentModalWrapper } from "../ResourceHub/nodeMenus/CopyDocumentModal";
import type { ResourceHubNodesListContextValue } from "../ResourceHub/contexts/NodesListContext";
import type { ResourceHubDocument } from "../ResourceHub/types";
import { Spacer } from "../Spacer";
import { CurrentSubscriptions } from "../Subscriptions";

export namespace DocumentPage {
  export interface BaseProps {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    options?: Page.Option[];
    testId?: string;

    title: string;
    author: AvatarPerson | null;
    state: string;
    publishedAt?: string;
    scheduledAt?: string | null;
    modifiedAt?: string | null;
    formattedTimePreferences: FormattedTimePreferences;

    content: unknown;
    mentionedPersonLookup: MentionedPersonLookupFn;
  }

  type WithDraftActions = {
    draftActions: OngoingDraftActions.Props;
    hideDraftActions?: never;
  };

  type WithoutDraftActions = {
    hideDraftActions: true;
    draftActions?: never;
  };

  type WithReactions = {
    reactions: Reactions.Props;
    hideReactions?: never;
  };

  type WithoutReactions = {
    hideReactions: true;
    reactions?: never;
  };

  type WithComments = {
    comments: React.ReactNode;
    hideComments?: never;
  };

  type WithoutComments = {
    hideComments: true;
    comments?: never;
  };

  type WithSubscriptions = {
    subscriptions: CurrentSubscriptions.Props;
    hideSubscriptions?: never;
  };

  type WithoutSubscriptions = {
    hideSubscriptions: true;
    subscriptions?: never;
  };

  type WithCopyModal = {
    copyModal: {
      isOpen: boolean;
      onClose: () => void;
      listContext: ResourceHubNodesListContextValue;
      document: ResourceHubDocument;
    };
    hideCopyModal?: never;
  };

  type WithoutCopyModal = {
    hideCopyModal: true;
    copyModal?: never;
  };

  type WithDeleteModal = {
    deleteModal: {
      isOpen: boolean;
      onClose: () => void;
      documentName: string;
      onConfirm: () => void | Promise<void>;
    };
    hideDeleteModal?: never;
  };

  type WithoutDeleteModal = {
    hideDeleteModal: true;
    deleteModal?: never;
  };

  export type Props = BaseProps &
    (WithDraftActions | WithoutDraftActions) &
    (WithReactions | WithoutReactions) &
    (WithComments | WithoutComments) &
    (WithSubscriptions | WithoutSubscriptions) &
    (WithCopyModal | WithoutCopyModal) &
    (WithDeleteModal | WithoutDeleteModal);
}

export function DocumentPage(props: DocumentPage.Props) {
  return (
    <Page
      title={props.pageTitle}
      size="large"
      navigation={props.navigation}
      options={props.options}
      testId={props.testId ?? "document-page"}
    >
      <div className="min-h-[600px] px-4 py-10 sm:px-12 lg:px-28">
        {!props.hideDraftActions && <OngoingDraftActions {...props.draftActions} />}

        <DocumentTitle
          title={props.title}
          author={props.author}
          state={props.state}
          publishedAt={props.publishedAt}
          scheduledAt={props.scheduledAt}
          modifiedAt={props.modifiedAt}
          formattedTimePreferences={props.formattedTimePreferences}
        />

        <Spacer size={4} />
        <RichContent
          content={props.content}
          className="text-md sm:text-lg"
          mentionedPersonLookup={props.mentionedPersonLookup}
          parseContent
        />

        {!props.hideReactions && (
          <>
            <Spacer size={2} />
            <Reactions {...props.reactions} />
          </>
        )}

        {!props.hideComments && (
          <>
            <Spacer size={4} />
            <div className="border-t border-stroke-base mt-8" />
            {props.comments}
          </>
        )}

        {!props.hideSubscriptions && (
          <>
            <div className="border-t border-stroke-base mt-16 mb-8" />
            <CurrentSubscriptions {...props.subscriptions} />
          </>
        )}
      </div>

      {!props.hideDeleteModal && (
        <DeleteDocumentModal
          isOpen={props.deleteModal.isOpen}
          onClose={props.deleteModal.onClose}
          documentName={props.deleteModal.documentName}
          onConfirm={props.deleteModal.onConfirm}
        />
      )}

      {!props.hideCopyModal && (
        <CopyDocumentModalWrapper
          listContext={props.copyModal.listContext}
          document={props.copyModal.document}
          isOpen={props.copyModal.isOpen}
          hideModal={props.copyModal.onClose}
        />
      )}
    </Page>
  );
}

function DeleteDocumentModal({
  isOpen,
  onClose,
  documentName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  onConfirm: () => void | Promise<void>;
}) {
  const form = Forms.useForm({
    fields: {},
    cancel: onClose,
    submit: async () => {
      await onConfirm();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Forms.Form form={form}>
        <p>
          Are you sure you want to delete the document "<b>{documentName}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
