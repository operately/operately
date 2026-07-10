import React from "react";

import { resourceHubLandingPath, resourceHubNavigationPaths } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { useBoolState } from "@/hooks/useBoolState";
import { useNavigate } from "react-router-dom";
import { links } from "@/models/resourceHubs";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import Modal from "@/components/Modal";

import { assertPresent } from "@/utils/assertions";

import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { CommentSection, useComments } from "@/features/CommentSection";
import { FormattedTime, Forms, LinkIcon, ResourcePageNavigation, Spacer, type ResourceHubLinkType } from "turboui";
import { useClearNotificationsOnLoad } from "@/features/notifications";

import { Options } from "./Options";
import { useLoadedData } from "./loader";
import { buildNavigationLink } from "./navigation";
import { isContentEmpty, PrimaryButton, RichContent, CurrentSubscriptions, BulletDot } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

export function Page() {
  const { link } = useLoadedData();
  const paths = usePaths();
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);
  const navigationLink = buildNavigationLink(link);

  assertPresent(link.notifications, "notifications must be present in link");
  useClearNotificationsOnLoad(link.notifications);

  return (
    <Pages.Page title={link.name!}>
      <Paper.Root>
        <ResourcePageNavigation resource={navigationLink} paths={resourceHubNavigationPaths(paths)} />

        <Paper.Body className="lg:px-28">
          <Options showDeleteModal={toggleDeleteModal} />

          <Title />
          <Actions />
          <Description />

          <LinkReactions />
          <LinkComments />
          <LinkSubscriptions />

          <DeleteLinkModal isOpen={showDeleteModal} hideModal={toggleDeleteModal} linkName={link.name || ""} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Actions() {
  const { link } = useLoadedData();

  assertPresent(link.url, "url must be present in link");

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="flex flex-col rounded gap-4">
        <div className="flex items-center gap-2">
          <PrimaryButton linkTo={link.url} linkTarget="_blank">
            Open Link
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function Title() {
  const { link } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();

  assertPresent(link.name, "name must be present in link");
  assertPresent(link.url, "url must be present in link");
  assertPresent(link.author, "author must be present in link");
  assertPresent(link.insertedAt, "insertedAt must be present in link");

  return (
    <div className="flex flex-col items-center">
      <LinkIcon type={link.type! as ResourceHubLinkType} size={70} />
      <div className="text-2xl font-extrabold mt-4">{link.name}</div>
      <div className="font-medium inline-flex gap-1">
        <span>{link.author.fullName}</span>
        <BulletDot />
        <span>Posted</span>
        <FormattedTime {...formattedTimePreferences} time={link.insertedAt} format="relative-time-or-date" />
      </div>
    </div>
  );
}

function Description() {
  const { link } = useLoadedData();
  assertPresent(link.description, "description must be present in link");

  const hasDescription = link.description != null && !isContentEmpty(link.description);
  const { mentionedPersonLookup } = useRichEditorHandlers();

  if (!hasDescription) return <></>;

  return (
    <>
      <Spacer size={2} />
      <div className="font-bold text-content-accent">Notes:</div>
      <RichContent content={link.description} mentionedPersonLookup={mentionedPersonLookup} parseContent />
    </>
  );
}

function LinkReactions() {
  const { link } = useLoadedData();

  assertPresent(link.permissions?.canCommentOnLink, "permissions must be present in link");
  assertPresent(link.reactions, "reactions must be present in link");

  const reactions = link.reactions.map((r) => r!);
  const entity = Reactions.entity(link.id!, "resource_hub_link");
  const addReactionForm = useReactionsForm(entity, reactions);

  return (
    <>
      <Spacer size={2} />
      <ReactionList size={24} form={addReactionForm} canAddReaction={link.permissions.canCommentOnLink} />
    </>
  );
}

function LinkComments() {
  const { link } = useLoadedData();
  const commentsForm = useComments({ parentType: "resource_hub_link", link: link });

  assertPresent(link.permissions?.canCommentOnLink, "permissions must be present in link");

  return (
    <>
      <Spacer size={4} />
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="resource_hub_link"
        canComment={link.permissions.canCommentOnLink}
      />
    </>
  );
}

interface DeleteLinkModalProps {
  isOpen: boolean;
  hideModal: () => void;
  linkName: string;
}

function DeleteLinkModal({ isOpen, hideModal, linkName }: DeleteLinkModalProps) {
  const { link } = useLoadedData();
  const navigate = useNavigate();
  const [remove] = links.useDelete();
  const paths = usePaths();

  const handleDeleteLink = async () => {
    await remove({ linkId: link.id });

    if (link.parentFolder) {
      navigate(paths.resourceHubFolderPath(link.parentFolder.id!));
    } else {
      navigate(resourceHubLandingPath(paths, link));
    }
  };

  const form = Forms.useForm({
    fields: {},
    cancel: hideModal,
    submit: handleDeleteLink,
  });

  return (
    <Modal isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <p>
          Are you sure you want to delete the link "<b>{linkName}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}

function LinkSubscriptions() {
  const { link, isCurrentUserSubscribed } = useLoadedData();
  const refresh = Pages.useRefresh();

  if (!link.potentialSubscribers || !link.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: link.potentialSubscribers,
    subscriptionList: link.subscriptionList,
    resourceName: "link",
    type: "resource_hub_link",
    onRefresh: refresh,
  });

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={link.permissions?.canEditLink || false}
      />
    </>
  );
}
