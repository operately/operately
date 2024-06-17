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

export const DISPLAYED_IN_FEED = [
  "comment_added",
  "discussion_posting",
  "goal_archived",
  "goal_check_in",
  "goal_check_in_acknowledgement",
  "goal_closing",
  "goal_created",
  "goal_discussion_creation",
  "goal_editing",
  "goal_reopening",
  "goal_timeframe_editing",
  "project_archived",
  "project_check_in_acknowledged",
  "project_check_in_commented",
  "project_check_in_submitted",
  "project_closed",
  "project_contributor_addition",
  "project_created",
  "project_goal_connection",
  "project_goal_disconnection",
  "project_milestone_commented",
  "project_moved",
  "project_pausing",
  "project_renamed",
  "project_resuming",
  "project_resuming",
  "project_timeline_edited",
  "space_joining",
];

//
// Private API
//
// Implementing a strategy pattern to handle different types of activities.
// Each activity type has its own module in the features/activities directory.
//

import { match } from "ts-pattern";

import CommentAdded from "@/features/activities/CommentAdded";
import DiscussionPosting from "@/features/activities/DiscussionPosting";
import GoalArchived from "@/features/activities/GoalArchived";
import GoalCheckIn from "@/features/activities/GoalCheckIn";
import GoalCheckInAcknowledgement from "@/features/activities/GoalCheckInAcknowledgement";
import GoalClosing from "@/features/activities/GoalClosing";
import GoalCreated from "@/features/activities/GoalCreated";
import GoalDiscussionCreation from "@/features/activities/GoalDiscussionCreation";
import GoalEditing from "@/features/activities/GoalEditing";
import GoalReopening from "@/features/activities/GoalReopening";
import GoalTimeframeEditing from "@/features/activities/GoalTimeframeEditing";
import ProjectArchived from "@/features/activities/ProjectArchived";
import ProjectCheckInAcknowledged from "@/features/activities/ProjectCheckInAcknowledged";
import ProjectCheckInCommented from "@/features/activities/ProjectCheckInCommented";
import ProjectCheckInSubmitted from "@/features/activities/ProjectCheckInSubmitted";
import ProjectClosed from "@/features/activities/ProjectClosed";
import ProjectContributorAddition from "@/features/activities/ProjectContributorAddition";
import ProjectCreated from "@/features/activities/ProjectCreated";
import ProjectGoalConnection from "@/features/activities/ProjectGoalConnection";
import ProjectGoalDisconnection from "@/features/activities/ProjectGoalDisconnection";
import ProjectMilestoneCommented from "@/features/activities/ProjectMilestoneCommented";
import ProjectMoved from "@/features/activities/ProjectMoved";
import ProjectPausing from "@/features/activities/ProjectPausing";
import ProjectRenamed from "@/features/activities/ProjectRenamed";
import ProjectResuming from "@/features/activities/ProjectResuming";
import ProjectTimelineEdited from "@/features/activities/ProjectTimelineEdited";
import SpaceJoining from "@/features/activities/SpaceJoining";

function handler(activity: Activity) {
  return match(activity.action)
    .with("comment_added", () => CommentAdded)
    .with("discussion_posting", () => DiscussionPosting)
    .with("goal_archived", () => GoalArchived)
    .with("goal_check_in", () => GoalCheckIn)
    .with("goal_check_in_acknowledgement", () => GoalCheckInAcknowledgement)
    .with("goal_closing", () => GoalClosing)
    .with("goal_created", () => GoalCreated)
    .with("goal_discussion_creation", () => GoalDiscussionCreation)
    .with("goal_editing", () => GoalEditing)
    .with("goal_reopening", () => GoalReopening)
    .with("goal_timeframe_editing", () => GoalTimeframeEditing)
    .with("project_archived", () => ProjectArchived)
    .with("project_check_in_acknowledged", () => ProjectCheckInAcknowledged)
    .with("project_check_in_commented", () => ProjectCheckInCommented)
    .with("project_check_in_submitted", () => ProjectCheckInSubmitted)
    .with("project_closed", () => ProjectClosed)
    .with("project_contributor_addition", () => ProjectContributorAddition)
    .with("project_created", () => ProjectCreated)
    .with("project_goal_connection", () => ProjectGoalConnection)
    .with("project_goal_disconnection", () => ProjectGoalDisconnection)
    .with("project_milestone_commented", () => ProjectMilestoneCommented)
    .with("project_moved", () => ProjectMoved)
    .with("project_pausing", () => ProjectPausing)
    .with("project_renamed", () => ProjectRenamed)
    .with("project_resuming", () => ProjectResuming)
    .with("project_resuming", () => ProjectResuming)
    .with("project_timeline_edited", () => ProjectTimelineEdited)
    .with("space_joining", () => SpaceJoining)
    .otherwise(() => {
      throw new Error("Unknown activity action: " + activity.action);
    });
}
