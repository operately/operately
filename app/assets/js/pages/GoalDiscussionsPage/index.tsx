import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Activities from "@/models/activities";
import * as Goals from "@/models/goals";
import { PageModule } from "@/routes/types";
import * as React from "react";

import { Header } from "@/features/goals/GoalPageHeader";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { usePaths } from "@/routes/paths";
import { PrimaryButton, SecondaryButton } from "turboui";

import FormattedTime from "@/components/FormattedTime";
import ActivityHandler from "@/features/activities";
import { Avatar, DivLink } from "turboui";

export default { name: "GoalDiscussionsPage", loader, Page } as PageModule;

interface LoaderResult {
  goal: Goals.Goal;
  activities: Activities.Activity[];
}

async function loader({ params }): Promise<LoaderResult> {
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
}

function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();
  const paths = usePaths();

  return (
    <Pages.Page title={[goal.name!]} testId="discussions-page">
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="discussions" />

          <div className="flex items-center my-6">
            <div className="flex-1 font-bold text-xs uppercase">Discussions</div>
            <PrimaryButton size="sm" linkTo={paths.newGoalDiscussionPath(goal.id!)} testId="start-discussion">
              Start a new discussion
            </PrimaryButton>
          </div>

          <ActivityList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

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
  const paths = usePaths();
  const path = ActivityHandler.pagePath(paths, activity);
  const authorProfilePath = paths.profilePath(activity.author!.id!);

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
              <SecondaryButton size="xxs" linkTo={path}>
                Discuss
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
