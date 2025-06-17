import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Activities from "@/models/activities";
import * as Reactions from "@/models/reactions";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useComments } from "@/features/CommentSection";

import { Avatar } from "turboui";
import FormattedTime from "@/components/FormattedTime";
import ActivityHandler from "@/features/activities";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { PageModule } from "@/routes/types";
import { CurrentSubscriptions } from "@/features/Subscriptions";

export default { name: "GoalActivityPage", loader, Page } as PageModule;

interface LoaderResult {
  activity: Activities.Activity;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    activity: await Activities.getActivity({
      id: params.id,
      includeUnreadGoalNotifications: true,
      includePermissions: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
    }),
  };
}

function Page() {
  const { activity } = Pages.useLoadedData<LoaderResult>();
  const goal = Activities.getGoal(activity);

  assertPresent(activity.notifications, "Activity notifications must be defined");
  useClearNotificationsOnLoad(activity.notifications);

  return (
    <Pages.Page title={[ActivityHandler.pageHtmlTitle(activity), goal.name!]}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

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
  const { activity } = Pages.useLoadedData<LoaderResult>();

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
  const { activity } = Pages.useLoadedData<LoaderResult>();

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
  const { activity } = Pages.useLoadedData<LoaderResult>();

  assertPresent(activity.commentThread?.subscriptionList, "subscriptionList must be present in commentThread");
  assertPresent(activity.commentThread?.potentialSubscribers, "potentialSubscribers must be present in commentThread");

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions
        subscriptionList={activity.commentThread.subscriptionList}
        potentialSubscribers={activity.commentThread.potentialSubscribers}
        name="discussion"
        type="comment_thread"
        callback={refresh}
      />
    </div>
  );
}
