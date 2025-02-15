import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";

import { Feed, useItemsQuery } from "@/features/Feed";
import { Header } from "./Header";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";

import { Overview } from "./Overview";
import { Targets } from "./Targets";
import { Messages } from "./Messages";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.id,
      includeSpace: true,
      includeTargets: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includePermissions: true,
      includeUnreadNotifications: true,
    }).then((data) => data.goal!),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  const sections = [
    {
      id: "overview",
      name: "Overview",
      progress: 100,
      bg: "bg-blue-50/30",
    },
    {
      id: "goals-projects",
      name: "Goals & Projects",
      count: "4",
      progress: 70,
      bg: "bg-purple-50/30",
    },
    {
      id: "targets",
      name: "Targets",
      count: "3",
      progress: 50,
      bg: "bg-green-50/30",
    },
    {
      id: "updates",
      name: "Updates",
      count: "3",
      progress: 30,
      bg: "bg-orange-50/30",
    },
  ];

  const [activeSection, setActiveSection] = React.useState("overview");

  return (
    <Pages.Page title={[goal.name!]} testId="goal-page">
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none" noPadding>
          <div className="px-32 pt-14 ">
            <Header goal={goal} />
          </div>

          <div className="sticky top-0 bg-surface-base border-b z-10 border-stroke-base mt-8">
            <div className="text-sm flex items-center gap-4 px-32 font-medium pt-2.5">
              <div className="text-content-base border-b-2 border-dark-1 pb-2.5 -mb-[2px]">Overview</div>
              <div className="text-content-dimmed border-b border-transparent pb-2 -mb-px">
                Targets{" "}
                <span className="text-[10px] text-content-dimmed bg-stone-100 p-1 rounded-full leading-none">3</span>
              </div>
              <div className="text-content-dimmed border-b border-transparent pb-2.5 -mb-px">
                Messages{" "}
                <span className="text-[10px] text-content-dimmed bg-stone-100 p-1 rounded-full leading-none">45</span>
              </div>
              <div className="text-content-dimmed border-b border-transparent pb-2.5 -mb-px">
                Sub-Goals &amp; Projects{" "}
                <span className="text-[10px] text-content-dimmed bg-stone-100 p-1 rounded-full leading-none">7</span>
              </div>
              <div className="text-content-dimmed border-b border-transparent pb-2.5 -mb-px">Activity</div>
            </div>
          </div>

          <div>
            <Overview />
            <Targets />
            <Messages />
          </div>

          <div className="px-12 pt-14 pb-4">
            <GoalFeed />
          </div>
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
