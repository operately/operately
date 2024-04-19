import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Feed, useItemsQuery } from "@/features/Feed";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { SuccessConditions } from "@/features/goals/SuccessConditions";
import { LastCheckInAuthor, NextCheckInSchedule, LastCheckInMessage } from "@/features/goals/GoalCheckIn";

import { useLoadedData } from "./loader";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="status" />

          <div className="flex items-start gap-8 mt-8">
            <div className="w-3/4 flex flex-col gap-8">
              <LastCheckInAuthor goal={goal} />
              <SuccessConditions goal={goal} />
              <LastCheckInMessage goal={goal} />
            </div>

            <div className="w-1/4">
              <NextCheckInSchedule goal={goal} />
            </div>
          </div>

          <GoalFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function GoalFeed() {
  const { goal } = useLoadedData();

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

  return <Feed items={data.activities} page="goal" />;
}
