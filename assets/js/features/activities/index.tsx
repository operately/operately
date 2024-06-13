import * as React from "react";
import * as interfaces from "./interfaces";

import type { Activity } from "@/models/activities";

//
// Public API
//
// This is the API that the rest of the application uses to interact
// with the activities feature. It's a facade that delegates to the
// appropriate activity handler based on the activity type.
//

const ActivityHandler: interfaces.ActivityHandler = {
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

  FeedItemContent({ activity, page }: { activity: Activity; page: any }) {
    return React.createElement(handler(activity).FeedItemContent, { activity, page });
  },

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    return React.createElement(handler(activity).FeedItemTitle, { activity, page });
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).NotificationTitle, { activity });
  },

  CommentNotificationTitle({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).CommentNotificationTitle, { activity });
  },
};

export default ActivityHandler;

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
import SpaceJoining from "@/features/activities/SpaceJoining";

function handler(activity: Activity) {
  return match(activity.action)
    .with("goal_timeframe_editing", () => GoalTimeframeEditing)
    .with("goal_closing", () => GoalClosing)
    .with("goal_reopening", () => GoalReopening)
    .with("goal_check_in", () => GoalCheckIn)
    .with("goal_discussion_creation", () => GoalDiscussionCreation)
    .with("space_joining", () => SpaceJoining)
    .otherwise(() => {
      throw new Error("Unknown activity action: " + activity.action);
    });
}
