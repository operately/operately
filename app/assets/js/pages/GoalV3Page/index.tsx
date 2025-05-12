import * as People from "@/models/people";
import * as React from "react";
import * as Timeframes from "../../utils/timeframes";

import { useLoadedData } from "@/components/Pages";
import { Goal, getGoal } from "@/models/goals";
import { GoalPage } from "turboui";
import { Timeframe } from "turboui/src/utils/timeframes";
import { Paths } from "../../routes/paths";

interface LoaderResult {
  goal: Goal;
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

  return { goal };
}

export function Page() {
  const { goal } = useLoadedData<LoaderResult>();

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
    relatedWorkItems: [],

    deleteLink: "",
    updateTimeframe: function (timeframe: Timeframe): Promise<void> {
      console.log("updateTimeframe", timeframe);
      throw new Error("Function not implemented.");
    },
  };

  return (
    <div className="sm:mt-8">
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
