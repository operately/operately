import * as React from "react";

import type { Activity } from "@/models/activities";
import { ActivityHandler } from "./interfaces";

//
// Public API
//
// This is the API that the rest of the application uses to interact
// with the activities feature. It's a facade that delegates to the
// appropriate activity handler based on the activity type.
//

const PublicApi: ActivityHandler = {
  pagePath(activity: Activity) {
    return handler(activity).pagePath(activity);
  },

  pageHtmlTitle(activity: Activity) {
    return handler(activity).pageHtmlTitle(activity);
  },

  hasComments(activity: Activity) {
    return handler(activity).hasComments(activity);
  },

  commentCount(activity: Activity) {
    return handler(activity).commentCount(activity);
  },

  PageTitle({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).PageTitle, { activity });
  },

  PageContent({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).PageContent, { activity });
  },

  PageOptions({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).PageOptions, { activity });
  },

  FeedItemContent({ activity, content, page }: { activity: Activity; content: any; page: any }) {
    return React.createElement(handler(activity).FeedItemContent, { activity, content, page });
  },

  FeedItemTitle({ activity, content, page }: { activity: Activity; content: any; page: any }) {
    return React.createElement(handler(activity).FeedItemTitle, { activity, content, page });
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).NotificationTitle, { activity });
  },

  CommentNotificationTitle({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).CommentNotificationTitle, { activity });
  },
};

export default PublicApi;

//
// Private API
//
// Implementing a strategy pattern to handle different types of activities.
// Each activity type has its own module in the features/activities directory.
//

import { match } from "ts-pattern";

import GoalTimeframeEditing from "@/features/activities/GoalTimeframeEditing";
import GoalClosing from "@/features/activities/GoalClosing";
import GoalReopening from "@/features/activities/GoalReopening";
import GoalCheckIn from "@/features/activities/GoalCheckIn";
import GoalDiscussionCreation from "@/features/activities/GoalDiscussionCreation";

function handler(activity: Activity) {
  return match(activity.content.__typename)
    .with("ActivityContentGoalTimeframeEditing", () => GoalTimeframeEditing)
    .with("ActivityContentGoalClosing", () => GoalClosing)
    .with("ActivityContentGoalReopening", () => GoalReopening)
    .with("ActivityContentGoalCheckIn", () => GoalCheckIn)
    .with("ActivityContentGoalDiscussionCreation", () => GoalDiscussionCreation)
    .otherwise(() => {
      throw new Error("Unknown activity type");
    });
}
