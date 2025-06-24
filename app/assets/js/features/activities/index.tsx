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
  pagePath(paths: Paths, activity: Activity) {
    return handler(activity).pagePath(paths, activity);
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
  "goal_target_deleting",
  "goal_target_adding",
  "goal_space_updating",
  "goal_name_updating",
  "goal_due_date_updating",
  "goal_reviewer_updating",
  "company_owners_adding",
  "company_owner_removing",
  "company_member_restoring",
  "company_adding",
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
  "goal_reparent",
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
  "project_key_resource_added",
  "project_key_resource_deleted",
  "project_milestone_commented",
  "project_moved",
  "project_pausing",
  "project_renamed",
  "project_resuming",
  "project_resuming",
  "project_timeline_edited",
  "project_retrospective_commented",
  "resource_hub_document_created",
  "resource_hub_document_edited",
  "resource_hub_document_commented",
  "resource_hub_document_deleted",
  "resource_hub_file_created",
  "resource_hub_file_edited",
  "resource_hub_file_deleted",
  "resource_hub_file_commented",
  "resource_hub_folder_copied",
  "resource_hub_folder_created",
  "resource_hub_folder_deleted",
  "resource_hub_folder_renamed",
  "resource_hub_link_created",
  "resource_hub_link_edited",
  "resource_hub_link_deleted",
  "resource_hub_link_commented",
  "space_added",
  "space_joining",
  "space_member_removed",
  "space_members_added",
  "message_archiving",
  "discussion_comment_submitted",
  "goal_champion_updating",
];

//
// Private API
//
// Implementing a strategy pattern to handle different types of activities.
// Each activity type has its own module in the features/activities directory.
//

import { match } from "ts-pattern";

import CommentAdded from "@/features/activities/CommentAdded";
import CompanyAdding from "@/features/activities/CompanyAdding";
import CompanyAdminAdded from "@/features/activities/CompanyAdminAdded";
import CompanyAdminRemoved from "@/features/activities/CompanyAdminRemoved";
import CompanyEditing from "@/features/activities/CompanyEditing";
import CompanyMemberRestoring from "@/features/activities/CompanyMemberRestoring";
import CompanyOwnerRemoving from "@/features/activities/CompanyOwnerRemoving";
import CompanyOwnersAdding from "@/features/activities/CompanyOwnersAdding";
import DiscussionCommentSubmitted from "@/features/activities/DiscussionCommentSubmitted";
import DiscussionPosting from "@/features/activities/DiscussionPosting";
import GoalArchived from "@/features/activities/GoalArchived";
import GoalCheckIn from "@/features/activities/GoalCheckIn";
import GoalCheckInAcknowledgement from "@/features/activities/GoalCheckInAcknowledgement";
import GoalCheckInCommented from "@/features/activities/GoalCheckInCommented";
import GoalClosing from "@/features/activities/GoalClosing";
import GoalCreated from "@/features/activities/GoalCreated";
import GoalDiscussionCreation from "@/features/activities/GoalDiscussionCreation";
import GoalEditing from "@/features/activities/GoalEditing";
import GoalReopening from "@/features/activities/GoalReopening";
import GoalReparent from "@/features/activities/GoalReparent";
import GoalTimeframeEditing from "@/features/activities/GoalTimeframeEditing";
import MessageArchiving from "@/features/activities/MessageArchiving";
import ProjectArchived from "@/features/activities/ProjectArchived";
import ProjectCheckInAcknowledged from "@/features/activities/ProjectCheckInAcknowledged";
import ProjectCheckInCommented from "@/features/activities/ProjectCheckInCommented";
import ProjectCheckInSubmitted from "@/features/activities/ProjectCheckInSubmitted";
import ProjectClosed from "@/features/activities/ProjectClosed";
import ProjectContributorAddition from "@/features/activities/ProjectContributorAddition";
import ProjectContributorEdited from "@/features/activities/ProjectContributorEdited";
import ProjectContributorRemoved from "@/features/activities/ProjectContributorRemoved";
import ProjectContributorsAddition from "@/features/activities/ProjectContributorsAddition";
import ProjectCreated from "@/features/activities/ProjectCreated";
import ProjectGoalConnection from "@/features/activities/ProjectGoalConnection";
import ProjectGoalDisconnection from "@/features/activities/ProjectGoalDisconnection";
import ProjectKeyResourceAdded from "@/features/activities/ProjectKeyResourceAdded";
import ProjectKeyResourceDeleted from "@/features/activities/ProjectKeyResourceDeleted";
import ProjectMilestoneCommented from "@/features/activities/ProjectMilestoneCommented";
import ProjectMoved from "@/features/activities/ProjectMoved";
import ProjectPausing from "@/features/activities/ProjectPausing";
import ProjectRenamed from "@/features/activities/ProjectRenamed";
import ProjectResuming from "@/features/activities/ProjectResuming";
import ProjectRetrospectiveCommented from "@/features/activities/ProjectRetrospectiveCommented";
import ProjectTimelineEdited from "@/features/activities/ProjectTimelineEdited";
import ResourceHubDocumentCommented from "@/features/activities/ResourceHubDocumentCommented";
import ResourceHubDocumentCreated from "@/features/activities/ResourceHubDocumentCreated";
import ResourceHubDocumentDeleted from "@/features/activities/ResourceHubDocumentDeleted";
import ResourceHubDocumentEdited from "@/features/activities/ResourceHubDocumentEdited";
import ResourceHubFileCommented from "@/features/activities/ResourceHubFileCommented";
import ResourceHubFileCreated from "@/features/activities/ResourceHubFileCreated";
import ResourceHubFileDeleted from "@/features/activities/ResourceHubFileDeleted";
import ResourceHubFileEdited from "@/features/activities/ResourceHubFileEdited";
import ResourceHubFolderCopied from "@/features/activities/ResourceHubFolderCopied";
import ResourceHubFolderCreated from "@/features/activities/ResourceHubFolderCreated";
import ResourceHubFolderDeleted from "@/features/activities/ResourceHubFolderDeleted";
import ResourceHubFolderRenamed from "@/features/activities/ResourceHubFolderRenamed";
import ResourceHubLinkCommented from "@/features/activities/ResourceHubLinkCommented";
import ResourceHubLinkCreated from "@/features/activities/ResourceHubLinkCreated";
import ResourceHubLinkDeleted from "@/features/activities/ResourceHubLinkDeleted";
import ResourceHubLinkEdited from "@/features/activities/ResourceHubLinkEdited";
import SpaceAdded from "@/features/activities/SpaceAdded";
import SpaceJoining from "@/features/activities/SpaceJoining";
import SpaceMemberRemoved from "@/features/activities/SpaceMemberRemoved";
import SpaceMembersAdded from "@/features/activities/SpaceMembersAdded";
import GoalChampionUpdating from "./GoalChampionUpdating";
import GoalDueDateUpdating from "./GoalDueDateUpdating";
import GoalReviewerUpdating from "./GoalReviewerUpdating";

import { Paths } from "../../routes/paths";
import GoalNameUpdating from './GoalNameUpdating';
import GoalSpaceUpdating from './GoalSpaceUpdating';
import GoalTargetAdding from './GoalTargetAdding';
import GoalTargetDeleting from './GoalTargetDeleting';

function handler(activity: Activity) {
  return match(activity.action)
    .with("message_archiving", () => MessageArchiving)
    .with("company_editing", () => CompanyEditing)
    .with("comment_added", () => CommentAdded)
    .with("company_adding", () => CompanyAdding)
    .with("company_admin_added", () => CompanyAdminAdded)
    .with("company_admin_removed", () => CompanyAdminRemoved)
    .with("company_owners_adding", () => CompanyOwnersAdding)
    .with("company_owner_removing", () => CompanyOwnerRemoving)
    .with("company_member_restoring", () => CompanyMemberRestoring)
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
    .with("goal_reparent", () => GoalReparent)
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
    .with("project_key_resource_added", () => ProjectKeyResourceAdded)
    .with("project_key_resource_deleted", () => ProjectKeyResourceDeleted)
    .with("project_milestone_commented", () => ProjectMilestoneCommented)
    .with("project_moved", () => ProjectMoved)
    .with("project_pausing", () => ProjectPausing)
    .with("project_renamed", () => ProjectRenamed)
    .with("project_resuming", () => ProjectResuming)
    .with("project_retrospective_commented", () => ProjectRetrospectiveCommented)
    .with("project_timeline_edited", () => ProjectTimelineEdited)
    .with("resource_hub_document_created", () => ResourceHubDocumentCreated)
    .with("resource_hub_document_edited", () => ResourceHubDocumentEdited)
    .with("resource_hub_document_commented", () => ResourceHubDocumentCommented)
    .with("resource_hub_document_deleted", () => ResourceHubDocumentDeleted)
    .with("resource_hub_file_created", () => ResourceHubFileCreated)
    .with("resource_hub_file_deleted", () => ResourceHubFileDeleted)
    .with("resource_hub_file_edited", () => ResourceHubFileEdited)
    .with("resource_hub_file_commented", () => ResourceHubFileCommented)
    .with("resource_hub_folder_copied", () => ResourceHubFolderCopied)
    .with("resource_hub_folder_created", () => ResourceHubFolderCreated)
    .with("resource_hub_folder_deleted", () => ResourceHubFolderDeleted)
    .with("resource_hub_folder_renamed", () => ResourceHubFolderRenamed)
    .with("resource_hub_link_created", () => ResourceHubLinkCreated)
    .with("resource_hub_link_edited", () => ResourceHubLinkEdited)
    .with("resource_hub_link_deleted", () => ResourceHubLinkDeleted)
    .with("resource_hub_link_commented", () => ResourceHubLinkCommented)
    .with("space_added", () => SpaceAdded)
    .with("space_joining", () => SpaceJoining)
    .with("space_member_removed", () => SpaceMemberRemoved)
    .with("space_members_added", () => SpaceMembersAdded)
    .with("goal_champion_updating", () => GoalChampionUpdating)
    .with("goal_reviewer_updating", () => GoalReviewerUpdating)
    .with("goal_due_date_updating", () => GoalDueDateUpdating)
    .with("goal_name_updating", () => GoalNameUpdating)
    .with("goal_space_updating", () => GoalSpaceUpdating)
    .with("goal_target_adding", () => GoalTargetAdding)
    .with("goal_target_deleting", () => GoalTargetDeleting)
    .otherwise(() => {
      throw new Error("Unknown activity action: " + activity.action);
    });
}
