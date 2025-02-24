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
import { RelatedWork } from "./RelatedWork";
import Avatar from "@/components/Avatar";
import { DimmedLink } from "@/components/Link";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { MenuActionItem } from "@/components/Menu";

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

            <div className="w-[260px] text-sm mt-6">
              <div className="flex justify-end gap-2 items-center border-b border-stroke-base pb-4 mb-8">
                <SecondaryButton linkTo={""} testId="update-progress-button" size="sm">
                  <Icons.IconStarFilled size={16} />
                </SecondaryButton>

                <SecondaryButton
                  linkTo={""}
                  testId="update-progress-button"
                  size="sm"
                  options={[
                    <MenuActionItem onClick={() => {}}>All Updates</MenuActionItem>,
                    <MenuActionItem onClick={() => {}}>Check-ins</MenuActionItem>,
                  ]}
                >
                  <Icons.IconBell size={16} />
                  Follow
                </SecondaryButton>

                <PrimaryButton linkTo={""} testId="update-progress-button" size="sm">
                  Check In
                </PrimaryButton>
              </div>

              <div className="mt-6 mb-2 uppercase text-xs font-bold tracking-wider">Timeframe</div>

              <div className="flex flex-col gap-2">
                <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg px-2 py-2 flex items-center justify-between gap-1 relative overflow-hidden group cursor-pointer">
                  <div
                    className="absolute top-0 left-0 right-0 bottom-0 bg-stone-300 opacity-50 group-hover:bg-indigo-200 transition"
                    style={{ width: "20%" }}
                  />
                  <div className="border-l border-stone-300 top-px bottom-px absolute" style={{ left: "20%" }} />

                  <span className="text-xs font-medium z-1 relative">Jan 1</span>
                  <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
                  <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
                  <span className="text-xs font-medium z-1 relative">Dec 31</span>
                </div>

                <div className="text-xs text-content-dimmed">
                  10 months left &bull; <DimmedLink to="">View on timeline</DimmedLink>
                </div>
              </div>

              <div className="mt-6 mb-2 uppercase text-xs font-bold tracking-wider">Champion</div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Avatar person={goal.champion!} size={20} /> {goal.champion!.fullName}
                </div>
              </div>

              <div className="mt-6 mb-2 uppercase text-xs font-bold tracking-wider">Reviewer</div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Avatar person={goal.reviewer!} size={20} /> {goal.reviewer!.fullName}
                </div>
              </div>

              <div className="mt-6 mb-2 uppercase text-xs font-bold tracking-wider">Contributors</div>
              <div>
                <div className="flex items-center gap-0.5 flex-wrap">
                  <Avatar person={goal.champion!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.champion!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.champion!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.champion!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.champion!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.champion!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.champion!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                  <Avatar person={goal.reviewer!} size={20} />
                </div>

                <div className="text-xs text-content-dimmed mt-3 mb-1">
                  17 people contributed by working on related projects and sub-goals
                </div>

                <DimmedLink to="" className="text-xs">
                  See how they contributed
                </DimmedLink>
              </div>
            </div>
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
