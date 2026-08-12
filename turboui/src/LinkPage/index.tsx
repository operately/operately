import React from "react";

import { BulletDot } from "../BulletDot";
import { PrimaryButton } from "../Button";
import { CommentSection } from "../CommentSection";
import { FormattedTime } from "../FormattedTime";
import * as Forms from "../Forms";
import { Modal } from "../Modal";
import { Page } from "../Page";
import { Reactions } from "../Reactions";
import RichContent, { isContentEmpty } from "../RichContent";
import { LinkIcon } from "../ResourceHub/LinkIcon";
import { Spacer } from "../Spacer";
import { CurrentSubscriptions } from "../Subscriptions";

import type { LinkPage as LinkPageNS } from "./types";

export function LinkPage(props: LinkPageNS.Props) {
  const hasDescription = props.description != null && !isContentEmpty(props.description);

  return (
    <Page
      title={props.pageTitle}
      size="medium"
      navigation={props.navigation}
      options={props.options}
      testId={props.testId ?? "link-page"}
    >
      <div className="px-12 py-10 lg:px-28">
        <div className="flex flex-col items-center">
          <LinkIcon type={props.linkType} size={70} />
          <div className="text-2xl font-extrabold mt-4">{props.title}</div>
          <div className="font-medium inline-flex gap-1">
            {props.author && <span>{props.author.fullName}</span>}
            {props.author && <BulletDot />}
            <span>Posted</span>
            <FormattedTime {...props.formattedTimePreferences} time={props.postedAt} format="relative-time-or-date" />
          </div>
        </div>

        <div className="flex flex-col items-center mt-4">
          <div className="flex flex-col rounded gap-4">
            <div className="flex items-center gap-2">
              <PrimaryButton linkTo={props.url} linkTarget="_blank">
                Open Link
              </PrimaryButton>
            </div>
          </div>
        </div>

        {hasDescription && (
          <>
            <Spacer size={2} />
            <div className="font-bold text-content-accent">Notes:</div>
            <RichContent
              content={props.description}
              mentionedPersonLookup={props.mentionedPersonLookup}
              parseContent
            />
          </>
        )}

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
        <DeleteLinkModal
          isOpen={props.deleteModal.isOpen}
          onClose={props.deleteModal.onClose}
          linkName={props.deleteModal.linkName}
          onConfirm={props.deleteModal.onConfirm}
        />
      )}
    </Page>
  );
}

function DeleteLinkModal({
  isOpen,
  onClose,
  linkName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  linkName: string;
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
          Are you sure you want to delete the link "<b>{linkName}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
