import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { Feed, useItemsQuery } from "@/features/Feed";
import { LastCheckInMessage } from "@/features/goals/GoalCheckIn";
import { Header } from "@/features/goals/GoalPageHeader";
import { banner } from "@/features/goals/GoalPageHeader/Banner";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { GoalTargets } from "@/features/goals/GoalTargets";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";
import { assertPresent } from "@/utils/assertions";
import { PageModule } from "@/routes/types";

export default { name: "GoalPage", loader, Page } as PageModule;

interface LoaderResult {
  goal: Goals.Goal;
}

async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureEnabled(params, {
    feature: "goal_page_v3",
    path: Paths.goalV3Path(params.id),
  });

  await redirectIfFeatureEnabled(params, {
    feature: "new_goal_page",
    path: Paths.goalV2Path(params.id),
  });

  return {
    goal: await Goals.getGoal({
      id: params.id,
      includeSpace: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includePermissions: true,
      includeUnreadNotifications: true,
    }).then((data) => data.goal!),
  };
}

function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={[goal.name!]} testId="goal-page">
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none" banner={banner(goal)}>
          <Header goal={goal} activeTab="status" />

          <div className="flex flex-col gap-10 mt-8 mb-10">
            <GoalTargets goal={goal} />
            <LastCheckInMessage goal={goal} />
          </div>

          <GoalFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalFeed() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Paper.DimmedSection>
      <div className="uppercase text-xs text-content-accent font-semibold mb-4">Activity</div>
      <GoalFeedItems goal={goal} />
    </Paper.DimmedSection>
  );
}

function GoalFeedItems({ goal }) {
  const { data, loading, error } = useItemsQuery("goal", goal.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data!.activities!} page="goal" testId="goal-feed" />;
}
