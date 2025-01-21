import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Reactions from "@/models/reactions";
import * as Discussions from "@/models/discussions";

import RichContent from "@/components/RichContent";

import { Spacer } from "@/components/Spacer";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useComments } from "@/features/CommentSection";

import { Paths, compareIds } from "@/routes/paths";
import { CurrentSubscriptions } from "@/features/Subscriptions";
import { DocumentTitle } from "@/features/documents/DocumentTitle";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useNavigate } from "react-router-dom";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { OngoingDraftActions } from "@/features/drafts";

export function Page() {
  const { discussion } = useLoadedData();

  assertPresent(discussion.notifications, "Discussion notifications must be defined");
  useClearNotificationsOnLoad(discussion.notifications);

  return (
    <Pages.Page title={discussion.title!} testId="discussion-page">
      <Paper.Root size="large">
        <Navigation space={discussion.space} />

        <Paper.Body minHeight="600px" className="lg:px-28">
          <Options />
          <ContinueEditingDraft />
          <DiscussionTitle />
          <DiscussionBody />
          <DiscussionReactions />
          <DicusssionComments />
          <DiscussionSubscriptions />
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
    <DocumentTitle
      title={discussion.title!}
      author={discussion.author!}
      state={discussion.state!}
      publishedAt={discussion.publishedAt!}
    />
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
  const navigate = useNavigate();
  const { discussion } = useLoadedData();
  const [archive] = Discussions.useArchiveMessage();

  const handleArchive = async () => {
    await archive({ messageId: discussion.id! });
    navigate(Paths.spaceDiscussionsPath(discussion.space!.id!));
  };

  if (!compareIds(me.id, discussion.author!.id)) return null;

  return (
    <PageOptions.Root testId="options-button">
      <PageOptions.Link
        icon={Icons.IconEdit}
        title="Edit Post"
        to={Paths.discussionEditPath(discussion.id!)}
        testId="edit-discussion"
      />

      <PageOptions.Action
        icon={Icons.IconEdit}
        title="Delete Post"
        onClick={handleArchive}
        testId="archive-discussion"
      />
    </PageOptions.Root>
  );
}

function DicusssionComments() {
  const { discussion } = useLoadedData();
  const commentsForm = useComments({ discussion: discussion, parentType: "message" });

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

  const [publish] = Discussions.usePublishDiscussion();
  const refresh = Pages.useRefresh();
  const editPath = Paths.discussionEditPath(discussion.id!);

  const publishHandler = async () => {
    await publish({ id: discussion.id! });
    refresh();
  };

  return <OngoingDraftActions resource={discussion} editResourcePath={editPath} publish={publishHandler} />;
}
