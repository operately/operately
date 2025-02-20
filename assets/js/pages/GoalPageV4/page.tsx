import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Header } from "./Header";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";

import { Overview } from "./Overview";
import { Targets } from "./Targets";
import { Messages } from "./Messages";
import { RelatedWork } from "./RelatedWork";
import { useLoadedData } from "./loader";
import { GoalFeed } from "./GoalFeed";

export function Page() {
  const { goal } = useLoadedData();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={[goal.name!]} testId="goal-page">
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <Header goal={goal} />

          <Overview />
          <Targets />
          <Messages />
          <RelatedWork />

          <GoalFeed goal={goal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
