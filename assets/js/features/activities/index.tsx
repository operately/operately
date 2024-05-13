import * as React from "react";

import type { Activity } from "@/models/activities";

export function activityPagePath(activity: Activity) {
  return handler(activity).pagePath(activity);
}

export function activityPageHtmlTitle(activity: Activity) {
  return handler(activity).pageHtmlTitle(activity);
}

export function activityHasComments(activity: Activity) {
  return handler(activity).hasComments(activity);
}

export function activityCommentCount(activity: Activity) {
  return handler(activity).commentCount(activity);
}

export function ActivityPageTitle({ activity }: { activity: Activity }) {
  return React.createElement(handler(activity).PageTitle, { activity });
}

export function ActivityPageContent({ activity }: { activity: Activity }) {
  return React.createElement(handler(activity).PageContent, { activity });
}

export function FeedItemContent({ activity }: { activity: Activity }) {
  return React.createElement(handler(activity).FeedItemContent, { activity });
}

export function FeedItemTitle({ activity, content, page }: { activity: Activity; content: any; page: any }) {
  return React.createElement(handler(activity).FeedItemTitle, { activity, content, page });
}

//
// Private API
//
// Implementing a strategy pattern to handle different types of activities.
// Each activity type has its own module in the features/activities directory.
//

import { match } from "ts-pattern";

import GoalTimeframeEditing from "@/features/activities/GoalTimeframeEditing";
import GoalClosing from "@/features/activities/GoalClosing";
import GoalCheckIn from "@/features/activities/GoalCheckIn";

function handler(activity: Activity) {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => GoalTimeframeEditing)
    .with("ActivityContentGoalClosing", () => GoalClosing)
    .with("ActivityContentGoalCheckIn", () => GoalCheckIn)
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}
