import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { Navigation } from "@/features/goals/GoalPageNavigation";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";

import { Header } from "./Header";
import { Overview } from "./Overview";
import { Targets } from "./Targets";
import { Messages } from "./Messages";
import { RelatedWork } from "./RelatedWork";
import { Actions } from "./Actions";
import { Timeframe } from "./Timeframe";
import { Champion } from "./Champion";
import { Reviewer } from "./Reviewer";
import { Contributors } from "./Contributors";
import { GoalFeed } from "./GoalFeed";

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
      includeChampion: true,
      includeReviewer: true,
    }).then((data) => data.goal!),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={[goal.name!]} testId="goal-page">
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <div className="flex gap-12">
            <div className="flex-1">
              <Header goal={goal} />
              <Overview />
              <Targets />
              <Messages />
              <RelatedWork />
            </div>

            <div className="w-[260px] text-sm mt-6 sticky top-10">
              <Actions />
              <Timeframe goal={goal} />
              <Champion goal={goal} />
              <Reviewer goal={goal} />
              <Contributors goal={goal} />
            </div>
          </div>

          <GoalFeed goal={goal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
