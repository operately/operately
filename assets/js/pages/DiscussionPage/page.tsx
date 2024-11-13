import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Reactions from "@/models/reactions";
import * as Discussions from "@/models/discussions";

import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useComments } from "@/features/CommentSection";

import { useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { Paths, compareIds } from "@/routes/paths";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { GhostButton, PrimaryButton } from "@/components/Buttons";

export function Page() {
  const { discussion } = useLoadedData();

  assertPresent(discussion.notifications, "Discussion notifications must be defined");
  useClearNotificationsOnLoad(discussion.notifications);

  return (
    <Pages.Page title={discussion.title!} testId="discussion-page">
      <Paper.Root size="large">
        <Navigation space={discussion.space} />

        <Paper.Body minHeight="600px">
          <Options />

          <div className="sm:px-8 lg:px-16">
            <ContinueEditingDraft />
            <DiscussionTitle />
            <DiscussionBody />
            <DiscussionReactions />
            <DicusssionComments />
            <DiscussionSubscriptions />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function DiscussionBody() {
  const { discussion } = useLoadedData();

  return (
    <>
      <Spacer size={4} />
      <RichContent jsonContent={discussion.body!} className="text-md sm:text-lg" />
    </>
  );
}

function DiscussionSubscriptions() {
  const { discussion } = useLoadedData();
  const refresh = Pages.useRefresh();

  if (discussion.state === "draft") return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions
        potentialSubscribers={discussion.potentialSubscribers!}
        subscriptionList={discussion.subscriptionList!}
        name="discussion"
        type="message"
        callback={refresh}
      />
    </>
  );
}

function DiscussionReactions() {
  const { discussion } = useLoadedData();

  if (discussion.state === "draft") return null;

  const reactions = discussion.reactions!.map((r) => r!);
  const entity = Reactions.entity(discussion.id!, "message");
  const addReactionForm = useReactionsForm(entity, reactions);

  assertPresent(discussion.permissions?.canCommentOnDiscussions, "permissions must be present in discussion");

  return (
    <>
      <Spacer size={2} />
      <ReactionList size={24} form={addReactionForm} canAddReaction={discussion.permissions.canCommentOnDiscussions} />
    </>
  );
}

function DiscussionTitle() {
  const { discussion } = useLoadedData();

  return (
    <div className="flex flex-col items-center">
      <div className="text-content-accent text-xl sm:text-2xl md:text-3xl font-extrabold text-center">
        {discussion.title}
      </div>
      <div className="flex flex-wrap justify-center gap-1 items-center mt-2 text-content-accent font-medium text-sm sm:text-[16px]">
        <div className="flex items-center gap-1">
          <Avatar person={discussion.author!} size="tiny" /> {discussion.author!.fullName}
        </div>
        <TextSeparator />
        <FormattedTime time={discussion.insertedAt!} format="relative-time-or-date" />
      </div>
    </div>
  );
}

function Navigation({ space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id)}>{space.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.spaceDiscussionsPath(space.id)}>Discussions</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Options() {
  const me = useMe()!;
  const { discussion } = useLoadedData();

  if (!compareIds(me.id, discussion.author!.id)) return null;

  return (
    <PageOptions.Root position="top-right" testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit Post"
        to={Paths.discussionEditPath(discussion.id!)}
        testId="edit-discussion"
      />
    </PageOptions.Root>
  );
}

function DicusssionComments() {
  const { discussion } = useLoadedData();
  const commentsForm = useComments({ parent: discussion, parentType: "message" });

  if (discussion.state === "draft") return null;

  assertPresent(discussion.permissions?.canCommentOnDiscussions, "permissions must be present in discussion");

  return (
    <>
      <Spacer size={4} />
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        refresh={() => {}}
        commentParentType="message"
        canComment={discussion.permissions.canCommentOnDiscussions}
      />
    </>
  );
}

function ContinueEditingDraft() {
  const { discussion } = useLoadedData();
  if (discussion.state !== "draft") return null;

  return (
    <div className="mb-4 bg-surface-dimmed p-4 rounded-2xl flex flex-col items-center gap-4">
      <div className="font-bold">This is an unpublished draft.</div>

      <div className="flex items-center justify-center gap-2">
        <ContinueEditingButton />
        <PublishNowButton />
      </div>
    </div>
  );
}

function ContinueEditingButton() {
  const { discussion } = useLoadedData();

  return (
    <PrimaryButton linkTo={Paths.discussionEditPath(discussion.id!)} size="sm" testId="continue-editing">
      Continue editing
    </PrimaryButton>
  );
}

function PublishNowButton() {
  const { discussion } = useLoadedData();

  const refresh = Pages.useRefresh();
  const [publish] = Discussions.usePublishDiscussion();

  const onClick = async () => {
    await publish({ id: discussion.id! });
    refresh();
  };

  return (
    <GhostButton onClick={onClick} size="sm" testId="publish-now">
      Publish Now
    </GhostButton>
  );
}
