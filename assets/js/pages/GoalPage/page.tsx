import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { SuccessConditions } from "@/features/goals/SuccessConditions";
import { LastCheckInMessage } from "@/features/goals/GoalCheckIn";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";
import { GoalFeed } from "./components";


export function Page() {
  const { goal } = useLoadedData();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={[goal.name!]} testId="goal-page">
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="status" />

          <div className="flex flex-col gap-10 mt-8 mb-10">
            <SuccessConditions goal={goal} />
            <LastCheckInMessage goal={goal} />
          </div>

          <GoalFeed />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}