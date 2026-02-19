import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Projects from "@/models/projects";
import * as Reactions from "@/models/reactions";
import * as React from "react";

import { CommentSection, useComments } from "@/features/CommentSection";
import { ReactionList, useReactionsForm } from "@/features/Reactions";

import { useClearNotificationsOnLoad } from "@/features/notifications";
import { PageModule } from "@/routes/types";
import { Avatar, IconEdit, CurrentSubscriptions } from "turboui";

import Api from "@/api";
import FormattedTime from "@/components/FormattedTime";
import { RichContent } from "turboui";
import { useMe, useMentionedPersonLookupFn } from "../../contexts/CurrentCompanyContext";
import { compareIds, usePaths } from "../../routes/paths";
import { useCurrentSubscriptionsAdapter, isSubscribedToResource } from "@/models/subscriptions";

export default { name: "ProjectDiscussionPage", loader, Page } as PageModule;

interface LoaderResult {
  discussion: Projects.Discussion;
  isCurrentUserSubscribed: boolean;
}

async function loader({ params }): Promise<LoaderResult> {
  const [discussion, subscriptionStatus] = await Promise.all([
    Api.project_discussions
      .get({
        id: params.id,
        includeUnreadNotifications: true,
        includePermissions: true,
        includeSubscriptionsList: true,
        includePotentialSubscribers: true,
        includeProject: true,
        includeSpace: true,
      })
      .then((data) => data.discussion),
    isSubscribedToResource({
      resourceId: params.id,
      resourceType: "comment_thread",
    }),
  ]);

  return {
    discussion,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

function Page() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  useClearNotificationsOnLoad(discussion.notifications || []);

  return (
    <Pages.Page title={[discussion.title || "Discussion", discussion.project?.name || ""]}>
      <Paper.Root>
        <Nav />

        <Paper.Body>
          <Options />
          <Title />
          <Content />
          <DiscussionReactions />
          <Comments />
          <Subscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Options() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();
  const paths = usePaths();
  const me = useMe();

  return (
    <PageOptions.Root testId="options">
      {discussion.author && me && compareIds(discussion.author.id, me.id) && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={paths.projectDiscussionEditPath(discussion.id)}
          testId="edit"
          keepOutsideOnBigScreen
        />
      )}
    </PageOptions.Root>
  );
}

function Content() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();
  const peopleLookup = useMentionedPersonLookupFn();

  return (
    <div className="my-8">
      <RichContent content={JSON.parse(discussion.message || "{}")} mentionedPersonLookup={peopleLookup} />
    </div>
  );
}

function Nav() {
  const paths = usePaths();
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  const items: Paper.NavigationItem[] = [];

  if (discussion.space) {
    items.push({ to: paths.spacePath(discussion.space.id), label: discussion.space.name });
    items.push({ to: paths.spaceWorkMapPath(discussion.space.id, "projects"), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Work Map" });
  }

  if (discussion.project) {
    items.push({ to: paths.projectPath(discussion.project.id, { tab: "overview" }), label: discussion.project.name });
    items.push({ to: paths.projectPath(discussion.project.id, { tab: "discussions" }), label: "Discussions" });
  }

  return <Paper.Navigation items={items} />;
}

function Title() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  return (
    <div className="flex items-center gap-3">
      {discussion.author && <Avatar person={discussion.author} size={50} />}
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">{discussion.title}</div>
        <div className="inline-flex items-center gap-1">
          <span>{discussion.author?.fullName}</span>
          on <FormattedTime time={discussion.insertedAt} format="long-date" />
        </div>
      </div>
    </div>
  );
}

function DiscussionReactions() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  const reactions = (discussion.reactions || []).map((r) => r);
  const entity = Reactions.entity(discussion.id, "comment_thread");
  const addReactionForm = useReactionsForm(entity, reactions);

  return (
    <ReactionList
      size={24}
      form={addReactionForm}
      canAddReaction={discussion.projectPermissions?.canComment || false}
    />
  );
}

function Comments() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  const commentsForm = useComments({ thread: discussion, parentType: "comment_thread", project: discussion.project });

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="comment_thread"
        canComment={discussion.projectPermissions?.canComment || false}
      />
    </>
  );
}

function Subscriptions() {
  const refresh = Pages.useRefresh();
  const { discussion, isCurrentUserSubscribed } = Pages.useLoadedData<LoaderResult>();

  if (!discussion.potentialSubscribers || !discussion.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: discussion.potentialSubscribers,
    subscriptionList: discussion.subscriptionList,
    resourceName: "discussion",
    type: "comment_thread",
    onRefresh: refresh,
  });

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={discussion.projectPermissions?.canEdit || false}
      />
    </div>
  );
}
