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

  feedItemAlignment(activity: Activity) {
    return handler(activity).feedItemAlignment(activity);
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).NotificationTitle, { activity });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return React.createElement(handler(activity).NotificationLocation, { activity });
  },
};

export default ActivityHandler;

export const DISPLAYED_IN_FEED = [
  "company_owners_adding",
  "company_owner_removing",
  "company_editing",
  "comment_added",
  "company_admin_added",
  "company_admin_removed",
  "discussion_posting",
  "goal_archived",
  "goal_check_in",
  "goal_check_in_acknowledgement",
  "goal_check_in_commented",
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
  "project_contributors_addition",
  "project_contributor_edited",
  "project_contributor_removed",
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
  "project_retrospective_commented",
  "space_added",
  "space_joining",
  "space_member_removed",
  "space_members_added",
];

//
// Private API
//
// Implementing a strategy pattern to handle different types of activities.
// Each activity type has its own module in the features/activities directory.
//

import { match } from "ts-pattern";

import CommentAdded from "@/features/activities/CommentAdded";
import CompanyAdminAdded from "@/features/activities/CompanyAdminAdded";
import CompanyAdminRemoved from "@/features/activities/CompanyAdminRemoved";
import CompanyOwnersAdding from "@/features/activities/CompanyOwnersAdding";
import CompanyOwnerRemoving from "@/features/activities/CompanyOwnerRemoving";
import DiscussionPosting from "@/features/activities/DiscussionPosting";
import DiscussionCommentSubmitted from "@/features/activities/DiscussionCommentSubmitted";
import GoalArchived from "@/features/activities/GoalArchived";
import GoalCheckIn from "@/features/activities/GoalCheckIn";
import GoalCheckInAcknowledgement from "@/features/activities/GoalCheckInAcknowledgement";
import GoalCheckInCommented from "@/features/activities/GoalCheckInCommented";
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
import ProjectContributorsAddition from "@/features/activities/ProjectContributorsAddition";
import ProjectContributorEdited from "@/features/activities/ProjectContributorEdited";
import ProjectContributorRemoved from "@/features/activities/ProjectContributorRemoved";
import ProjectCreated from "@/features/activities/ProjectCreated";
import ProjectGoalConnection from "@/features/activities/ProjectGoalConnection";
import ProjectGoalDisconnection from "@/features/activities/ProjectGoalDisconnection";
import ProjectMilestoneCommented from "@/features/activities/ProjectMilestoneCommented";
import ProjectMoved from "@/features/activities/ProjectMoved";
import ProjectPausing from "@/features/activities/ProjectPausing";
import ProjectRenamed from "@/features/activities/ProjectRenamed";
import ProjectResuming from "@/features/activities/ProjectResuming";
import ProjectRetrospectiveCommented from "@/features/activities/ProjectRetrospectiveCommented";
import ProjectTimelineEdited from "@/features/activities/ProjectTimelineEdited";
import SpaceAdded from "@/features/activities/SpaceAdded";
import SpaceJoining from "@/features/activities/SpaceJoining";
import SpaceMemberRemoved from "@/features/activities/SpaceMemberRemoved";
import SpaceMembersAdded from "@/features/activities/SpaceMembersAdded";
import CompanyEditing from "@/features/activities/CompanyEditing";

function handler(activity: Activity) {
  return match(activity.action)
    .with("company_editing", () => CompanyEditing)
    .with("comment_added", () => CommentAdded)
    .with("company_admin_added", () => CompanyAdminAdded)
    .with("company_admin_removed", () => CompanyAdminRemoved)
    .with("company_owners_adding", () => CompanyOwnersAdding)
    .with("company_owner_removing", () => CompanyOwnerRemoving)
    .with("discussion_posting", () => DiscussionPosting)
    .with("discussion_comment_submitted", () => DiscussionCommentSubmitted)
    .with("goal_archived", () => GoalArchived)
    .with("goal_check_in", () => GoalCheckIn)
    .with("goal_check_in_acknowledgement", () => GoalCheckInAcknowledgement)
    .with("goal_check_in_commented", () => GoalCheckInCommented)
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
    .with("project_contributors_addition", () => ProjectContributorsAddition)
    .with("project_contributor_edited", () => ProjectContributorEdited)
    .with("project_contributor_removed", () => ProjectContributorRemoved)
    .with("project_created", () => ProjectCreated)
    .with("project_goal_connection", () => ProjectGoalConnection)
    .with("project_goal_disconnection", () => ProjectGoalDisconnection)
    .with("project_milestone_commented", () => ProjectMilestoneCommented)
    .with("project_moved", () => ProjectMoved)
    .with("project_pausing", () => ProjectPausing)
    .with("project_renamed", () => ProjectRenamed)
    .with("project_resuming", () => ProjectResuming)
    .with("project_retrospective_commented", () => ProjectRetrospectiveCommented)
    .with("project_timeline_edited", () => ProjectTimelineEdited)
    .with("space_added", () => SpaceAdded)
    .with("space_joining", () => SpaceJoining)
    .with("space_member_removed", () => SpaceMemberRemoved)
    .with("space_members_added", () => SpaceMembersAdded)
    .otherwise(() => {
      throw new Error("Unknown activity action: " + activity.action);
    });
}
