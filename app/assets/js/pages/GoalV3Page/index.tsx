import { PageModule } from "@/routes/types";
import * as React from "react";
import * as Timeframes from "../../utils/timeframes";

import { useLoadedData } from "@/components/Pages";
import { Feed, useItemsQuery } from "@/features/Feed";
import { getGoal, Goal, Target } from "@/models/goals";
import { PageCache } from "@/routes/PageCache";
import { GoalPage } from "turboui";
import { Timeframe } from "turboui/src/utils/timeframes";
import { useMentionedPersonLookupFn } from "../../contexts/CurrentCompanyContext";
import { getWorkMap, WorkMapItem } from "../../models/workMap";
import { Paths } from "../../routes/paths";
import { assertDefined, assertPresent } from "../../utils/assertions";

export default { name: "GoalV3Page", loader, Page } as PageModule;

async function loader({ params, refreshCache = false }): Promise<[Goal, WorkMapItem[]]> {
  return await PageCache.fetch({
    cacheKey: `v4-GoalPage.goal-${params.id}`,
    refreshCache,
    fetchFn: () =>
      Promise.all([
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
          includeAssignees: true,
        }).then((d) => d.workMap!),
      ]),
  });
}

function Page() {
  const [goal, workMap] = PageCache.useData(loader);
  const mentionedPersonLookup = useMentionedPersonLookupFn();

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
    editGoalLink: Paths.goalEditPath(goal.id),
    newCheckInLink: Paths.goalCheckInNewPath(goal.id),
    privacyLevel: goal.privacy,
    timeframe: Timeframes.parse(goal.timeframe),
    parentGoal: prepareParentGoal(goal.parentGoal),
    canEdit: goal.permissions.canEdit,
    champion: goal.champion,
    reviewer: goal.reviewer,

    description: goal.description && JSON.parse(goal.description),
    status: goal.status,
    targets: prepareTargets(goal.targets),
    checkIns: [],
    messages: [],
    contributors: [],
    relatedWorkItems: prepareWorkMapData(workMap),
    mentionedPersonLookup,

    deleteLink: "",
    updateTimeframe: function (timeframe: Timeframe): Promise<void> {
      console.log("updateTimeframe", timeframe);
      throw new Error("Function not implemented.");
    },

    activityFeed: <GoalFeedItems />,
  };

  return <GoalPage {...props} />;
}

function prepareParentGoal(g: Goal | null | undefined): GoalPage.Props["parentGoal"] {
  if (!g) {
    return null;
  } else {
    return { link: Paths.goalPath(g!.id!), name: g!.name! };
  }
}

function prepareWorkMapData(items: WorkMapItem[]): GoalPage.Props["relatedWorkItems"] {
  return items.map((item) => {
    assertPresent(item.assignees);
    return { ...item, children: prepareWorkMapData(item.children), assignees: item.assignees };
  });
}

function GoalFeedItems() {
  const [goal] = useLoadedData();
  const { data, loading, error } = useItemsQuery("goal", goal.id!);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data!.activities!} page="goal" testId="goal-feed" />;
}

function prepareTargets(targets: Target[] | null | undefined): GoalPage.Props["targets"] {
  if (!targets) return [];

  return targets.map((target) => {
    assertPresent(target.id);
    assertPresent(target.name);
    assertPresent(target.from);
    assertPresent(target.to);
    assertPresent(target.value);
    assertPresent(target.unit);
    assertPresent(target.index);

    return {
      id: target.id,
      name: target.name,
      from: target.from,
      to: target.to,
      value: target.value,
      unit: target.unit,
      index: target.index,
      mode: "view" as const,
    };
  });
}
