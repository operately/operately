import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Discussions from "@/models/discussions";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";
import * as React from "react";

import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { type QueryClient } from "@tanstack/react-query";
import {
  invalidateDiscussionQueries,
  invalidateDiscussionInteractionQueries,
} from "@/models/discussions/discussionQueries";

import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";
import { compareIds } from "@/routes/paths";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { useNavigate } from "react-router";
import { useLoadedData, useRefresh } from "./loader";
import {
  CommentSection,
  DiscardDiscussionDraftModal,
  DocumentTitle,
  IconEdit,
  IconTrash,
  OngoingDraftActions,
  Reactions,
  RichContent,
  CurrentSubscriptions,
  Spacer,
  displayDate,
} from "turboui";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";

export function Page() {
  const { discussion } = useLoadedData();

  useReadNotificationsOnLoad(discussion.notifications ?? [], (client) =>
    invalidateDiscussionQueries(client, { spaceId: discussion.space.id, discussionId: discussion.id }, "none"),
  );

  return (
    <Pages.Page title={discussion.title} testId="discussion-page">
      <Paper.Root size="medium">
        <Navigation space={discussion.space} />

        <Paper.Body minHeight="600px" className="lg:px-28">
          <Options />
          <ContinueEditingDraft />
          <DiscussionTitle />
          <DiscussionBody />
          <DiscussionReactions />
          {discussion.state === "published" && <DiscussionComments />}

          {discussion.state === "published" && <DiscussionSubscriptions />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function DiscussionBody() {
  const { discussion } = useLoadedData();
  const { mentionedPersonLookup, resourceLinkTitles } = useRichEditorHandlers({
    resourceLinkContents: discussion.body,
  });

  return (
    <>
      <Spacer size={4} />
      <RichContent
        content={discussion.body}
        className="text-md sm:text-lg"
        mentionedPersonLookup={mentionedPersonLookup}
        resourceLinkTitles={resourceLinkTitles}
        parseContent
      />
    </>
  );
}

function DiscussionSubscriptions() {
  const { discussion, isCurrentUserSubscribed } = useLoadedData();
  const refresh = useRefresh();
  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: discussion.potentialSubscribers ?? [],
    subscriptionList: discussion.subscriptionList,
    resourceName: "discussion",
    type: "message",
    onRefresh: refresh,
  });

  if (!discussion.potentialSubscribers || !discussion.subscriptionList) return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-16 mb-8" />
      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={discussion.permissions.canEdit}
      />
    </>
  );
}

function DiscussionReactions() {
  const { discussion } = useLoadedData();
  const refresh = useRefresh();
  const form = useOptimisticReactions({
    entity: { id: discussion.id, type: "message" },
    initialReactions: discussion.reactions ?? undefined,
    onRefresh: refresh,
  });

  if (discussion.state !== "published") return null;

  return (
    <>
      <Spacer size={2} />
      <div data-test-id="discussion-reactions">
        <Reactions {...form} size={24} canAddReaction={discussion.permissions.canComment} />
      </div>
    </>
  );
}

function DiscussionTitle() {
  const { discussion } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <DocumentTitle
      title={discussion.title}
      author={discussion.author || null}
      state={discussion.state}
      publishedAt={displayDate(discussion)}
      scheduledAt={discussion.scheduledAt}
      formattedTimePreferences={formattedTimePreferences}
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
  const me = useMe();
  const navigate = useNavigate();
  const { discussion } = useLoadedData();
  const { mutateAsync: archive } = Discussions.useArchiveMessage(discussion.space.id);
  const [showDiscardModal, toggleDiscardModal] = useBoolState(false);

  const isUnpublished = discussion.state === "draft" || discussion.state === "scheduled";

  const handleArchive = async () => {
    await archive({ id: discussion.id });

    handleRedirect();
  };

  const handleRedirect = () => {
    if (discussion.space) {
      navigate(paths.spaceDiscussionsPath(discussion.space.id));
    } else {
      navigate(paths.homePath());
    }
  };

  if (!discussion.author || !me || !compareIds(me.id, discussion.author.id)) return null;

  return (
    <>
      <PageOptions.Root testId="options-button">
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={paths.discussionEditPath(discussion.id)}
          testId="edit-discussion"
          keepOutsideOnBigScreen
        />

        {isUnpublished ? (
          <PageOptions.Action
            icon={IconTrash}
            title="Discard draft"
            onClick={toggleDiscardModal}
            testId="discard-draft"
          />
        ) : (
          <PageOptions.Action icon={IconTrash} title="Delete" onClick={handleArchive} testId="archive-discussion" />
        )}
      </PageOptions.Root>

      {isUnpublished && (
        <DiscardDiscussionDraftModal
          isOpen={showDiscardModal}
          onClose={toggleDiscardModal}
          onDiscard={async () => {
            await archive({ id: discussion.id });
          }}
          onSuccess={handleRedirect}
        />
      )}
    </>
  );
}

function DiscussionComments() {
  const { discussion } = useLoadedData();
  const context = { spaceId: discussion.space.id, discussionId: discussion.id };
  const invalidateQueries = (client: QueryClient, refetchType: "active" | "none") =>
    invalidateDiscussionInteractionQueries(client, context, refetchType);

  const props = useCommentSection({
    entity: { id: discussion.id, type: "message" },
    mentionSearchScope: { type: "space", id: discussion.space.id },
    invalidateQueries,
    canComment: discussion.permissions.canComment,
  });

  if (!props) return null;

  return (
    <>
      <Spacer size={4} />
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection {...props} />
    </>
  );
}

function ContinueEditingDraft() {
  const paths = usePaths();
  const me = useMe();
  const { discussion } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();

  const { mutateAsync: publish } = Discussions.usePublishDiscussion(discussion.space.id);
  const editPath = paths.discussionEditPath(discussion.id);
  const isAuthor = Boolean(discussion.author && me && compareIds(me.id, discussion.author.id));

  if (discussion.state !== "draft" && discussion.state !== "scheduled") {
    return null;
  }

  const publishHandler = async () => {
    await publish({ id: discussion.id });
  };

  return (
    <OngoingDraftActions
      state={discussion.state}
      updatedAt={discussion.updatedAt}
      scheduledAt={discussion.scheduledAt}
      editPath={editPath}
      onPublish={isAuthor ? publishHandler : undefined}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
