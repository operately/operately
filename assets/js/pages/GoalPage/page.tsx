import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { Feed, useItemsQuery } from "@/features/Feed";
import { LastCheckIn, CheckInButton, LastCheckInAuthor, NextCheckIn } from "./CheckIns";

import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { SuccessConditions } from "@/features/goals/SuccessConditions";

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
            <div className="w-3/4">
              <div className="text-xs font-bold uppercase mb-2">Last Update</div>
              <LastCheckInAuthor goal={goal} />

              <div className="text-xs font-bold uppercase">Success Conditions</div>
              <SuccessConditions goal={goal} />

              <div className="text-xs font-bold uppercase mt-10 mb-2">Last Update Message</div>
              <LastCheckIn goal={goal} />
            </div>

            <div className="flex flex-col gap-4 w-1/4">
              <Icons.IconCalendarRepeat size={30} className="text-content-dimmed" strokeWidth={1.5} />
              <NextCheckIn goal={goal} />
              <CheckInButton goal={goal} />
            </div>
          </div>

          <Paper.DimmedSection>
            <div className="uppercase text-xs text-content-accent font-semibold mb-4">Activity</div>
            <FeedForGoal goal={goal} />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function FeedForGoal({ goal }) {
  const { data, loading, error } = useItemsQuery("goal", goal.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data.activities} page="goal" />;
}
