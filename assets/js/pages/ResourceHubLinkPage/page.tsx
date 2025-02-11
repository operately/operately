import React from "react";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import RichContent from "@/components/RichContent";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import { CommentSection, useComments } from "@/features/CommentSection";
import { LinkIcon, LinkOptions, ResourcePageNavigation } from "@/features/ResourceHub";
import { useClearNotificationsOnLoad } from "@/features/notifications";

import { Options } from "./Options";
import { useLoadedData } from "./loader";
import { PrimaryButton } from "@/components/Buttons";
import { BulletDot } from "@/components/TextElements";
import FormattedTime from "@/components/FormattedTime";

export function Page() {
  const { link } = useLoadedData();

  assertPresent(link.notifications, "notifications must be present in link");
  useClearNotificationsOnLoad(link.notifications);

  return (
    <Pages.Page title={link.name!}>
      <Paper.Root>
        <ResourcePageNavigation resource={link} />

        <Paper.Body className="lg:px-28">
          <Options />

          <Title />
          <Actions />
          <Description />

          <LinkReactions />
          <LinkComments />
          <LinkSubscriptions />
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

  assertPresent(link.name, "name must be present in link");
  assertPresent(link.url, "url must be present in link");
  assertPresent(link.author, "author must be present in link");
  assertPresent(link.insertedAt, "insertedAt must be present in link");

  return (
    <div className="flex flex-col items-center">
      <LinkIcon type={link.type! as LinkOptions} size={70} />
      <div className="text-2xl font-extrabold mt-4">{link.name}</div>
      <div className="font-medium inline-flex gap-1">
        <span>{link.author.fullName}</span>
        <BulletDot />
        <span>Posted</span>
        <FormattedTime time={link.insertedAt} format="relative-time-or-date" />
      </div>
    </div>
  );
}

function Description() {
  const { link } = useLoadedData();
  assertPresent(link.description, "description must be present in link");

  const hasDescription = !isContentEmpty(link.description);

  if (!hasDescription) return <></>;

  return (
    <>
      <Spacer size={2} />
      <div className="font-bold text-content-accent">Notes:</div>
      <RichContent jsonContent={link.description} />
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

function LinkSubscriptions() {
  const { link } = useLoadedData();
  const refresh = Pages.useRefresh();

  assertPresent(link.subscriptionList, "subscriptionList should be present in link");
  assertPresent(link.potentialSubscribers, "potentialSubscribers should be present in link");

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        potentialSubscribers={link.potentialSubscribers}
        subscriptionList={link.subscriptionList}
        name="link"
        type="resource_hub_link"
        callback={refresh}
      />
    </>
  );
}
