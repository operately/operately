import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Discussions from "@/models/discussions";
import * as Reactions from "@/models/reactions";
import * as React from "react";

import { Spacer } from "@/components/Spacer";
import { CommentSection, useComments } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";
import { DocumentTitle } from "@/features/documents/DocumentTitle";
import { compareIds } from "@/routes/paths";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { OngoingDraftActions } from "@/features/drafts";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { useNavigate } from "react-router-dom";
import { useLoadedData } from "./loader";
import { IconEdit, IconTrash, RichContent, CurrentSubscriptions } from "turboui";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";

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
  const { mentionedPersonLookup } = useRichEditorHandlers();

  return (
    <>
      <Spacer size={4} />
      <RichContent
        content={discussion.body}
        className="text-md sm:text-lg"
        mentionedPersonLookup={mentionedPersonLookup}
        parseContent
      />
    </>
  );
}

function DiscussionSubscriptions() {
  const { discussion } = useLoadedData();
  const refresh = Pages.useRefresh();

  if (discussion.state === "draft") return null;

  if (!discussion.potentialSubscribers || !discussion.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: discussion.potentialSubscribers,
    subscriptionList: discussion.subscriptionList,
    resourceName: "discussion",
    type: "message",
    onRefresh: refresh,
  });

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />

      <CurrentSubscriptions {...subscriptionsState} />
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
  const paths = usePaths();
  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(space.id), label: space.name },
        { to: paths.spaceDiscussionsPath(space.id), label: "Discussions" },
      ]}
    />
  );
}

function Options() {
  const paths = usePaths();
  const me = useMe()!;
  const navigate = useNavigate();
  const { discussion } = useLoadedData();
  const [archive] = Discussions.useArchiveMessage();

  const handleArchive = async () => {
    await archive({ messageId: discussion.id! });
    navigate(paths.spaceDiscussionsPath(discussion.space!.id!));
  };

  if (!compareIds(me.id, discussion.author!.id)) return null;

  return (
    <PageOptions.Root testId="options-button">
      <PageOptions.Link
        icon={IconEdit}
        title="Edit"
        to={paths.discussionEditPath(discussion.id!)}
        testId="edit-discussion"
        keepOutsideOnBigScreen
      />

      <PageOptions.Action icon={IconTrash} title="Delete" onClick={handleArchive} testId="archive-discussion" />
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
        commentParentType="message"
        canComment={discussion.permissions.canCommentOnDiscussions}
      />
    </>
  );
}

function ContinueEditingDraft() {
  const paths = usePaths();
  const { discussion } = useLoadedData();

  const [publish] = Discussions.usePublishDiscussion();
  const refresh = Pages.useRefresh();
  const editPath = paths.discussionEditPath(discussion.id!);

  const publishHandler = async () => {
    await publish({ id: discussion.id! });
    refresh();
  };

  return <OngoingDraftActions resource={discussion} editResourcePath={editPath} publish={publishHandler} />;
}
