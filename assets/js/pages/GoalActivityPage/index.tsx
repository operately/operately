import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Activities from "@/models/activities";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { CommentSection, useForCommentThread } from "@/features/CommentSection";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import ActivityHandler from "@/features/activities";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";

interface LoaderResult {
  activity: Activities.Activity;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    activity: await Activities.getActivity({
      id: params.id,
      includeUnreadGoalNotifications: true,
      includePermissions: true,
    }),
  };
}

export function Page() {
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

          <Reactions />
          <Comments goal={goal} />
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

function Reactions() {
  const { activity } = Pages.useLoadedData<LoaderResult>();

  assertPresent(
    activity.commentThread?.reactions,
    "commentThread and commentThread reactions must be present in activity",
  );
  assertPresent(activity.permissions?.canCommentOnThread, "permissions must be present in activity");

  const reactions = activity.commentThread.reactions.map((r) => r!);
  const entity = { id: activity.commentThread.id!, type: "comment_thread" };
  const addReactionForm = useReactionsForm(entity, reactions);

  return <ReactionList size={24} form={addReactionForm} canAddReaction={activity.permissions.canCommentOnThread} />;
}

function Comments({ goal }: { goal: Goals.Goal }) {
  const { activity } = Pages.useLoadedData<LoaderResult>();

  assertPresent(activity.commentThread, "commentThread must be present in activity");
  assertPresent(activity.permissions?.canCommentOnThread, "permissions must be present in activity");

  const commentsForm = useForCommentThread(activity.commentThread, { type: "goal", id: goal.id! });

  return (
    <>
      <div className="border-t border-stroke-base mt-8" />
      <CommentSection
        form={commentsForm}
        refresh={() => {}}
        commentParentType="comment_thread"
        canComment={activity.permissions.canCommentOnThread}
      />
    </>
  );
}
