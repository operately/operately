import React from "react";

import type { AvatarPerson } from "../Avatar";
import { CommentSection, type CommentSectionProps } from "../CommentSection";
import { DocumentTitle } from "../DocumentTitle";
import type { FormattedTimePreferences } from "../FormattedTime";
import { OngoingDraftActions } from "../OngoingDraftActions";
import { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import { Reactions } from "../Reactions";
import RichContent from "../RichContent";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { DeleteResourceConfirmModal } from "../ResourceHub/DeleteResourceConfirmModal";
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
    comments: CommentSectionProps;
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
            <CommentSection {...props.comments} />
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
        <DeleteResourceConfirmModal
          isOpen={props.deleteModal.isOpen}
          onClose={props.deleteModal.onClose}
          resourceType="document"
          resourceName={props.deleteModal.documentName}
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

