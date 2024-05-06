import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Activities from "@/models/activities";

import { Paths } from "@/routes/paths";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { FilledButton } from "@/components/Button";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

interface LoaderResult {
  goal: Goals.Goal;
  activities: Activities.Activity[];
}

export const loader = async function ({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId }),
    threads: await CommentThreads.getCommentThreads({}),
  };
};

export const Page = function () {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="discussions" />

          <div className="flex items-start my-4">
            <FilledButton size="xxs" linkTo={Paths.newGoalDiscussionPath(goal.id)}>
              New Discussion
            </FilledButton>
          </div>

          <ActivityList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
};

function ActivityList() {
  const { activities } = Pages.useLoadedData<LoaderResult>();

  return (
    <div>
      {activities.map((activity) => (
        <ActivityItem activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }) {
  return (
    <div className="flex items-start gap-3 border-t border-stroke-base py-4">
      <Avatar person={activity.author} size={32} />

      <div className="flex items-start justify-between gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <div className="text-content-accent font-bold leading-none test-sm">Goal timeframe edited</div>

          {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
            <div className="text-sm">
              <RichContent jsonContent={activity.commentThread.message} />
            </div>
          )}
        </div>

        <div className="inline-flex items-center gap-1 text-xs leading-none text-content-dimmed">
          <FormattedTime time={activity.insertedAt} format="short-date" />
        </div>
      </div>
    </div>
  );
}
