import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Activities from "@/models/activities";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { FilledButton } from "@/components/Buttons";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import plurarize from "@/utils/plurarize";
import { DivLink } from "@/components/Link";

import ActivityHandler from "@/features/activities";

interface LoaderResult {
  goal: Goals.Goal;
  activities: Activities.Activity[];
}

export const loader = async function ({ params }): Promise<LoaderResult> {
  const goalPromise = Goals.getGoal({
    id: params.goalId,
    includeSpace: true,
    includePermissions: true,
  }).then((data) => data.goal!);

  const activitiesPromise = Activities.getActivities({
    scopeType: "goal",
    scopeId: params.goalId,
    actions: ["goal_timeframe_editing", "goal_closing", "goal_check_in", "goal_reopening", "goal_discussion_creation"],
  });

  return {
    goal: await goalPromise,
    activities: await activitiesPromise,
  };
};

export const Page = function () {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={[goal.name!]}>
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="discussions" />

          <div className="flex items-center my-6">
            <div className="flex-1 font-bold text-xs uppercase">Discussions</div>
            <FilledButton size="sm" linkTo={Paths.newGoalDiscussionPath(goal.id!)} testId="start-discussion">
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

function ActivityItem({ activity }: { activity: Activities.Activity }) {
  const path = ActivityHandler.pagePath(activity);
  const authorProfilePath = Paths.profilePath(activity.author!.id!);

  return (
    <div className="flex items-start border-t border-stroke-base py-6">
      <div className="w-32">
        <div className="text-sm font-medium">
          <FormattedTime time={activity.insertedAt!} format="long-date" />
        </div>
        <div className="text-xs text-content-dimmed">
          <FormattedTime time={activity.insertedAt!} format="relative" />
        </div>
      </div>

      <div className="flex items-start gap-3 flex-1">
        <DivLink to={authorProfilePath}>
          <Avatar person={activity.author!} size={40} />
        </DivLink>

        <div className="flex items-start justify-between gap-4 flex-1">
          <div className="flex flex-col gap-1 w-full">
            <DivLink
              to={path}
              className="text-content-accent font-bold leading-none test-sm hover:underline cursor-pointer"
            >
              <ActivityHandler.PageTitle activity={activity} />
            </DivLink>

            <div className="w-full">
              <ActivityHandler.PageContent activity={activity} />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <FilledButton size="xxs" linkTo={path} type="secondary">
                Discuss
              </FilledButton>

              {ActivityHandler.hasComments(activity) && (
                <div className="flex items-center gap-1 text-sm leading-none text-content-dimmed">
                  <Icons.IconMessage size={14} />{" "}
                  <DivLink to={path} className="hover:underline cursor-pointer">
                    {plurarize(ActivityHandler.commentCount(activity), "comment", "comments")}
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
