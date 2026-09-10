import * as React from "react";
import { type QueryClient } from "@tanstack/react-query";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Activities from "@/models/activities";
import { useOptimisticReactions } from "@/models/reactions/useOptimisticReactions";

import { usePaths } from "@/routes/paths";
import { useCommentSection } from "@/features/CommentSection/useCommentSection";
import { invalidateGoalInteractionQueries } from "@/models/goals/goalLifecycle";

import { CommentSection, Avatar, CurrentSubscriptions, FormattedTime, Reactions } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import ActivityHandler from "@/features/activities";
import { useReadNotificationsOnLoad } from "@/models/notifications/notificationLifecycle";
import { assertPresent } from "@/utils/assertions";
import { PageModule } from "@/routes/types";
import { useCurrentSubscriptionsQueryAdapter } from "@/models/subscriptions/useCurrentSubscriptionsQueryAdapter";

import { loader, useLoadedData, useRefresh } from "./loader";
import { AckCTA, AcknowledgementStatus } from "./AckCTA";

export default { name: "GoalActivityPage", loader, Page } as PageModule;

function Page() {
  const { activity, goal } = useLoadedData();

  assertPresent(activity.notifications, "Activity notifications must be defined");
  const notificationContext = activity.commentThread
    ? {
        goalId: goal.id,
        resourceId: activity.commentThread.id,
        resourceType: "goal_discussion" as const,
        activityId: activity.id,
      }
    : undefined;
  useReadNotificationsOnLoad(
    activity.notifications,
    notificationContext ? (client) => invalidateGoalInteractionQueries(client, notificationContext, "none") : undefined,
  );

  return (
    <Pages.Page title={[ActivityHandler.pageHtmlTitle(activity), goal.name]}>
      <Paper.Root>
        <Nav />

        <Paper.Body>
          <ActivityHandler.PageOptions activity={activity} />
          <Title activity={activity} />
          <div className="my-8">
            <ActivityHandler.PageContent activity={activity} />
          </div>

          <AckCTA />
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
  const { goal, activity } = useLoadedData();

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
  const formattedTimePreferences = useFormattedTimePreferences();

  if (!activity.author) throw new Error("Activity author is unavailable");

  return (
    <div className="flex items-center gap-3">
      <Avatar person={activity.author} size={50} />
      <div>
        <div className="text-content-accent text-2xl font-bold leading-tight">
          <ActivityHandler.PageTitle activity={activity} />
        </div>
        <div className="inline-flex items-center gap-1">
          <span>{activity.author.fullName}</span>
          on <FormattedTime {...formattedTimePreferences} time={activity.insertedAt} format="long-date" />
          {activity.action === "goal_closing" && (
            <>
              <span>&middot;</span>
              <AcknowledgementStatus />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityReactions() {
  const { activity } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(
    activity.commentThread?.reactions,
    "commentThread and commentThread reactions must be present in activity",
  );
  assertPresent(activity.permissions?.canCommentOnThread, "permissions must be present in activity");

  const thread = activity.commentThread;
  const form = useOptimisticReactions({
    entity: { id: thread.id, type: "goal_discussion" },
    initialReactions: activity.commentThread.reactions,
    onRefresh: refresh,
  });

  return <Reactions {...form} size={24} canAddReaction={activity.permissions.canCommentOnThread} />;
}

function Comments({ goal }: { goal: Goals.Goal }) {
  const { activity } = useLoadedData();
  assertPresent(activity.commentThread, "commentThread must be present in activity");
  assertPresent(activity.permissions?.canCommentOnThread, "permissions must be present in activity");

  const thread = activity.commentThread;
  const context = {
    goalId: goal.id,
    resourceId: thread.id,
    resourceType: "goal_discussion" as const,
    activityId: activity.id,
  };

  function invalidateQueries(client: QueryClient, refetchType: "active" | "none") {
    return invalidateGoalInteractionQueries(client, context, refetchType);
  }

  const props = useCommentSection({
    entity: { id: thread.id, type: "goal_discussion" },
    mentionSearchScope: { type: "goal", id: goal.id },
    invalidateQueries,
    canComment: activity.permissions.canCommentOnThread,
    acknowledgedAt: thread.acknowledgedAt,
    acknowledgedBy: thread.acknowledgedBy,
    ackLabel: activity.action === "goal_closing" ? "Retrospective" : undefined,
  });

  if (!props) return null;

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection {...props} />
    </>
  );
}

function Subscriptions() {
  const refresh = useRefresh();
  const { activity, goal, isCurrentUserSubscribed } = useLoadedData();

  const subscriptionsState = useCurrentSubscriptionsQueryAdapter({
    potentialSubscribers: activity.commentThread?.potentialSubscribers ?? [],
    subscriptionList: activity.commentThread?.subscriptionList,
    resourceName: "discussion",
    type: "comment_thread",
    onRefresh: refresh,
  });

  if (!activity.commentThread?.potentialSubscribers || !activity.commentThread?.subscriptionList) return null;

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
