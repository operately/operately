import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { Feed, useItemsQuery } from "@/features/Feed";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { LastCheckInMessage } from "@/features/goals/GoalCheckIn";
import * as Tabs from "@/components/Tabs"; // this is temporary, will be removed in the next step
import { Paths } from "@/routes/paths";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.id,
      includeSpace: true,
      includeChampion: true,
      includeReviewer: true,
      includeTargets: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includePermissions: true,
    }).then((data) => data.goal!),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={[goal.name!]}>
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <Header goal={goal} />

          <div className="flex flex-col mt-4 mb-10">
            <LastCheckInMessage goal={goal} />
          </div>

          <GoalTabs activeTab="status" goal={goal} />

          <GoalFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalTabs({ activeTab, goal }: { activeTab: HeaderProps["activeTab"]; goal: Goals.Goal }) {
  return (
    <Tabs.Root activeTab={activeTab}>
      <Tabs.Tab id="status" title="Current Status" linkTo={Paths.goalPath(goal.id!)} />
      <Tabs.Tab id="subgoals" title="Sub-Goals and Projects" linkTo={Paths.goalSubgoalsPath(goal.id!)} />
      <Tabs.Tab id="discussions" title="Discussions" linkTo={Paths.goalDiscussionsPath(goal.id!)} />
      <Tabs.Tab id="about" title="About" linkTo={Paths.goalAboutPath(goal.id!)} />
    </Tabs.Root>
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

  return <Feed items={data!.activities!} page="goal" />;
}
