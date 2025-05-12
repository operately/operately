import * as People from "@/models/people";
import * as React from "react";
import * as Timeframes from "../../utils/timeframes";

import { useLoadedData } from "@/components/Pages";
import { Feed, useItemsQuery } from "@/features/Feed";
import { Goal, getGoal } from "@/models/goals";
import { GoalPage, MiniWorkMap } from "turboui";
import { Timeframe } from "turboui/src/utils/timeframes";
import { getWorkMap } from "../../models/workMap";
import { Paths } from "../../routes/paths";

interface LoaderResult {
  goal: Goal;
  relatedWorkItems: GoalPage.Props["relatedWorkItems"];
}

export async function loader({ params }): Promise<LoaderResult> {
  const goal = await getGoal({
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
  }).then((data) => data.goal!);

  const relatedWorkItems = await getWorkMap({})
    .then((data) => data.workMap || [])
    .then((data) => data.map((item) => ({ ...item, people: [], link: "", subitems: [], completed: false })))
    .then((data) => MiniWorkMap.WorkItemsSchema.array().parse(data))
    .catch((error) => {
      console.error("Error fetching work items:", error);
      throw new Error("Failed to fetch work items");
    });

  return { goal, relatedWorkItems };
}

export function Page() {
  const { goal, relatedWorkItems } = useLoadedData<LoaderResult>();

  const props: GoalPage.Props = {
    goalName: goal.name!,
    spaceName: goal.space!.name!,
    workmapLink: Paths.spaceGoalsPath(goal.space!.id!),
    spaceLink: Paths.spacePath(goal.space!.id!),
    closeLink: Paths.goalClosePath(goal.id!),
    privacyLevel: goal.privacy! as GoalPage.Props["privacyLevel"],
    timeframe: Timeframes.parse(goal.timeframe!),
    parentGoal: toParentGoal(goal.parentGoal),
    canEdit: goal.permissions!.canEdit!,
    champion: toTurbouiPerson(goal.champion!),
    reviewer: toTurbouiPerson(goal.reviewer!),

    description: "",
    status: "pending",
    targets: [],
    checkIns: [],
    messages: [],
    contributors: [],
    relatedWorkItems,

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

function toParentGoal(g: Goal | null | undefined): GoalPage.Props["parentGoal"] {
  if (!g) {
    return null;
  } else {
    return { link: Paths.goalPath(g!.id!), name: g!.name! };
  }
}

function toTurbouiPerson(p: People.Person): GoalPage.Person {
  return {
    id: p.id!,
    fullName: p.fullName!,
    avatarUrl: p.avatarUrl!,
  };
}

function GoalFeedItems() {
  const { goal } = useLoadedData();
  const { data, loading, error } = useItemsQuery("goal", goal.id!);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data!.activities!} page="goal" testId="goal-feed" />;
}
