import * as React from "react";
import * as Timeframes from "../../utils/timeframes";

import { useLoadedData } from "@/components/Pages";
import { Feed, useItemsQuery } from "@/features/Feed";
import { getGoal, Goal } from "@/models/goals";
import { GoalPage } from "turboui";
import { Timeframe } from "turboui/src/utils/timeframes";
import { getWorkMap, WorkMapItem } from "../../models/workMap";
import { Paths } from "../../routes/paths";
import { assertDefined, assertPresent } from "../../utils/assertions";

interface LoadedData {
  goal: Goal;
  workMap: WorkMapItem[];
}

export async function loader({ params }): Promise<LoadedData> {
  const [goal, workMap] = await Promise.all([
    getGoal({
      id: params.id,
      includeSpace: true,
      includeChampion: true,
      includeReviewer: true,
      includeTargets: true,
      includePermissions: true,
      includeUnreadNotifications: true,
      includeLastCheckIn: true,
      includeAccessLevels: true,
      includePrivacy: true,
    }).then((d) => d.goal!),
    getWorkMap({
      parentGoalId: params.id,
    }).then((d) => d.workMap!),
  ]);

  return { goal, workMap };
}

export function Page() {
  const { goal, workMap } = useLoadedData<LoadedData>();

  assertPresent(goal.space);
  assertPresent(goal.privacy);
  assertPresent(goal.permissions?.canEdit);
  assertDefined(goal.champion);
  assertDefined(goal.reviewer);
  assertPresent(goal.timeframe);

  const props: GoalPage.Props = {
    goalName: goal.name,
    spaceName: goal.space.name,
    workmapLink: Paths.spaceGoalsPath(goal.space.id),
    spaceLink: Paths.spacePath(goal.space.id),
    closeLink: Paths.goalClosePath(goal.id),
    privacyLevel: goal.privacy,
    timeframe: Timeframes.parse(goal.timeframe),
    parentGoal: prepareParentGoal(goal.parentGoal),
    canEdit: goal.permissions.canEdit,
    champion: goal.champion,
    reviewer: goal.reviewer,

    description: "",
    status: goal.status,
    targets: [],
    checkIns: [],
    messages: [],
    contributors: [],
    relatedWorkItems: prepareWorkMapData(workMap),

    deleteLink: "",
    updateTimeframe: function (timeframe: Timeframe): Promise<void> {
      console.log("updateTimeframe", timeframe);
      throw new Error("Function not implemented.");
    },

    activityFeed: <GoalFeedItems />,
  };

  return (
    <div className="sm:my-8">
      <GoalPage {...props} />
    </div>
  );
}

function prepareParentGoal(g: Goal | null | undefined): GoalPage.Props["parentGoal"] {
  if (!g) {
    return null;
  } else {
    return { link: Paths.goalPath(g!.id!), name: g!.name! };
  }
}

function prepareWorkMapData(items: WorkMapItem[]): GoalPage.Props["relatedWorkItems"] {
  return items.map((item) => ({
    ...item,
    children: prepareWorkMapData(item.children),
    assignees: assertPresent(item.assignees),
    completed: false,
  }));
}

function GoalFeedItems() {
  const { goal } = useLoadedData();
  const { data, loading, error } = useItemsQuery("goal", goal.id!);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data!.activities!} page="goal" testId="goal-feed" />;
}
