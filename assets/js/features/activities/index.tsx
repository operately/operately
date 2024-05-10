import * as React from "react";
import { Paths } from "@/routes/paths";

import type { Activity, ActivityContentGoalTimeframeEditing, ActivityContentGoalClosing } from "@/models/activities";
import { match } from "ts-pattern";

import * as GoalTimeframeEditing from "@/features/activities/GoalTimeframeEditing";
import * as GoalClosing from "@/features/activities/GoalClosing";

export function activityPagePath(activity: Activity) {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => {
      const content = activity.content as ActivityContentGoalTimeframeEditing;
      return Paths.goalActivityPath(content.goal.id, activity.id);
    })
    .with("ActivityContentGoalClosing", () => {
      const content = activity.content as ActivityContentGoalClosing;
      return Paths.goalActivityPath(content.goal.id, activity.id);
    })
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}

export function ActivityPageTitle({ activity }: { activity: Activity }) {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => {
      return <GoalTimeframeEditing.PageTitle activity={activity} />;
    })
    .with("ActivityContentGoalClosing", () => {
      return <GoalClosing.PageTitle activity={activity} />;
    })
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}

export function ActivityPageContent({ activity }: { activity: Activity }) {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => {
      return <GoalTimeframeEditing.PageContent activity={activity} />;
    })
    .with("ActivityContentGoalClosing", () => {
      return <GoalClosing.PageContent activity={activity} />;
    })
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}
