import React from "react";
import { IconExternalLink } from "@tabler/icons-react";

import * as Reactions from "@/models/reactions";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import { TextSeparator } from "@/components/TextSeparator";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import RichContent, { richContentToString } from "@/components/RichContent";

import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import { CommentSection, useComments } from "@/features/CommentSection";
import { LinkPageNavigation } from "@/features/ResourceHub";

import { Options } from "./Options";
import { useLoadedData } from "./loader";

export function Page() {
  const { link } = useLoadedData();

  return (
    <Pages.Page title={link.name!}>
      <Paper.Root>
        <LinkPageNavigation link={link} />

        <Paper.Body>
          <Title />
          <Options />

          <Url />
          <Description />

          <LinkReactions />
          <LinkComments />
          <LinkSubscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  const { link } = useLoadedData();

  assertPresent(link.author, "author must be present in link");

  return (
    <div className="flex flex-col items-center">
      <Paper.Header title={link.name!} />
      <div className="flex flex-wrap justify-center gap-1 items-center mt-2 text-content-accent font-medium text-sm sm:text-[16px]">
        <div className="flex items-center gap-1">
          <Avatar person={link.author} size="tiny" /> {link.author.fullName}
        </div>

        <TextSeparator />
        <FormattedTime time={link.insertedAt!} format="relative-time-or-date" />
      </div>
    </div>
  );
}

function Url() {
  const { link } = useLoadedData();

  assertPresent(link.url, "url must be present in link");

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="font-bold text-content-accent">Link:</div>
      <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-2 font-medium flex items-center justify-between">
        {link.url}
      </div>
      <div className="flex justify-start items-center gap-2">
        <CopyToClipboard text={link.url} size={25} />
        <OpenLinkIcon url={link.url} size={25} />
      </div>
    </div>
  );
}

function OpenLinkIcon({ url, size }: { url: string; size: number }) {
  const redirect = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return <IconExternalLink size={size} onClick={redirect} className="cursor-pointer" />;
}

function Description() {
  const { link } = useLoadedData();
  assertPresent(link.description, "description must be present in link");

  const hasDescription = Boolean(richContentToString(JSON.parse(link.description)).trim());

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
        refresh={() => {}}
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
