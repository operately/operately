import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Actvities from "@/models/activities";
import * as Icons from "@tabler/icons-react";
import * as GoalTimeframeEditing from "@/features/activities/GoalTimeframeEditing";

import { Paths } from "@/routes/paths";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { FilledButton } from "@/components/Button";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import plurarize from "@/utils/plurarize";
import { DivLink } from "@/components/Link";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

interface LoaderResult {
  goal: Goals.Goal;
  activities: Actvities.Activity[];
}

export const loader = async function ({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId, includeParentGoal: true }),
    activities: await Actvities.getActivities({
      scopeType: "goal",
      scopeId: params.goalId,
      actions: ["goal_timeframe_editing"],
    }),
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

          <div className="flex items-center my-6">
            <div className="flex-1 font-bold text-xs uppercase">Discussions</div>
            <FilledButton size="sm" linkTo={Paths.newGoalDiscussionPath(goal.id)}>
              Start a new discussion
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
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Actvities.Activity }) {
  const content = activity.content as Actvities.ActivityContentGoalTimeframeEditing;
  const path = Paths.goalActivityPath(content.goal.id, activity.id);
  const commentThread = activity.commentThread;

  if (!commentThread) return null;
  if (isContentEmpty(commentThread.message)) return null;

  return (
    <div className="flex items-start border-t border-stroke-base py-6">
      <div className="w-32">
        <div className="text-sm font-medium">
          <FormattedTime time={activity.insertedAt} format="long-date" />
        </div>
        <div className="text-xs text-content-dimmed">
          <FormattedTime time={activity.insertedAt} format="relative" />
        </div>
      </div>

      <div className="flex items-start gap-3 ">
        <Avatar person={activity.author} size={40} />

        <div className="flex items-start justify-between gap-4 flex-1">
          <div className="flex flex-col gap-1">
            <div className="text-content-accent font-bold leading-none test-sm">
              <GoalTimeframeEditing.Title activity={activity} />
            </div>

            <div className="mt-2">
              <GoalTimeframeEditing.Content activity={activity} />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <FilledButton size="xxs" linkTo={path} type="secondary">
                Discuss
              </FilledButton>

              {activity.commentThread!.commentsCount > 0 && (
                <div className="flex items-center gap-1 text-sm leading-none text-content-dimmed">
                  <Icons.IconMessage size={14} />{" "}
                  <DivLink to={path} className="hover:underline cursor-pointer">
                    {plurarize(activity.commentThread!.commentsCount, "comment", "comments")}
                  </DivLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
