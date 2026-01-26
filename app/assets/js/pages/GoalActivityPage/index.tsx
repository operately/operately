import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Activities from "@/models/activities";
import * as Reactions from "@/models/reactions";

import { usePaths } from "@/routes/paths";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useComments } from "@/features/CommentSection";

import { Avatar, CurrentSubscriptions } from "turboui";
import FormattedTime from "@/components/FormattedTime";
import ActivityHandler from "@/features/activities";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { PageModule } from "@/routes/types";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";

import { loader, useLoaderData } from "./loader";

export default { name: "GoalActivityPage", loader, Page } as PageModule;

function Page() {
  const { activity } = useLoaderData();
  const goal = Activities.getGoal(activity);

  assertPresent(activity.notifications, "Activity notifications must be defined");
  useClearNotificationsOnLoad(activity.notifications);

  return (
    <Pages.Page title={[ActivityHandler.pageHtmlTitle(activity), goal.name!]}>
      <Paper.Root>
        <Nav />

        <Paper.Body>
          <ActivityHandler.PageOptions activity={activity} />
          <Title activity={activity} />
          <div className="my-8">
            <ActivityHandler.PageContent activity={activity} />
          </div>

          <ActivityReactions />
          <Comments goal={goal} />

          <Subscriptions />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Nav() {
  const paths = usePaths();
  const { goal, activity } = useLoaderData();

  const isDiscussion = activity.action === "goal_discussion_creation";
  const items: Array<{ to: string; label: string }> = [];

  if (goal.space) {
    items.push({ to: paths.spacePath(goal.space.id), label: goal.space.name });
    items.push({ to: paths.spaceWorkMapPath(goal.space.id), label: "Work Map" });
  }
  if (isDiscussion) {
    items.push({ to: paths.goalPath(goal.id), label: goal.name });
    items.push({ to: paths.goalPath(goal.id, { tab: "discussions" }), label: "Discussions" });
  } else {
    items.push({ to: paths.goalPath(goal.id), label: goal.name });
  }

  return <Paper.Navigation items={items} />;
}

function Title({ activity }: { activity: Activities.Activity }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar person={activity.author!} size={50} />
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">
          <ActivityHandler.PageTitle activity={activity} />
        </div>
        <div className="inline-flex items-center gap-1">
          <span>{activity.author!.fullName!}</span>
          on <FormattedTime time={activity.insertedAt!} format="long-date" />
        </div>
      </div>
    </div>
  );
}

function ActivityReactions() {
  const { activity } = useLoaderData();

  assertPresent(
    activity.commentThread?.reactions,
    "commentThread and commentThread reactions must be present in activity",
  );
  assertPresent(activity.permissions?.canCommentOnThread, "permissions must be present in activity");

  const reactions = activity.commentThread.reactions.map((r) => r!);
  const entity = Reactions.entity(activity.commentThread.id!, "comment_thread");
  const addReactionForm = useReactionsForm(entity, reactions);

  return <ReactionList size={24} form={addReactionForm} canAddReaction={activity.permissions.canCommentOnThread} />;
}

function Comments({ goal }: { goal: Goals.Goal }) {
  const { activity } = useLoaderData();

  assertPresent(activity.commentThread, "commentThread must be present in activity");
  assertPresent(activity.permissions?.canCommentOnThread, "permissions must be present in activity");

  const commentsForm = useComments({ thread: activity.commentThread, goal: goal, parentType: "comment_thread" });

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        commentParentType="comment_thread"
        canComment={activity.permissions.canCommentOnThread}
      />
    </>
  );
}

function Subscriptions() {
  const refresh = Pages.useRefresh();
  const { activity, goal, isCurrentUserSubscribed } = useLoaderData();

  if (!activity.commentThread?.potentialSubscribers || !activity.commentThread?.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: activity.commentThread.potentialSubscribers,
    subscriptionList: activity.commentThread.subscriptionList,
    resourceName: "discussion",
    type: "comment_thread",
    onRefresh: refresh,
  });

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions
        {...subscriptionsState}
        isCurrentUserSubscribed={isCurrentUserSubscribed}
        canEditSubscribers={goal.permissions?.canEdit || false}
      />
    </div>
  );
}
