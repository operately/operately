import React from "react";
import axios from "axios";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { handleStaleClientError } from "./staleClient";
import { queryClient } from "./queryClient";

function toCamel(o: any) {
  var newO: any, origKey: any, newKey: any, value: any;

  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = toCamel(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
        newKey =
          origKey === "__typename"
            ? origKey
            : origKey.replace(/_([a-z])/g, function (_a: string, b: string) {
                return b.toUpperCase();
              });
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}

function toSnake(o: any) {
  var newO: any, origKey: any, newKey: any, value: any;

  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = toSnake(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
        newKey =
          origKey === "__typename"
            ? origKey
            : origKey.replace(/([A-Z])/g, function (a: string) {
                return "_" + a.toLowerCase();
              });
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toSnake(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}

type UseQueryHookResult<ResultT> = { data: ResultT | null; loading: boolean; error: Error | null; refetch: () => void };

export function useQuery<ResultT>(fn: () => Promise<ResultT>): UseQueryHookResult<ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(() => {
    setError(null);

    fn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => fetchData(), []);

  const refetch = React.useCallback(() => {
    setLoading(true);
    fetchData();
  }, []);

  return { data, loading, error, refetch };
}

type UseMutationHookResult<InputT, ResultT> = [
  (input: InputT) => Promise<ResultT | any>,
  { data: ResultT | null; loading: boolean; error: Error | null },
];

export function useMutation<InputT, ResultT>(
  fn: (input: InputT) => Promise<ResultT>,
): UseMutationHookResult<InputT, ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (input: InputT): Promise<ResultT | any> => {
    try {
      setLoading(true);
      setError(null);

      var data = await fn(input);

      setData(data);

      return data;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return [execute, { data, loading, error }];
}

export type CompanyId = string;

export type Id = string;

export type Json = string;

export interface AccessLevels {
  __typename: "access_levels";
  public?: AccessOptionsInt | null;
  company?: AccessOptionsInt | null;
  space?: AccessOptionsInt | null;
}

export interface Account {
  fullName: string;
  siteAdmin: boolean;
}

export interface Activity {
  __typename: "activity";
  id: string;
  scopeType?: string | null;
  scopeId?: string | null;
  action: string;
  insertedAt: string;
  updatedAt?: string | null;
  commentThread?: CommentThread | null;
  author?: Person | null;
  resource?: ActivityResourceUnion | null;
  person?: Person | null;
  eventData?: ActivityDataUnion | null;
  content: ActivityContent;
  notifications?: Notification[] | null;
  permissions?: ActivityPermissions | null;
}

export interface ActivityContentCommentAdded {
  __typename: "activity_content_comment_added";
  comment?: Comment | null;
  activity?: Activity | null;
}

export interface ActivityContentCompanyAdding {
  __typename: "activity_content_company_adding";
  company?: Company | null;
  creator?: Person | null;
}

export interface ActivityContentCompanyAdminAdded {
  __typename: "activity_content_company_admin_added";
  company?: Company | null;
  people?: Person[] | null;
}

export interface ActivityContentCompanyAdminRemoved {
  __typename: "activity_content_company_admin_removed";
  company?: Company | null;
  person?: Person | null;
}

export interface ActivityContentCompanyEditing {
  __typename: "activity_content_company_editing";
  companyId?: string | null;
  company?: Company | null;
  newName?: string | null;
  oldName?: string | null;
}

export interface ActivityContentCompanyMemberAdded {
  __typename: "activity_content_company_member_added";
  company: Company;
  person: Person | null;
  name: string;
}

export interface ActivityContentCompanyMemberConvertedToGuest {
  __typename: "activity_content_company_member_converted_to_guest";
  company: Company;
  person: Person | null;
}

export interface ActivityContentCompanyMemberJoined {
  __typename: "activity_content_company_member_joined";
  company: Company;
  person: Person;
}

export interface ActivityContentCompanyMemberRestoring {
  __typename: "activity_content_company_member_restoring";
  person?: Person | null;
}

export interface ActivityContentCompanyMembersPermissionsEdited {
  __typename: "activity_content_company_members_permissions_edited";
  companyId: string;
  members: ActivityContentCompanyMembersPermissionsEditedMember[];
}

export interface ActivityContentCompanyMembersPermissionsEditedMember {
  __typename: "activity_content_company_members_permissions_edited_member";
  personId: string;
  person: Person;
  previousAccessLevel: AccessOptionsInt;
  previousAccessLevelLabel: string;
  updatedAccessLevel: AccessOptionsInt;
  updatedAccessLevelLabel: string;
}

export interface ActivityContentCompanyOwnerRemoving {
  __typename: "activity_content_company_owner_removing";
  company: Company;
  person: Person | null;
}

export interface ActivityContentCompanyOwnersAdding {
  __typename: "activity_content_company_owners_adding";
  company?: Company | null;
  people?: ActivityContentCompanyOwnersAddingPerson[] | null;
}

export interface ActivityContentCompanyOwnersAddingPerson {
  __typename: "activity_content_company_owners_adding_person";
  person?: Person | null;
}

export interface ActivityContentDiscussionCommentSubmitted {
  __typename: "activity_content_discussion_comment_submitted";
  discussion: Discussion | null;
  comment: Comment | null;
  space: Space;
}

export interface ActivityContentDiscussionEditing {
  __typename: "activity_content_discussion_editing";
  companyId?: string | null;
  spaceId?: string | null;
  discussionId?: string | null;
}

export interface ActivityContentDiscussionPosting {
  __typename: "activity_content_discussion_posting";
  companyId?: string | null;
  spaceId?: string | null;
  title?: string | null;
  discussionId?: string | null;
  space?: Space | null;
  discussion?: Discussion | null;
}

export interface ActivityContentGoalArchived {
  __typename: "activity_content_goal_archived";
  goal?: Goal | null;
}

export interface ActivityContentGoalChampionUpdating {
  __typename: "activity_content_goal_champion_updating";
  company: Company;
  space: Space;
  goal: Goal;
  oldChampion: Person;
  newChampion: Person;
}

export interface ActivityContentGoalCheckAdding {
  __typename: "activity_content_goal_check_adding";
  company: Company;
  space: Space;
  goal: Goal;
  name: string;
}

export interface ActivityContentGoalCheckIn {
  __typename: "activity_content_goal_check_in";
  goalId?: string | null;
  goal?: Goal | null;
  update?: GoalProgressUpdate | null;
  oldTimeframe?: Timeframe | null;
  newTimeframe?: Timeframe | null;
}

export interface ActivityContentGoalCheckInAcknowledgement {
  __typename: "activity_content_goal_check_in_acknowledgement";
  goal?: Goal | null;
  update?: GoalProgressUpdate | null;
}

export interface ActivityContentGoalCheckInCommented {
  __typename: "activity_content_goal_check_in_commented";
  goal: Goal;
  update: GoalProgressUpdate | null;
  comment: Comment | null;
}

export interface ActivityContentGoalCheckInEdit {
  __typename: "activity_content_goal_check_in_edit";
  companyId?: string | null;
  goalId?: string | null;
  checkInId?: string | null;
}

export interface ActivityContentGoalCheckRemoving {
  __typename: "activity_content_goal_check_removing";
  company: Company;
  space: Space;
  goal: Goal;
  name: string;
}

export interface ActivityContentGoalCheckToggled {
  __typename: "activity_content_goal_check_toggled";
  company: Company;
  space: Space;
  goal: Goal;
  name: string;
  completed: boolean;
}

export interface ActivityContentGoalClosing {
  __typename: "activity_content_goal_closing";
  successStatus: SuccessStatus;
  goal: Goal;
}

export interface ActivityContentGoalCreated {
  __typename: "activity_content_goal_created";
  goal?: Goal | null;
}

export interface ActivityContentGoalDescriptionChanged {
  __typename: "activity_content_goal_description_changed";
  goal: Goal | null;
  goalName: string;
  hasDescription: boolean;
  oldDescription: string | null;
  newDescription: string | null;
}

export interface ActivityContentGoalDiscussionCreation {
  __typename: "activity_content_goal_discussion_creation";
  goal: Goal;
}

export interface ActivityContentGoalDiscussionEditing {
  __typename: "activity_content_goal_discussion_editing";
  companyId?: string | null;
  spaceId?: string | null;
  goalId?: string | null;
  activityId?: string | null;
}

export interface ActivityContentGoalDueDateUpdating {
  __typename: "activity_content_goal_due_date_updating";
  company: Company;
  space: Space;
  goal: Goal;
  oldDueDate: string | null;
  newDueDate: string | null;
}

export interface ActivityContentGoalEditing {
  __typename: "activity_content_goal_editing";
  goal?: Goal | null;
  companyId?: string | null;
  goalId?: string | null;
  oldName?: string | null;
  newName?: string | null;
  oldTimeframe?: Timeframe | null;
  newTimeframe?: Timeframe | null;
  oldChampionId?: string | null;
  newChampionId?: string | null;
  oldReviewerId?: string | null;
  newReviewerId?: string | null;
  newChampion?: Person | null;
  newReviewer?: Person | null;
  addedTargets?: Target[] | null;
  updatedTargets?: GoalEditingUpdatedTarget[] | null;
  deletedTargets?: Target[] | null;
}

export interface ActivityContentGoalNameUpdating {
  __typename: "activity_content_goal_name_updating";
  company: Company;
  space: Space;
  goal: Goal;
  oldName: string;
  newName: string;
}

export interface ActivityContentGoalReopening {
  __typename: "activity_content_goal_reopening";
  companyId?: string | null;
  goalId?: string | null;
  message?: string | null;
  goal?: Goal | null;
}

export interface ActivityContentGoalReparent {
  __typename: "activity_content_goal_reparent";
  goal?: Goal | null;
  oldParentGoal?: Goal | null;
  newParentGoal?: Goal | null;
}

export interface ActivityContentGoalRetrospectiveAcknowledged {
  __typename: "activity_content_goal_retrospective_acknowledged";
  goal?: Goal | null;
  retrospectiveId?: string | null;
}

export interface ActivityContentGoalReviewerUpdating {
  __typename: "activity_content_goal_reviewer_updating";
  company: Company;
  space: Space;
  goal: Goal;
  oldReviewer: Person;
  newReviewer: Person;
}

export interface ActivityContentGoalSpaceUpdating {
  __typename: "activity_content_goal_space_updating";
  company: Company;
  space: Space;
  goal: Goal;
  oldSpace: Space;
}

export interface ActivityContentGoalStartDateUpdating {
  __typename: "activity_content_goal_start_date_updating";
  company: Company;
  space: Space;
  goal: Goal;
  oldStartDate: string | null;
  newStartDate: string | null;
}

export interface ActivityContentGoalTargetAdding {
  __typename: "activity_content_goal_target_adding";
  company: Company;
  space: Space;
  goal: Goal;
  targetName: string;
}

export interface ActivityContentGoalTargetDeleting {
  __typename: "activity_content_goal_target_deleting";
  company: Company;
  space: Space;
  goal: Goal;
  targetName: string;
}

export interface ActivityContentGoalTargetUpdating {
  __typename: "activity_content_goal_target_updating";
  company: Company;
  space: Space;
  goal: Goal;
  targetName: string;
  oldValue: string;
  newValue: string;
  unit: string;
}

export interface ActivityContentGoalTimeframeEditing {
  __typename: "activity_content_goal_timeframe_editing";
  goal?: Goal | null;
  oldTimeframe?: Timeframe | null;
  newTimeframe?: Timeframe | null;
}

export interface ActivityContentGroupEdited {
  __typename: "activity_content_group_edited";
  company: Company;
  space: Space;
  oldName: string;
  newName: string;
  oldMission: string | null;
  newMission: string | null;
}

export interface ActivityContentGuestInvited {
  __typename: "activity_content_guest_invited";
  company: Company;
  person: Person;
}

export interface ActivityContentKpiAnnotationAdded {
  __typename: "activity_content_kpi_annotation_added";
  space: Space;
  kpi: Kpi | null;
  annotation?: KpiAnnotation | null;
  title: string;
  date: string;
}

export interface ActivityContentKpiAnnotationDeleted {
  __typename: "activity_content_kpi_annotation_deleted";
  space: Space;
  kpi: Kpi | null;
  title: string;
  date: string;
}

export interface ActivityContentKpiAnnotationEdited {
  __typename: "activity_content_kpi_annotation_edited";
  space: Space;
  kpi: Kpi | null;
  annotation?: KpiAnnotation | null;
  oldTitle: string;
  newTitle: string;
  date: string;
}

export interface ActivityContentKpiCreated {
  __typename: "activity_content_kpi_created";
  company: Company;
  space: Space;
  kpi: Kpi;
  champion?: Person | null;
  kpiName: string;
}

export interface ActivityContentKpiEntryCommented {
  __typename: "activity_content_kpi_entry_commented";
  space: Space;
  kpi: Kpi | null;
  entry: KpiEntry | null;
  comment: Comment | null;
}

export interface ActivityContentMessageArchiving {
  __typename: "activity_content_message_archiving";
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
  messageId?: string | null;
  title?: string | null;
}

export interface ActivityContentMilestoneDeleting {
  __typename: "activity_content_milestone_deleting";
  project: Project;
  milestoneName: string;
}

export interface ActivityContentMilestoneDescriptionUpdating {
  __typename: "activity_content_milestone_description_updating";
  project: Project;
  milestone: Milestone | null;
  milestoneName: string;
  hasDescription: boolean;
  description: string | null;
}

export interface ActivityContentMilestoneDueDateUpdating {
  __typename: "activity_content_milestone_due_date_updating";
  project: Project;
  milestone: Milestone | null;
  milestoneName: string;
  oldDueDate: ContextualDate;
  newDueDate: ContextualDate;
}

export interface ActivityContentMilestoneTitleUpdating {
  __typename: "activity_content_milestone_title_updating";
  project: Project;
  milestone: Milestone | null;
  oldTitle: string;
  newTitle: string;
}

export interface ActivityContentProjectArchived {
  __typename: "activity_content_project_archived";
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectChampionUpdating {
  __typename: "activity_content_project_champion_updating";
  company: Company;
  space: Space;
  project: Project;
  oldChampion: Person;
  newChampion: Person;
}

export interface ActivityContentProjectCheckInAcknowledged {
  __typename: "activity_content_project_check_in_acknowledged";
  projectId?: string | null;
  checkInId?: string | null;
  project?: Project | null;
  checkIn?: ProjectCheckIn | null;
}

export interface ActivityContentProjectCheckInCommented {
  __typename: "activity_content_project_check_in_commented";
  project: Project;
  checkIn?: ProjectCheckIn | null;
  comment: Comment | null;
}

export interface ActivityContentProjectCheckInEdit {
  __typename: "activity_content_project_check_in_edit";
  companyId?: string | null;
  projectId?: string | null;
  checkInId?: string | null;
}

export interface ActivityContentProjectCheckInSubmitted {
  __typename: "activity_content_project_check_in_submitted";
  projectId?: string | null;
  checkInId?: string | null;
  project?: Project | null;
  checkIn?: ProjectCheckIn | null;
}

export interface ActivityContentProjectClosed {
  __typename: "activity_content_project_closed";
  project?: Project | null;
}

export interface ActivityContentProjectContributorAddition {
  __typename: "activity_content_project_contributor_addition";
  companyId?: string | null;
  projectId?: string | null;
  personId?: string | null;
  person?: Person | null;
  project?: Project | null;
}

export interface ActivityContentProjectContributorEdited {
  __typename: "activity_content_project_contributor_edited";
  companyId?: string | null;
  projectId?: string | null;
  personId?: string | null;
  project?: Project | null;
  previousContributor?: ActivityContentProjectContributorEditedContributor | null;
  updatedContributor?: ActivityContentProjectContributorEditedContributor | null;
}

export interface ActivityContentProjectContributorEditedContributor {
  personId?: string | null;
  person?: Person | null;
  role?: string | null;
  permissions?: number | null;
}

export interface ActivityContentProjectContributorRemoved {
  __typename: "activity_content_project_contributor_removed";
  companyId?: string | null;
  projectId?: string | null;
  personId?: string | null;
  person?: Person | null;
  project?: Project | null;
}

export interface ActivityContentProjectContributorsAddition {
  __typename: "activity_content_project_contributors_addition";
  project?: Project | null;
  contributors?: ProjectContributorsAdditionContributor[] | null;
}

export interface ActivityContentProjectCreated {
  __typename: "activity_content_project_created";
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectDescriptionChanged {
  __typename: "activity_content_project_description_changed";
  project: Project;
  projectName: string;
  hasDescription: boolean;
  description: string | null;
}

export interface ActivityContentProjectDiscussionSubmitted {
  __typename: "activity_content_project_discussion_submitted";
  title: string | null;
  project: Project;
  discussion: CommentThread | null;
}

export interface ActivityContentProjectDueDateUpdating {
  __typename: "activity_content_project_due_date_updating";
  company: Company;
  space: Space;
  project: Project;
  oldDueDate: string | null;
  newDueDate: string | null;
}

export interface ActivityContentProjectGoalConnection {
  __typename: "activity_content_project_goal_connection";
  project: Project;
  goal: Goal | null;
  goalName: string | null;
  previousGoal: Goal | null;
  previousGoalName: string | null;
}

export interface ActivityContentProjectGoalDisconnection {
  __typename: "activity_content_project_goal_disconnection";
  project?: Project | null;
  goal?: Goal | null;
}

export interface ActivityContentProjectKeyResourceAdded {
  __typename: "activity_content_project_key_resource_added";
  projectId?: string | null;
  project?: Project | null;
  title?: string | null;
}

export interface ActivityContentProjectKeyResourceDeleted {
  __typename: "activity_content_project_key_resource_deleted";
  projectId?: string | null;
  project?: Project | null;
  title?: string | null;
}

export interface ActivityContentProjectMilestoneCommented {
  __typename: "activity_content_project_milestone_commented";
  project: Project;
  milestone: Milestone | null;
  commentAction: string;
  comment: Comment;
}

export interface ActivityContentProjectMilestoneCreation {
  __typename: "activity_content_project_milestone_creation";
  company: Company;
  space: Space;
  project: Project;
  milestone: Milestone | null;
  milestoneName: string;
}

export interface ActivityContentProjectMilestoneUpdating {
  __typename: "activity_content_project_milestone_updating";
  company: Company;
  space: Space;
  project: Project;
  milestone: Milestone;
  oldMilestoneName: string;
  newMilestoneName: string;
  oldTimeframe: Timeframe | null;
  newTimeframe: Timeframe | null;
}

export interface ActivityContentProjectMoved {
  __typename: "activity_content_project_moved";
  project?: Project | null;
  oldSpace?: Space | null;
  newSpace?: Space | null;
}

export interface ActivityContentProjectPausing {
  __typename: "activity_content_project_pausing";
  companyId?: string | null;
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectRenamed {
  __typename: "activity_content_project_renamed";
  project?: Project | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface ActivityContentProjectResuming {
  __typename: "activity_content_project_resuming";
  companyId?: string | null;
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectRetrospectiveAcknowledged {
  __typename: "activity_content_project_retrospective_acknowledged";
  projectId?: string | null;
  retrospectiveId?: string | null;
  project?: Project | null;
  retrospective?: ProjectRetrospective | null;
}

export interface ActivityContentProjectRetrospectiveCommented {
  __typename: "activity_content_project_retrospective_commented";
  project: Project;
  comment: Comment | null;
}

export interface ActivityContentProjectReviewAcknowledged {
  projectId?: string | null;
  reviewId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectReviewCommented {
  projectId?: string | null;
  reviewId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectReviewRequestSubmitted {
  projectId?: string | null;
  requestId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectReviewSubmitted {
  projectId?: string | null;
  reviewId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectReviewerUpdating {
  __typename: "activity_content_project_reviewer_updating";
  company: Company;
  space: Space;
  project: Project;
  oldReviewer: Person;
  newReviewer: Person;
}

export interface ActivityContentProjectStartDateUpdating {
  __typename: "activity_content_project_start_date_updating";
  company: Company;
  space: Space;
  project: Project;
  oldStartDate: string | null;
  newStartDate: string | null;
}

export interface ActivityContentProjectTaskCommented {
  __typename: "activity_content_project_task_commented";
  project: Project;
  task: Task | null;
  comment: Comment | null;
}

export interface ActivityContentProjectTimelineEdited {
  __typename: "activity_content_project_timeline_edited";
  project?: Project | null;
  oldStartDate?: string | null;
  newStartDate?: string | null;
  oldEndDate?: string | null;
  newEndDate?: string | null;
  newMilestones?: ActivityMilestone[] | null;
  updatedMilestones?: ActivityMilestone[] | null;
}

export interface ActivityContentResourceHubDocumentCommented {
  __typename: "activity_content_resource_hub_document_commented";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
  comment?: Comment | null;
}

export interface ActivityContentResourceHubDocumentCreated {
  __typename: "activity_content_resource_hub_document_created";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
  copiedDocument?: ResourceHubDocument | null;
}

export interface ActivityContentResourceHubDocumentDeleted {
  __typename: "activity_content_resource_hub_document_deleted";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
}

export interface ActivityContentResourceHubDocumentEdited {
  __typename: "activity_content_resource_hub_document_edited";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
}

export interface ActivityContentResourceHubDocumentVersionRestored {
  __typename: "activity_content_resource_hub_document_version_restored";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
  versionNumber: number;
}

export interface ActivityContentResourceHubFileCommented {
  __typename: "activity_content_resource_hub_file_commented";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  file?: ResourceHubFile | null;
  comment?: Comment | null;
}

export interface ActivityContentResourceHubFileCreated {
  __typename: "activity_content_resource_hub_file_created";
  goal?: Goal | null;
  project?: Project | null;
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  files?: ResourceHubFile[] | null;
}

export interface ActivityContentResourceHubFileDeleted {
  __typename: "activity_content_resource_hub_file_deleted";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  file?: ResourceHubFile | null;
}

export interface ActivityContentResourceHubFileEdited {
  __typename: "activity_content_resource_hub_file_edited";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  file?: ResourceHubFile | null;
}

export interface ActivityContentResourceHubFolderCopied {
  __typename: "activity_content_resource_hub_folder_copied";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
  originalFolder?: ResourceHubFolder | null;
}

export interface ActivityContentResourceHubFolderCreated {
  __typename: "activity_content_resource_hub_folder_created";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
}

export interface ActivityContentResourceHubFolderDeleted {
  __typename: "activity_content_resource_hub_folder_deleted";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
}

export interface ActivityContentResourceHubFolderRenamed {
  __typename: "activity_content_resource_hub_folder_renamed";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface ActivityContentResourceHubLinkCommented {
  __typename: "activity_content_resource_hub_link_commented";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  link?: ResourceHubLink | null;
  comment?: Comment | null;
}

export interface ActivityContentResourceHubLinkCreated {
  __typename: "activity_content_resource_hub_link_created";
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  link?: ResourceHubLink | null;
}

export interface ActivityContentResourceHubLinkDeleted {
  __typename: "activity_content_resource_hub_link_deleted";
  goal?: Goal | null;
  project?: Project | null;
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  link?: ResourceHubLink | null;
}

export interface ActivityContentResourceHubLinkEdited {
  __typename: "activity_content_resource_hub_link_edited";
  goal?: Goal | null;
  project?: Project | null;
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  link?: ResourceHubLink | null;
  previousName?: string | null;
  previousType?: string | null;
  previousUrl?: string | null;
}

export interface ActivityContentSpaceAdded {
  __typename: "activity_content_space_added";
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
}

export interface ActivityContentSpaceJoining {
  __typename: "activity_content_space_joining";
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
}

export interface ActivityContentSpaceMemberRemoved {
  __typename: "activity_content_space_member_removed";
  space?: Space | null;
  member?: Person | null;
}

export interface ActivityContentSpaceMembersAdded {
  __typename: "activity_content_space_members_added";
  space?: Space | null;
  members?: Person[] | null;
}

export interface ActivityContentSpaceTaskCommented {
  __typename: "activity_content_space_task_commented";
  space: Space;
  task: Task | null;
  comment: Comment | null;
}

export interface ActivityContentTaskAdding {
  __typename: "activity_content_task_adding";
  space: Space;
  project: Project | null;
  milestone: Milestone | null;
  task: Task | null;
  taskName: string;
}

export interface ActivityContentTaskAssigneeAssignment {
  __typename: "activity_content_task_assignee_assignment";
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  personId?: string | null;
}

export interface ActivityContentTaskAssigneeUpdating {
  __typename: "activity_content_task_assignee_updating";
  space: Space;
  project: Project | null;
  task: Task | null;
  oldAssignee: Person;
  newAssignee: Person;
  addedAssignees: Person[];
  removedAssignees: Person[];
}

export interface ActivityContentTaskClosing {
  __typename: "activity_content_task_closing";
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
}

export interface ActivityContentTaskCommentDeleting {
  __typename: "activity_content_task_comment_deleting";
  space: Space;
  project?: Project | null;
  task: Task | null;
  taskName: string;
  commentId: string;
}

export interface ActivityContentTaskDeleting {
  __typename: "activity_content_task_deleting";
  company: Company;
  space: Space;
  project: Project | null;
  taskName: string;
}

export interface ActivityContentTaskDescriptionChange {
  __typename: "activity_content_task_description_change";
  task: Task | null;
  space: Space | null;
  projectName: string;
  hasDescription: boolean;
  description: string | null;
}

export interface ActivityContentTaskDueDateUpdating {
  __typename: "activity_content_task_due_date_updating";
  space: Space;
  project: Project | null;
  task: Task | null;
  taskName: string | null;
  oldDueDate: ContextualDate;
  newDueDate: ContextualDate;
}

export interface ActivityContentTaskMilestoneUpdating {
  __typename: "activity_content_task_milestone_updating";
  project: Project;
  task: Task | null;
  oldMilestone: Milestone | null;
  newMilestone: Milestone | null;
}

export interface ActivityContentTaskMoving {
  __typename: "activity_content_task_moving";
  task: Task | null;
  taskName: string;
  originType: TaskType;
  destinationType: TaskType;
  originProject: Project | null;
  originSpace: Space | null;
  destinationProject: Project | null;
  destinationSpace: Space | null;
}

export interface ActivityContentTaskNameEditing {
  __typename: "activity_content_task_name_editing";
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface ActivityContentTaskNameUpdating {
  __typename: "activity_content_task_name_updating";
  space: Space;
  project: Project | null;
  task: Task | null;
  oldName: string;
  newName: string;
}

export interface ActivityContentTaskPriorityChange {
  __typename: "activity_content_task_priority_change";
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  oldPriority?: string | null;
  newPriority?: string | null;
}

export interface ActivityContentTaskReopening {
  __typename: "activity_content_task_reopening";
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
}

export interface ActivityContentTaskSizeChange {
  __typename: "activity_content_task_size_change";
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  oldSize?: string | null;
  newSize?: string | null;
}

export interface ActivityContentTaskStatusChange {
  __typename: "activity_content_task_status_change";
  companyId?: string | null;
  taskId?: string | null;
  status?: string | null;
}

export interface ActivityContentTaskStatusUpdating {
  __typename: "activity_content_task_status_updating";
  space: Space;
  project: Project | null;
  task: Task | null;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  name: string;
}

export interface ActivityContentTaskUpdate {
  __typename: "activity_content_task_update";
  companyId?: string | null;
  taskId?: string | null;
  name?: string | null;
}

export interface ActivityEventDataCommentPost {
  updateId?: string | null;
}

export interface ActivityEventDataMilestoneCreate {
  title?: string | null;
}

export interface ActivityEventDataProjectCreate {
  champion?: Person | null;
}

export interface ActivityMilestone {
  __typename: "activity_milestone";
  id: string;
  title: string;
  deadlineAt: string;
}

export interface ActivityPermissions {
  __typename: "activity_permissions";
  canCommentOnThread?: boolean | null;
  canView?: boolean | null;
  canAcknowledge?: boolean | null;
}

export interface AddMemberInput {
  id: Id;
  accessLevel: AccessOptionsInt;
}

export interface ApiToken {
  __typename: "api_token";
  id: Id;
  readOnly: boolean;
  name?: string | null;
  insertedAt: string;
  lastUsedAt?: string | null;
}

export interface Assignment {
  type?: string | null;
  due?: string | null;
  resource?: AssignmentResource | null;
}

export interface Assignments {
  assignments?: Assignment[] | null;
}

export interface BillingAccessStateLimit {
  code: string;
  limitKey: string;
  planKey?: string | null;
  currentUsage: number;
  requestedDelta: number;
  projectedUsage: number;
  limit?: number | null;
  remaining?: number | null;
  nearLimit: boolean;
  blocked: boolean;
  enforced: boolean;
}

export interface BillingAccount {
  __typename: "billing_account";
  provider: string;
  planKey?: string | null;
  billingInterval?: BillingInterval | null;
  status: BillingStatus;
  suggestedPlanKey?: string | null;
  suggestedBillingInterval?: BillingInterval | null;
  suggestedPlanSource?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlanKey?: string | null;
  pendingBillingInterval?: BillingInterval | null;
  pendingCheckoutStartedAt?: string | null;
  scheduledPlanKey?: string | null;
  scheduledBillingInterval?: BillingInterval | null;
  scheduledChangeEffectiveAt?: string | null;
  lastSyncedAt?: string | null;
  accessState: BillingAccessState;
  accessStateReason?: BillingAccessStateReason | null;
  accessStateStartedAt?: string | null;
  accessStateEndsAt?: string | null;
}

export interface BillingCatalogProduct {
  __typename: "billing_catalog_product";
  id: string;
  provider: string;
  planFamily: string;
  billingInterval: BillingInterval;
  polarProductId: string;
  polarProductName?: string | null;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  version: number;
  active: boolean;
  archivedAt?: string | null;
  lastSyncedAt?: string | null;
  insertedAt: string;
  updatedAt: string;
}

export interface BillingCheckoutSession {
  __typename: "billing_checkout_session";
  provider: string;
  id: string;
  url: string;
  returnUrl: string;
  successUrl: string;
  expiresAt: string;
}

export interface BillingCompanyAccessState {
  accessState: BillingAccessState;
  accessStateReason?: BillingAccessStateReason | null;
  accessStateStartedAt?: string | null;
  accessStateEndsAt?: string | null;
  memberLimit: BillingAccessStateLimit;
  storageLimit: BillingAccessStateLimit;
}

export interface BillingHostedSession {
  __typename: "billing_hosted_session";
  provider: string;
  url: string;
  returnUrl: string;
  expiresAt?: string | null;
}

export interface BillingLimitStatus {
  code: string;
  limitKey: string;
  planKey?: string | null;
  currentUsage: number;
  requestedDelta: number;
  projectedUsage: number;
  limit?: number | null;
  remaining?: number | null;
  nearLimit: boolean;
  blocked: boolean;
  enforced: boolean;
  recommendedUpgrade?: BillingRecommendedUpgrade | null;
}

export interface BillingLimitWarnings {
  memberLimit: BillingLimitStatus;
  storageLimit: BillingLimitStatus;
}

export interface BillingOverview {
  __typename: "billing_overview";
  account: BillingAccount;
  plans: BillingPlanDefinition[];
  catalogProducts: BillingCatalogProduct[];
  memberCount: number;
  storageUsageBytes: number;
  stale: boolean;
}

export interface BillingPlanDefinition {
  __typename: "billing_plan_definition";
  key: string;
  displayName: string;
  tierRank: number;
  customerSelectable: boolean;
  memberLimit?: number | null;
  storageLimitBytes?: number | null;
}

export interface BillingRecommendedUpgrade {
  planKey?: string | null;
  billingInterval?: BillingInterval | null;
  source?: string | null;
}

export interface Blob {
  __typename: "blob";
  id?: string | null;
  status?: string | null;
  filename?: string | null;
  size?: number | null;
  contentType?: string | null;
  height?: number | null;
  width?: number | null;
  url?: string | null;
}

export interface BlobCreationInput {
  filename?: string | null;
  size?: number | null;
  contentType?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface BlobCreationOutput {
  id?: string | null;
  url?: string | null;
  signedUploadUrl?: string | null;
  uploadStrategy?: string | null;
}

export interface Comment {
  __typename: "comment";
  id?: string | null;
  insertedAt?: string | null;
  content?: string | null;
  author?: Person | null;
  reactions?: Reaction[] | null;
  notification?: Notification | null;
}

export interface CommentThread {
  __typename: "comment_thread";
  id: string;
  insertedAt: string;
  title: string | null;
  message: string | null;
  reactions?: Reaction[] | null;
  comments?: Comment[] | null;
  commentsCount?: number | null;
  author?: Person | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[];
  project?: Project;
  projectPermissions?: ProjectPermissions;
  space?: Space;
  canComment?: boolean;
  acknowledgedAt?: string | null;
  acknowledgedBy?: Person | null;
}

export interface Company {
  __typename: "company";
  id: string;
  name: string;
  mission?: string | null;
  setupCompleted: boolean;
  trustedEmailDomains?: string[] | null;
  enabledExperimentalFeatures?: string[] | null;
  companySpaceId?: string | null;
  admins?: Person[] | null;
  owners?: Person[] | null;
  people?: Person[] | null;
  memberCount?: number | null;
  permissions?: CompanyPermissions | null;
  generalSpace?: Space;
}

export interface CompanyExportRun {
  __typename: "company_export_run";
  id: Id;
  company?: Company;
  requestedBy?: Account;
  status: string;
  currentStep?: string;
  percentage?: number;
  tablesCount?: number;
  rowsCount?: number;
  packageBlobId?: Id;
  packageDownloadUrl?: string;
  packageSizeBytes?: number;
  errorMessage?: string;
  insertedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CompanyImportRun {
  __typename: "company_import_run";
  id: Id;
  company?: Company;
  requestedBy?: Account;
  status: string;
  currentStep?: string;
  percentage?: number;
  tablesCount?: number;
  rowsCount?: number;
  packageBlobId?: Id;
  errorMessage?: string;
  validationErrors?: Json;
  manifestSummary?: Json;
  insertedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CompanyPermissions {
  __typename: "company_permissions";
  canView: boolean;
  isAdmin: boolean;
  canManageBilling: boolean;
  canEditTrustedEmailDomains: boolean;
  canInviteMembers: boolean;
  canEditMembers: boolean;
  canRemoveMembers: boolean;
  canEditDetails: boolean;
  canCreateSpace: boolean;
  canManageAdmins: boolean;
  canManageOwners: boolean;
  canEditMembersAccessLevels: boolean;
}

export interface ContextualDate {
  __typename: "contextual_date";
  dateType: ContextualDateType;
  value: string;
  date: string;
}

export interface CreateTargetInput {
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  index?: number | null;
}

export interface DeletedStatusReplacement {
  deletedStatusId: string;
  replacementStatusId: string;
}

export interface Discussion {
  __typename: "discussion";
  id: string;
  insertedAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  state: DiscussionState;
  author?: Person | null;
  title: string;
  body?: string | null;
  space?: Space | null;
  reactions?: Reaction[] | null;
  comments?: Comment[] | null;
  commentsCount?: number | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
  permissions?: SpacePermissions | null;
}

export interface DocumentVersion {
  __typename: "document_version";
  id: string;
  versionNumber: number;
  title: string;
  editor?: Person | null;
  origin: string;
  restoredFromVersionNumber?: number | null;
  insertedAt: string;
  isCurrent: boolean;
  titleChanged: boolean;
  contentChanged: boolean;
  content?: Json | null;
}

export interface EditCompanyMemberPermissionsInput {
  id: Id;
  accessLevel: AccessOptions;
}

export interface EditMemberPermissionsInput {
  id: Id;
  accessLevel: AccessOptionsInt;
}

export interface EditMilestoneOrderingStateInput {
  milestoneId: Id;
  orderingState: string[];
}

export interface EditProjectTimelineMilestoneUpdateInput {
  id: string;
  title: string;
  description: string | null;
  dueDate: ContextualDate;
}

export interface EditProjectTimelineNewMilestoneInput {
  title: string;
  description: string | null;
  dueDate: ContextualDate;
}

export interface Goal {
  __typename: "goal";
  id: string;
  url?: string;
  name: string;
  status: GoalStatus;
  insertedAt?: string | null;
  updatedAt?: string | null;
  nextUpdateScheduledAt?: string | null;
  parentGoalId?: string | null;
  closedAt?: string | null;
  timeframe?: Timeframe | null;
  description?: string | null;
  champion?: Person | null;
  reviewer?: Person | null;
  closedBy?: Person | null;
  targets?: Target[] | null;
  projects?: Project[] | null;
  resourceHub?: ResourceHub | null;
  parentGoal?: Goal | null;
  progressPercentage?: number | null;
  lastCheckInId?: Id | null;
  lastCheckIn?: GoalProgressUpdate | null;
  permissions?: GoalPermissions | null;
  isArchived?: boolean | null;
  isClosed?: boolean | null;
  archivedAt?: string | null;
  isOutdated?: boolean | null;
  space?: Space | null;
  myRole?: string | null;
  accessLevels?: AccessLevels | null;
  privacy?: GoalPrivacyValues | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
  success?: boolean | null;
  retrospective?: GoalRetrospective | null;
  checklist?: GoalCheck[];
}

export interface GoalCheck {
  __typename: "goal_check";
  id: Id;
  name: string;
  completed: boolean;
  index: number;
  insertedAt: string;
  updatedAt: string;
}

export interface GoalCheckUpdate {
  id: Id;
  name: string;
  completed: boolean;
  index: number;
}

export interface GoalChildrenCount {
  discussionsCount: number;
  checkInsCount: number;
  docsAndFilesCount: number;
}

export interface GoalDiscussion {
  __typename: "goal_discussion";
  id: Id;
  title: string;
  insertedAt: string;
  commentCount: number;
  author: Person;
  activityId: Id;
  content: string;
}

export interface GoalEditingUpdatedTarget {
  id?: string | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface GoalPermissions {
  __typename: "goal_permissions";
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  hasFullAccess: boolean;
}

export interface GoalProgressUpdate {
  __typename: "goal_progress_update";
  id: string;
  status?: GoalCheckInStatus | null;
  state: CheckInState;
  message?: string | null;
  insertedAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  author?: Person | null;
  acknowledged?: boolean | null;
  acknowledgedAt?: string | null;
  acknowledgingPerson?: Person | null;
  reactions?: Reaction[] | null;
  goalTargetUpdates?: GoalTargetUpdates[] | null;
  checklist?: GoalCheckUpdate[] | null;
  commentsCount?: number | null;
  goal?: Goal | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
  timeframe?: Timeframe | null;
  permissions?: GoalUpdatePermissions | null;
}

export interface GoalRetrospective {
  __typename: "goal_retrospective";
  id: Id;
  title: string;
  insertedAt: string;
  commentCount: number;
  author: Person;
  content: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: Person | null;
}

export interface GoalTargetUpdates {
  id?: string | null;
  index?: number | null;
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  value?: number | null;
  previousValue?: number | null;
}

export interface GoalUpdatePermissions {
  __typename: "goal_update_permissions";
  canView?: boolean | null;
  canEdit?: boolean | null;
  canDelete?: boolean | null;
  canAcknowledge?: boolean | null;
  canComment?: boolean | null;
}

export interface InviteLink {
  __typename: "invite_link";
  id?: string | null;
  token?: string | null;
  type?: string | null;
  companyId?: string | null;
  author?: Person | null;
  company?: Company | null;
  expiresAt?: string | null;
  useCount?: number | null;
  isActive?: boolean | null;
  insertedAt?: string | null;
  allowedDomains?: string[] | null;
}

export interface Kpi {
  __typename: "kpi";
  id: Id;
  name: string;
  unit: string;
  cadence: string;
  spaceId: Id;
  description?: string | null;
  champion?: Person | null;
  latestEntry?: KpiEntry | null;
  entries?: KpiEntry[] | null;
  annotations?: KpiAnnotation[] | null;
  subscriptionList?: SubscriptionList | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface KpiAnnotation {
  __typename: "kpi_annotation";
  id: Id;
  date: string;
  title: string;
  createdBy?: Person | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface KpiEntry {
  __typename: "kpi_entry";
  id: Id;
  value: number;
  period: string;
  recordedBy?: Person | null;
  commentsCount?: number | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface McpGrant {
  __typename: "mcp_grant";
  id: Id;
  clientId: string;
  clientName: string;
  clientUri?: string | null;
  scopes: string[];
  insertedAt: string;
  lastUsedAt?: string | null;
}

export interface MessagesBoard {
  __typename: "messages_board";
  id?: string | null;
  name?: string | null;
  description?: string | null;
  messages?: Discussion[] | null;
  space?: Space | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface Milestone {
  __typename: "milestone";
  id: string;
  url?: string;
  project?: Project | null;
  creator?: Person | null;
  title: string;
  status: MilestoneStatus;
  insertedAt: string;
  timeframe: Timeframe | null;
  completedAt: string;
  description?: string | null;
  comments?: MilestoneComment[] | null;
  commentsCount?: number | null;
  tasksKanbanState?: Json | null;
  tasksOrderingState?: string[] | null;
  permissions?: ProjectPermissions | null;
  subscriptionList?: SubscriptionList | null;
  space?: Space | null;
  availableStatuses?: TaskStatus[] | null;
}

export interface MilestoneComment {
  __typename: "milestone_comment";
  action: MilestoneCommentAction;
  comment: Comment;
}

export interface MilestoneOpenTasksResolutionInput {
  action: MilestoneOpenTasksResolutionAction;
  statusId?: string | null;
}

export interface Notification {
  __typename: "notification";
  id: string;
  read: boolean;
  readAt: string | null;
  insertedAt: string;
  activity?: Activity | null;
}

export interface Panel {
  id?: string | null;
  type?: string | null;
  index?: number | null;
  linkedResource?: PanelLinkedResource | null;
}

export interface Person {
  __typename: "person";
  id: string;
  url?: string;
  fullName: string;
  title: string;
  avatarUrl: string | null;
  avatarBlobId?: string | null;
  email: string;
  type: string;
  description?: string | null;
  timezone?: string | null;
  timeFormat?: TimeFormat;
  emailPreference?: EmailPreferenceValues;
  emailWindowMinutes?: EmailWindowMinutes;
  sendDailySummary?: boolean;
  dailySummaryDeliveryTime?: string;
  notifyOnMention?: boolean;
  notifyAboutAssignments?: boolean;
  suspended?: boolean | null;
  company?: Company | null;
  manager?: Person | null;
  reports?: Person[] | null;
  peers?: Person[] | null;
  accessLevel?: AccessOptionsInt | null;
  hasOpenInvitation?: boolean | null;
  inviteLink?: InviteLink | null;
  showDevBar?: boolean | null;
  permissions?: PersonPermissions | null;
  dismissedProductReleaseId?: string | null;
}

export interface PersonPermissions {
  __typename: "person_permissions";
  canEditProfile: boolean | null;
}

export interface ProductRelease {
  __typename: "product_release";
  id: string;
  version?: string | null;
  title: string;
  publishedAt: string;
  teaser?: string | null;
}

export interface Project {
  __typename: "project";
  id: string;
  url?: string;
  name: string;
  insertedAt?: string | null;
  updatedAt?: string | null;
  timeframe?: Timeframe;
  nextUpdateScheduledAt?: string | null;
  nextCheckInScheduledAt?: string | null;
  privacy?: string | null;
  status: string;
  state?: WorkMapItemState;
  successStatus: SuccessStatus;
  closedAt?: string | null;
  retrospective?: ProjectRetrospective | null;
  description?: string | null;
  goalId: string;
  goal?: Goal | null;
  lastCheckIn?: ProjectCheckIn | null;
  milestones?: Milestone[] | null;
  contributors?: ProjectContributor[] | null;
  isOutdated?: boolean | null;
  spaceId: string;
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  myRole?: string | null;
  permissions?: ProjectPermissions | null;
  nextMilestone?: Milestone | null;
  isPinned?: boolean | null;
  isArchived?: boolean | null;
  archivedAt?: string | null;
  champion?: Person | null;
  reviewer?: Person | null;
  accessLevels?: AccessLevels | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
  subscriptionList?: SubscriptionList | null;
  milestonesOrderingState?: string[] | null;
  taskStatuses?: TaskStatus[] | null;
  tasksKanbanState?: Json | null;
  tasksView?: ProjectTasksView | null;
}

export interface ProjectCheckIn {
  __typename: "project_check_in";
  id: string;
  status: ProjectCheckInStatus;
  state: CheckInState;
  insertedAt: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt?: string | null;
  description: string | null;
  author: Person | null;
  project: Project | null;
  space: Space | null;
  acknowledgedAt: string | null;
  acknowledgedBy: Person | null;
  reactions?: Reaction[] | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
  commentsCount?: number | null;
}

export interface ProjectChildrenCount {
  tasksCount: number;
  discussionsCount: number;
  checkInsCount: number;
  docsAndFilesCount: number;
}

export interface ProjectContributor {
  __typename: "project_contributor";
  id: string;
  responsibility: string | null;
  role: ProjectContributorRole | null;
  person?: Person | null;
  accessLevel: AccessOptionsInt | null;
  project?: Project | null;
  permissions?: ProjectPermissions;
}

export interface ProjectContributorInput {
  personId: Id;
  responsibility: string | null;
  accessLevel: AccessOptions;
}

export interface ProjectContributorsAdditionContributor {
  person?: Person | null;
  responsibility?: string | null;
}

export interface ProjectHealth {
  status?: string | null;
  statusComments?: string | null;
  schedule?: string | null;
  scheduleComments?: string | null;
  budget?: string | null;
  budgetComments?: string | null;
  team?: string | null;
  teamComments?: string | null;
  risks?: string | null;
  risksComments?: string | null;
}

export interface ProjectKeyResource {
  __typename: "project_key_resource";
  id: string;
  projectId: string;
  title: string;
  link: string;
  resourceType?: string;
}

export interface ProjectPermissions {
  __typename: "project_permissions";
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  hasFullAccess: boolean;
}

export interface ProjectRetrospective {
  __typename: "project_retrospective";
  id: string;
  author: Person;
  project: Project;
  champion: Person | null;
  reviewer: Person | null;
  content: string;
  closedAt: string;
  permissions: ProjectPermissions;
  reactions: Reaction[];
  subscriptionList: SubscriptionList;
  potentialSubscribers: Subscriber[];
  notifications: Notification[];
  acknowledgedAt?: string | null;
  acknowledgedBy?: Person | null;
}

export interface ProjectReviewRequest {
  id?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  status?: string | null;
  reviewId?: string | null;
  content?: string | null;
  author?: Person | null;
}

export interface ProjectTemplate {
  __typename: "project_template";
  id: string;
  name: string;
  description?: string | null;
  durationDays?: number | null;
  space: Space;
  creator?: Person | null;
  archivedAt?: string | null;
  insertedAt: string;
  updatedAt: string;
  milestoneCount: number;
  taskCount: number;
  inactivePeopleSummary: ProjectTemplateInactivePeopleSummary;
  taskStatuses?: TaskStatus[] | null;
  milestonesOrderingState?: string[] | null;
  tasksKanbanState?: Json | null;
  milestones?: ProjectTemplateMilestone[] | null;
  tasks?: ProjectTemplateTask[] | null;
  people?: ProjectTemplatePerson[] | null;
  taskAssignments?: ProjectTemplateTaskAssignment[] | null;
  discussions?: ProjectTemplateDiscussion[] | null;
  resourceNodes?: ProjectTemplateResourceNode[] | null;
  inactiveDiscussionCount: number;
  permissions?: ProjectTemplatePermissions | null;
}

export interface ProjectTemplateComment {
  __typename: "project_template_comment";
  id: string;
  parentType: ProjectTemplateCommentParentType;
  parentId: string;
  content: string;
  author?: Person | null;
  position: number;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateDiscussion {
  __typename: "project_template_discussion";
  id: string;
  projectTemplateId: string;
  title: string;
  body: string;
  author?: Person | null;
  position: number;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateInactivePeopleSummary {
  personCount: number;
  roleCount: number;
  taskCount: number;
}

export interface ProjectTemplateMilestone {
  __typename: "project_template_milestone";
  id: string;
  projectTemplateId: string;
  title: string;
  description?: string | null;
  dueOffsetDays?: number | null;
  tasksKanbanState: Json;
  tasksOrderingState: string[];
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplatePermissions {
  __typename: "project_template_permissions";
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  hasFullAccess: boolean;
}

export interface ProjectTemplatePerson {
  __typename: "project_template_person";
  id: string;
  person?: Person | null;
  role: ProjectTemplatePersonRole;
  responsibility?: string | null;
  accessLevel: AccessOptionsInt;
  active: boolean;
}

export interface ProjectTemplateResourceDocument {
  __typename: "project_template_resource_document";
  id: string;
  nodeId: string;
  author?: Person | null;
  name: string;
  content: string;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateResourceFile {
  __typename: "project_template_resource_file";
  id: string;
  nodeId: string;
  author?: Person | null;
  name: string;
  description?: string | null;
  blob?: Blob | null;
  previewBlob?: Blob | null;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateResourceFolder {
  __typename: "project_template_resource_folder";
  id: string;
  nodeId: string;
  name: string;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateResourceLink {
  __typename: "project_template_resource_link";
  id: string;
  nodeId: string;
  author?: Person | null;
  name: string;
  url: string;
  description?: string | null;
  type: ProjectTemplateResourceLinkType;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateResourceNode {
  __typename: "project_template_resource_node";
  id: string;
  projectTemplateId: string;
  parentFolderId?: string | null;
  type: ProjectTemplateResourceType;
  position: number;
  folder?: ProjectTemplateResourceFolder | null;
  document?: ProjectTemplateResourceDocument | null;
  file?: ProjectTemplateResourceFile | null;
  link?: ProjectTemplateResourceLink | null;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateScheduleIssue {
  resourceType: ProjectTemplateScheduleResourceType;
  resourceId: string;
  resourceName: string;
  field: ProjectTemplateScheduleField;
  date?: string | null;
  reason: ProjectTemplateScheduleReason;
}

export interface ProjectTemplateTask {
  __typename: "project_template_task";
  id: string;
  projectTemplateId: string;
  projectTemplateMilestoneId?: string | null;
  name: string;
  description: string;
  priority?: string | null;
  size?: string | null;
  dueOffsetDays?: number | null;
  reminders: TaskReminder[];
  taskStatus: TaskStatus;
  insertedAt: string;
  updatedAt: string;
}

export interface ProjectTemplateTaskAssignment {
  __typename: "project_template_task_assignment";
  id: string;
  projectTemplateTaskId: string;
  projectTemplatePersonId: string;
}

export interface ProjectTemplateUploadedFile {
  blobId: Id;
  previewBlobId?: Id | null;
  name: string;
  description?: Json | null;
}

export interface QuickSearchDiscussion {
  id: string;
  title: string;
  context: string;
  url?: string;
}

export interface QuickSearchResource {
  id: string;
  name: string;
  context: string;
  url?: string;
}

export interface Reaction {
  __typename: "reaction";
  id: string;
  emoji: string;
  person: Person | null;
}

export interface ResourceAccessInput {
  resourceType: ResourceAccessTypes;
  resourceId: Id;
  accessLevel: AccessOptions;
}

export interface ResourceHub {
  __typename: "resource_hub";
  id: string;
  name: string;
  description?: string | null;
  space?: Space | null;
  project?: Project | null;
  goal?: Goal | null;
  nodes?: ResourceHubNode[] | null;
  potentialSubscribers?: Subscriber[] | null;
  permissions?: ResourceHubPermissions | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface ResourceHubDocument {
  __typename: "resource_hub_document";
  id: string;
  url?: string;
  author?: Person | null;
  resourceHubId: string;
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  project?: Project | null;
  goal?: Goal | null;
  parentFolder?: ResourceHubFolder | null;
  parentFolderId: string;
  name: string;
  content: string;
  state: DocumentState;
  currentVersion?: number | null;
  versionsCount?: number | null;
  insertedAt: string;
  publishedAt: string | null;
  updatedAt: string;
  permissions?: ResourceHubPermissions | null;
  reactions?: Reaction[] | null;
  commentsCount?: number | null;
  potentialSubscribers?: Subscriber[] | null;
  subscriptionList?: SubscriptionList | null;
  notifications?: Notification[] | null;
  pathToDocument?: ResourceHubFolder[] | null;
}

export interface ResourceHubFile {
  __typename: "resource_hub_file";
  id: string;
  url?: string;
  author?: Person | null;
  resourceHubId?: string | null;
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  project?: Project | null;
  goal?: Goal | null;
  parentFolder?: ResourceHubFolder | null;
  parentFolderId?: string | null;
  name?: string | null;
  description?: string | null;
  potentialSubscribers?: Subscriber[] | null;
  subscriptionList?: SubscriptionList | null;
  insertedAt?: string | null;
  permissions?: ResourceHubPermissions | null;
  reactions?: Reaction[] | null;
  commentsCount?: number | null;
  type: string;
  size?: number | null;
  blob?: Blob | null;
  pathToFile?: ResourceHubFolder[] | null;
}

export interface ResourceHubFolder {
  __typename: "resource_hub_folder";
  id: string;
  url?: string;
  resourceHubId?: string | null;
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  project?: Project | null;
  goal?: Goal | null;
  name?: string | null;
  description?: string | null;
  nodes?: ResourceHubNode[] | null;
  potentialSubscribers?: Subscriber[] | null;
  permissions?: ResourceHubPermissions | null;
  pathToFolder?: ResourceHubFolder[] | null;
  childrenCount?: number | null;
  parentFolderId?: string | null;
}

export interface ResourceHubLink {
  __typename: "resource_hub_link";
  id: string;
  author?: Person | null;
  resourceHubId?: string | null;
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  project?: Project | null;
  goal?: Goal | null;
  parentFolder?: ResourceHubFolder | null;
  parentFolderId?: string | null;
  name: string;
  url: string;
  pageUrl?: string;
  description?: string | null;
  type: ResourceHubLinkType;
  potentialSubscribers?: Subscriber[] | null;
  subscriptionList?: SubscriptionList | null;
  insertedAt?: string | null;
  permissions?: ResourceHubPermissions | null;
  reactions?: Reaction[] | null;
  pathToLink?: ResourceHubFolder[] | null;
  notifications?: Notification[] | null;
  commentsCount?: number | null;
}

export interface ResourceHubNode {
  __typename: "resource_hub_node";
  id?: string | null;
  name?: string | null;
  type?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  folder?: ResourceHubFolder | null;
  document?: ResourceHubDocument | null;
  file?: ResourceHubFile | null;
  link?: ResourceHubLink | null;
}

export interface ResourceHubPermissions {
  __typename: "resource_hub_permissions";
  canCommentOnDocument?: boolean | null;
  canCommentOnFile?: boolean | null;
  canCommentOnLink?: boolean | null;
  canCopyFolder?: boolean | null;
  canCreateDocument?: boolean | null;
  canCreateFolder?: boolean | null;
  canCreateFile?: boolean | null;
  canCreateLink?: boolean | null;
  canDeleteDocument?: boolean | null;
  canDeleteFile?: boolean | null;
  canDeleteFolder?: boolean | null;
  canDeleteLink?: boolean | null;
  canEditDocument?: boolean | null;
  canEditParentFolder?: boolean | null;
  canEditFile?: boolean | null;
  canEditLink?: boolean | null;
  canRenameFolder?: boolean | null;
  canView?: boolean | null;
}

export interface ResourceHubUploadedFile {
  blobId?: string | null;
  previewBlobId?: string | null;
  name?: string | null;
  description?: string | null;
}

export interface ReviewAssignment {
  __typename: "review_assignment";
  resourceId: string;
  name: string;
  due: string | null;
  type: ReviewAssignmentTypes;
  role: ReviewAssignmentRoles;
  actionLabel: string | null;
  path: string;
  origin: ReviewAssignmentOrigin;
  taskStatus: string | null;
  authorId: string | null;
  authorName: string | null;
  description: string | null;
  dueDate: string | null;
  dueStatus: ReviewAssignmentDueStatus | null;
  dueStatusLabel: string | null;
}

export interface ReviewAssignmentGroup {
  __typename: "review_assignment_group";
  origin: ReviewAssignmentOrigin;
  assignments: ReviewAssignment[];
}

export interface ReviewAssignmentOrigin {
  __typename: "review_assignment_origin";
  id: string;
  name: string;
  type: ReviewAssignmentOriginTypes;
  path: string;
  spaceName: string | null;
  dueDate: string | null;
}

export interface SearchNavigationTarget {
  resourceHubId?: string | null;
  folderId?: string | null;
  documentId?: string | null;
  fileId?: string | null;
  linkId?: string | null;
  spaceId?: string | null;
  projectId?: string | null;
  goalId?: string | null;
  milestoneId?: string | null;
  taskId?: string | null;
  personId?: string | null;
  discussionId?: string | null;
  projectCheckInId?: string | null;
  goalCheckInId?: string | null;
  projectRetrospectiveId?: string | null;
}

export interface SearchResult {
  __typename: "result";
  id: string;
  url?: string;
  type: SearchResultType;
  title: string;
  context: string;
  matchedField: SearchMatchedField;
  snippet?: string | null;
  state?: SearchResultState | null;
  insertedAt: string;
  navigationTarget: SearchNavigationTarget;
}

export interface SiteMessage {
  __typename: "site_message";
  id: string;
  title: string;
  description: string;
  allCompanies?: boolean;
  active?: boolean;
  expiresAt?: string;
  companyIds?: string[];
  insertedAt?: string;
  updatedAt?: string;
}

export interface Space {
  __typename: "space";
  id: string;
  url?: string;
  name: string;
  mission?: string | null;
  isMember?: boolean | null;
  isCompanySpace?: boolean | null;
  privateSpace?: boolean | null;
  icon?: string | null;
  color?: string | null;
  permissions?: SpacePermissions | null;
  members?: Person[] | null;
  accessLevels?: AccessLevels | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
  taskStatuses?: TaskStatus[] | null;
  tasksKanbanState?: Json | null;
}

export interface SpacePermissions {
  __typename: "space_permissions";
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  hasFullAccess: boolean;
}

export interface SpaceSetupInput {
  name: string;
  description: string;
}

export interface SpaceTools {
  __typename: "space_tools";
  tasksEnabled: boolean;
  discussionsEnabled: boolean;
  resourceHubEnabled: boolean;
  kpisEnabled: boolean;
  templatesEnabled: boolean;
  projects: Project[] | null;
  goals: Goal[] | null;
  messagesBoards: MessagesBoard[] | null;
  resourceHubs: ResourceHub[] | null;
  tasks: Task[] | null;
  kpis: Kpi[] | null;
  templates: ProjectTemplate[] | null;
}

export interface Subscriber {
  __typename: "subscriber";
  role?: string | null;
  priority?: boolean | null;
  isSubscribed?: boolean | null;
  person?: Person | null;
}

export interface Subscription {
  __typename: "subscription";
  id: string;
  type: string;
  canceled: boolean;
  person: Person | null;
}

export interface SubscriptionList {
  __typename: "subscription_list";
  id: string;
  parentType: SubscriptionParentType;
  sendToEveryone: boolean;
  subscriptions: Subscription[] | null;
}

export interface Target {
  __typename: "target";
  id?: Id | null;
  index?: number | null;
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  value?: number | null;
}

export interface Task {
  __typename: "task";
  id: string;
  url?: string;
  name: string;
  insertedAt?: string | null;
  updatedAt?: string | null;
  closedAt?: string | null;
  dueDate?: ContextualDate | null;
  reminders?: TaskReminder[] | null;
  size?: string | null;
  priority?: string | null;
  status?: TaskStatus | null;
  milestone?: Milestone | null;
  project?: Project | null;
  description?: string | null;
  assignees?: Person[] | null;
  creator?: Person | null;
  projectSpace?: Space | null;
  space?: Space | null;
  permissions?: ProjectPermissions | null;
  commentsCount?: number | null;
  subscriptionList?: SubscriptionList | null;
  availableStatuses?: TaskStatus[] | null;
  type: TaskType;
}

export interface TaskReminder {
  __typename: "task_reminder";
  type: TaskReminderType;
  days?: number | null;
  date?: string | null;
}

export interface TaskStatus {
  __typename: "task_status";
  id: string;
  label: string;
  color: ProjectTaskStatusColor;
  index: number;
  value: string;
  closed: boolean;
}

export interface Timeframe {
  __typename: "timeframe";
  contextualStartDate: ContextualDate | null;
  contextualEndDate: ContextualDate | null;
}

export interface Update {
  id?: string | null;
  title?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  acknowledged?: boolean | null;
  acknowledgedAt?: string | null;
  updatableId?: string | null;
  project?: Project | null;
  acknowledgingPerson?: Person | null;
  message?: string | null;
  messageType?: string | null;
  comments?: Comment[] | null;
  author?: Person | null;
  reactions?: Reaction[] | null;
  content?: UpdateContent | null;
  commentsCount?: number | null;
}

export interface UpdateContentMessage {
  message?: string | null;
}

export interface UpdateContentProjectContributorAdded {
  contributorId?: string | null;
  contributorRole?: string | null;
  contributor?: Person | null;
}

export interface UpdateContentProjectContributorRemoved {
  contributor?: Person | null;
  contributorId?: string | null;
  contributorRole?: string | null;
}

export interface UpdateContentProjectCreated {
  creatorRole?: string | null;
  creator?: Person | null;
  champion?: Person | null;
}

export interface UpdateContentProjectDiscussion {
  title?: string | null;
  body?: string | null;
}

export interface UpdateContentProjectEndTimeChanged {
  oldEndTime?: string | null;
  newEndTime?: string | null;
}

export interface UpdateContentProjectMilestoneCompleted {
  milestone?: Milestone | null;
}

export interface UpdateContentProjectMilestoneCreated {
  milestone?: Milestone | null;
}

export interface UpdateContentProjectMilestoneDeadlineChanged {
  oldDeadline?: string | null;
  newDeadline?: string | null;
  milestone?: Milestone | null;
}

export interface UpdateContentProjectMilestoneDeleted {
  milestone?: Milestone | null;
}

export interface UpdateContentProjectStartTimeChanged {
  oldStartTime?: string | null;
  newStartTime?: string | null;
}

export interface UpdateContentReview {
  survey?: string | null;
  previousPhase?: string | null;
  newPhase?: string | null;
  reviewReason?: string | null;
  reviewRequestId?: string | null;
}

export interface UpdateContentStatusUpdate {
  message?: string | null;
  oldHealth?: string | null;
  newHealth?: string | null;
  nextMilestoneId?: string | null;
  nextMilestoneTitle?: string | null;
  nextMilestoneDueDate?: string | null;
  phase?: string | null;
  phaseStart?: string | null;
  phaseEnd?: string | null;
  projectStartTime?: string | null;
  projectEndTime?: string | null;
  health?: ProjectHealth | null;
}

export interface UpdateSpaceToolsPayload {
  tasksEnabled?: boolean;
  discussionsEnabled?: boolean;
  resourceHubEnabled?: boolean;
  kpisEnabled?: boolean;
  templatesEnabled?: boolean;
}

export interface UpdateTargetInput {
  id?: Id | null;
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  index?: number | null;
}

export interface WorkMapItem {
  __typename: "work_map_item";
  id: string;
  parentId: string | null;
  name: string;
  state: WorkMapItemState;
  status: WorkMapItemStatus;
  taskStatus: TaskStatus | null;
  progress: number | null;
  space: Space | null;
  spacePath: string | null;
  project: Project | null;
  projectPath: string | null;
  owner: Person | null;
  ownerPath: string | null;
  reviewer: Person | null;
  reviewerPath: string | null;
  nextStep: string;
  isNew: boolean;
  completedOn: string | null;
  timeframe: Timeframe | null;
  assignedAt: string | null;
  milestones: WorkMapMilestone[];
  targets: Target[];
  checklist: GoalCheck[];
  children: WorkMapItem[];
  type: WorkMapItemType;
  itemPath: string;
  privacy: WorkMapItemPrivacy;
  assignees?: Person[] | null;
}

export interface WorkMapMilestone {
  __typename: "work_map_milestone";
  id: string;
  title: string;
  status: MilestoneStatus;
  timeframe: Timeframe | null;
}

export type ActivityContent =
  | ActivityContentCompanyOwnersAdding
  | ActivityContentCompanyAdminAdded
  | ActivityContentCompanyMembersPermissionsEdited
  | ActivityContentCompanyMemberAdded
  | ActivityContentCompanyMemberJoined
  | ActivityContentCompanyMemberConvertedToGuest
  | ActivityContentGuestInvited
  | ActivityContentCompanyEditing
  | ActivityContentCommentAdded
  | ActivityContentDiscussionCommentSubmitted
  | ActivityContentDiscussionEditing
  | ActivityContentDiscussionPosting
  | ActivityContentKpiCreated
  | ActivityContentKpiEntryCommented
  | ActivityContentKpiAnnotationAdded
  | ActivityContentKpiAnnotationEdited
  | ActivityContentKpiAnnotationDeleted
  | ActivityContentGoalArchived
  | ActivityContentGoalCheckIn
  | ActivityContentGoalCheckInAcknowledgement
  | ActivityContentGoalCheckInEdit
  | ActivityContentGoalClosing
  | ActivityContentGoalRetrospectiveAcknowledged
  | ActivityContentGoalCreated
  | ActivityContentGoalDiscussionCreation
  | ActivityContentGoalDiscussionEditing
  | ActivityContentGoalEditing
  | ActivityContentGoalReopening
  | ActivityContentGoalReparent
  | ActivityContentGoalTimeframeEditing
  | ActivityContentGroupEdited
  | ActivityContentProjectArchived
  | ActivityContentProjectCheckInAcknowledged
  | ActivityContentProjectCheckInCommented
  | ActivityContentProjectCheckInEdit
  | ActivityContentProjectCheckInSubmitted
  | ActivityContentProjectClosed
  | ActivityContentProjectRetrospectiveAcknowledged
  | ActivityContentProjectContributorAddition
  | ActivityContentProjectContributorsAddition
  | ActivityContentProjectContributorEdited
  | ActivityContentProjectContributorRemoved
  | ActivityContentProjectCreated
  | ActivityContentProjectDiscussionSubmitted
  | ActivityContentProjectGoalConnection
  | ActivityContentProjectGoalDisconnection
  | ActivityContentProjectMilestoneCommented
  | ActivityContentProjectDescriptionChanged
  | ActivityContentMilestoneDescriptionUpdating
  | ActivityContentGoalDescriptionChanged
  | ActivityContentProjectMoved
  | ActivityContentProjectPausing
  | ActivityContentProjectRenamed
  | ActivityContentProjectResuming
  | ActivityContentProjectReviewAcknowledged
  | ActivityContentProjectReviewCommented
  | ActivityContentProjectReviewRequestSubmitted
  | ActivityContentProjectDueDateUpdating
  | ActivityContentProjectStartDateUpdating
  | ActivityContentProjectChampionUpdating
  | ActivityContentProjectReviewerUpdating
  | ActivityContentProjectReviewSubmitted
  | ActivityContentProjectTimelineEdited
  | ActivityContentResourceHubDocumentCommented
  | ActivityContentResourceHubDocumentCreated
  | ActivityContentResourceHubDocumentDeleted
  | ActivityContentResourceHubDocumentEdited
  | ActivityContentResourceHubDocumentVersionRestored
  | ActivityContentResourceHubFileCommented
  | ActivityContentResourceHubFileCreated
  | ActivityContentResourceHubFileDeleted
  | ActivityContentResourceHubFileEdited
  | ActivityContentResourceHubFolderCopied
  | ActivityContentResourceHubFolderCreated
  | ActivityContentResourceHubFolderDeleted
  | ActivityContentResourceHubFolderRenamed
  | ActivityContentResourceHubLinkCommented
  | ActivityContentResourceHubLinkCreated
  | ActivityContentResourceHubLinkDeleted
  | ActivityContentResourceHubLinkEdited
  | ActivityContentSpaceTaskCommented
  | ActivityContentSpaceJoining
  | ActivityContentTaskAdding
  | ActivityContentTaskAssigneeAssignment
  | ActivityContentTaskClosing
  | ActivityContentTaskCommentDeleting
  | ActivityContentTaskDescriptionChange
  | ActivityContentTaskNameEditing
  | ActivityContentTaskMoving
  | ActivityContentTaskPriorityChange
  | ActivityContentTaskReopening
  | ActivityContentTaskSizeChange
  | ActivityContentTaskStatusChange
  | ActivityContentTaskStatusUpdating
  | ActivityContentTaskUpdate;

export type ActivityDataUnion =
  | ActivityEventDataProjectCreate
  | ActivityEventDataMilestoneCreate
  | ActivityEventDataCommentPost;

export type ActivityResourceUnion = Project | Update | Milestone | Comment;

export type AssignmentResource = Project | Milestone;

export type PanelLinkedResource = Project;

export type UpdateContent =
  | UpdateContentProjectCreated
  | UpdateContentProjectStartTimeChanged
  | UpdateContentProjectEndTimeChanged
  | UpdateContentProjectContributorAdded
  | UpdateContentProjectContributorRemoved
  | UpdateContentProjectMilestoneCreated
  | UpdateContentProjectMilestoneCompleted
  | UpdateContentProjectMilestoneDeadlineChanged
  | UpdateContentProjectMilestoneDeleted
  | UpdateContentStatusUpdate
  | UpdateContentReview
  | UpdateContentProjectDiscussion
  | UpdateContentMessage;

export type AccessOptions =
  | "no_access"
  | "minimal_access"
  | "view_access"
  | "comment_access"
  | "edit_access"
  | "admin_access"
  | "full_access";

export type AccountTheme = "dark" | "light" | "system";

export type ActivityScopeType = "person" | "company" | "space" | "project" | "milestone" | "task" | "goal";

export type BillingAccessState = "normal" | "payment_grace" | "over_limit_grace" | "read_only";

export type BillingAccessStateReason = "past_due" | "over_limit_after_downgrade";

export type BillingInterval = "monthly" | "yearly";

export type BillingStatus = "free" | "active" | "past_due" | "canceled";

export type CheckInState = "draft" | "scheduled" | "published";

export type CliAuthStatus = "pending" | "authenticated" | "failed" | "no_companies" | "expired";

export type CommentParentType =
  | "project_check_in"
  | "project_retrospective"
  | "project_discussion"
  | "goal_update"
  | "goal_discussion"
  | "message"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link"
  | "space_task"
  | "project_task"
  | "milestone"
  | "kpi_entry";

export type ContextualDateType = "day" | "month" | "quarter" | "year";

export type DiscussionState = "draft" | "scheduled" | "published";

export type DocumentState = "draft" | "published";

export type EmailPreferenceValues = "buffered";

export type GoalCheckInStatus = "on_track" | "caution" | "off_track";

export type GoalPrivacyValues = "public" | "internal" | "confidential" | "secret";

export type GoalStatus =
  | "on_track"
  | "achieved"
  | "missed"
  | "paused"
  | "caution"
  | "off_track"
  | "pending"
  | "outdated";

export type MilestoneCommentAction = "none" | "complete" | "reopen";

export type MilestoneOpenTasksResolutionAction = "move_to_no_milestone" | "set_status";

export type MilestoneStatus = "pending" | "done";

export type ProjectCheckInStatus = "on_track" | "caution" | "off_track";

export type ProjectContributorRole = "champion" | "reviewer" | "contributor";

export type ProjectTaskStatusColor = "gray" | "blue" | "green" | "red";

export type ProjectTasksView = "list" | "board";

export type ProjectTemplateArchiveStatus = "active" | "archived" | "all";

export type ProjectTemplateCommentParentType = "discussion" | "document" | "file" | "link";

export type ProjectTemplatePersonRole = "champion" | "reviewer" | "contributor";

export type ProjectTemplateResourceLinkType =
  | "airtable"
  | "dropbox"
  | "figma"
  | "google"
  | "google_doc"
  | "google_sheet"
  | "google_slides"
  | "notion"
  | "other";

export type ProjectTemplateResourceType = "folder" | "document" | "file" | "link";

export type ProjectTemplateScheduleField = "start_date" | "end_date" | "due_date";

export type ProjectTemplateScheduleReason = "missing" | "before_project_start";

export type ProjectTemplateScheduleResourceType = "project" | "milestone" | "task";

export type ReactionEntityType =
  | "project_check_in"
  | "project_retrospective"
  | "project_discussion"
  | "goal_update"
  | "goal_discussion"
  | "message"
  | "comment"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link";

export type ReactionParentType =
  | "project_check_in"
  | "project_retrospective"
  | "project_discussion"
  | "goal_update"
  | "goal_discussion"
  | "message"
  | "milestone"
  | "project_task"
  | "space_task"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link"
  | "kpi_entry";

export type ResourceAccessTypes = "space" | "goal" | "project";

export type ResourceHubLinkType =
  | "airtable"
  | "dropbox"
  | "figma"
  | "google"
  | "google_doc"
  | "google_sheet"
  | "google_slides"
  | "notion"
  | "other";

export type ReviewAssignmentDueStatus = "overdue" | "due_today" | "due_soon" | "upcoming" | "none";

export type ReviewAssignmentOriginTypes = "project" | "goal" | "space";

export type ReviewAssignmentRoles = "owner" | "reviewer";

export type ReviewAssignmentTypes =
  | "check_in"
  | "goal_update"
  | "space_task"
  | "project_task"
  | "milestone"
  | "kpi_update"
  | "project_retrospective"
  | "goal_retrospective";

export type SearchMatchedField = "title" | "name" | "content" | "description" | "message";

export type SearchResultState = "closed" | "completed" | "archived" | "paused";

export type SearchResultType =
  | "resource_hub_folder"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link"
  | "project"
  | "goal"
  | "milestone"
  | "task"
  | "person"
  | "discussion"
  | "project_check_in"
  | "goal_check_in"
  | "project_retrospective";

export type SearchScopeOptions = "company" | "project" | "space" | "goal" | "resource_hub" | "none";

export type SearchSort = "best_match" | "most_recent";

export type SearchTimeRange = "last_7_days" | "last_30_days" | "last_90_days" | "last_12_months";

export type SubscriptionParentType =
  | "project_check_in"
  | "project_retrospective"
  | "goal_update"
  | "message"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link"
  | "comment_thread"
  | "project"
  | "milestone"
  | "project_task"
  | "space_task"
  | "kpi";

export type SuccessStatus = "achieved" | "missed";

export type TaskReminderType = "before_due" | "due_day" | "overdue" | "on_date";

export type TaskType = "space" | "project";

export type TimeFormat = "automatic" | "hour_12" | "hour_24";

export type WorkMapItemPrivacy = "public" | "internal" | "confidential" | "secret";

export type WorkMapItemState = "active" | "paused" | "closed";

export type WorkMapItemStatus =
  | "on_track"
  | "achieved"
  | "missed"
  | "paused"
  | "caution"
  | "off_track"
  | "pending"
  | "outdated";

export type WorkMapItemType = "project" | "goal";

export type AccessOptionsInt = 0 | 10 | 40 | 70 | 100;

export type EmailWindowMinutes = 5 | 10 | 15 | 30 | 60;

export interface ApiTokensListInput {}

export interface ApiTokensListResult {
  apiTokens: ApiToken[];
}

export interface BillingGetInput {}

export interface BillingGetResult {
  billing: BillingOverview;
}

export interface BillingGetAccessStateInput {}

export interface BillingGetAccessStateResult {
  accessState: BillingCompanyAccessState;
}

export interface BillingGetCatalogInput {}

export interface BillingGetCatalogResult {
  plans: BillingPlanDefinition[];
  catalogProducts: BillingCatalogProduct[];
}

export interface BillingGetLimitWarningsInput {}

export interface BillingGetLimitWarningsResult {
  warnings: BillingLimitWarnings;
}

export interface CliAuthCompanyCreationStatusInput {}

export interface CliAuthCompanyCreationStatusResult {
  configured: boolean;
}

export interface CliAuthStatusInput {}

export interface CliAuthStatusResult {
  status: CliAuthStatus;
  companies: Company[];
  message?: string | null;
}

export interface CommentsListInput {
  entityId: Id;
  entityType: CommentParentType;
}

export interface CommentsListResult {
  comments: Comment[];
}

export interface CompaniesGetInput {
  includePermissions?: boolean;
  includePeople?: boolean;
  includeAdmins?: boolean;
  includeOwners?: boolean;
  includeGeneralSpace?: boolean;
  includeMembersAccessLevels?: boolean;
}

export interface CompaniesGetResult {
  company: Company;
}

export interface CompaniesGetActivityInput {
  id: Id;
  includeUnreadGoalNotifications?: boolean;
  includeUnreadProjectNotifications?: boolean;
  includePermissions?: boolean;
  includeSubscriptionsList?: boolean;
  includePotentialSubscribers?: boolean;
}

export interface CompaniesGetActivityResult {
  activity: Activity;
}

export interface CompaniesGetFlatWorkMapInput {
  spaceId?: Id | null;
  parentGoalId?: Id | null;
  championId?: Id | null;
  reviewerId?: Id | null;
  contributorId?: Id | null;
  onlyCompleted?: boolean | null;
  includeAssignees?: boolean | null;
  includeReviewer?: boolean | null;
  includeTasks?: boolean | null;
}

export interface CompaniesGetFlatWorkMapResult {
  workMap: WorkMapItem[];
}

export interface CompaniesGetWorkMapInput {
  spaceId?: Id | null;
  parentGoalId?: Id | null;
  championId?: Id | null;
  reviewerId?: Id | null;
  contributorId?: Id | null;
  onlyCompleted?: boolean | null;
  includeAssignees?: boolean | null;
  includeReviewer?: boolean | null;
}

export interface CompaniesGetWorkMapResult {
  workMap: WorkMapItem[];
}

export interface CompaniesListInput {
  includeMemberCount?: boolean | null;
  isCompanyOwner?: boolean;
  canManageBilling?: boolean;
}

export interface CompaniesListResult {
  companies: Company[];
}

export interface CompaniesListActivitiesInput {
  scopeId: string;
  scopeType: ActivityScopeType;
  actions: string[];
}

export interface CompaniesListActivitiesResult {
  activities: Activity[];
}

export interface CompaniesQuickSearchInput {
  query: string;
}

export interface CompaniesQuickSearchResult {
  spaces: Space[];
  projects: Project[];
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  people: Person[];
  discussions: QuickSearchDiscussion[];
  folders: QuickSearchResource[];
  documents: QuickSearchResource[];
  files: QuickSearchResource[];
  links: QuickSearchResource[];
}

export interface CompaniesSearchInput {
  query: string;
  spaceIds?: Id[] | null;
  types?: SearchResultType[] | null;
  timeRange?: SearchTimeRange | null;
  sort?: SearchSort | null;
}

export interface CompaniesSearchResult {
  results: SearchResult[];
}

export interface CompanyTransfersGetExportRunInput {
  id: Id;
}

export interface CompanyTransfersGetExportRunResult {
  exportRun: CompanyExportRun;
}

export interface CompanyTransfersGetImportRunInput {
  id: Id;
}

export interface CompanyTransfersGetImportRunResult {
  importRun: CompanyImportRun;
}

export interface CompanyTransfersListExportRunsInput {}

export interface CompanyTransfersListExportRunsResult {
  exportRuns: CompanyExportRun[];
}

export interface CompanyTransfersListImportRunsInput {}

export interface CompanyTransfersListImportRunsResult {
  importRuns: CompanyImportRun[];
}

export interface DocumentsGetInput {
  id: Id;
  includeAuthor?: boolean | null;
  includeSpace?: boolean | null;
  includeProject?: boolean | null;
  includeGoal?: boolean | null;
  includeResourceHub?: boolean | null;
  includeParentFolder?: boolean | null;
  includeReactions?: boolean | null;
  includePermissions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includePathToDocument?: boolean | null;
  includeVersionsCount?: boolean | null;
}

export interface DocumentsGetResult {
  document: ResourceHubDocument;
}

export interface DocumentsGetVersionInput {
  documentId: Id;
  versionNumber: number;
}

export interface DocumentsGetVersionResult {
  version: DocumentVersion;
}

export interface DocumentsListVersionsInput {
  documentId: Id;
}

export interface DocumentsListVersionsResult {
  versions: DocumentVersion[];
}

export interface FilesGetInput {
  id: Id;
  includeAuthor?: boolean;
  includeGoal?: boolean;
  includeResourceHub?: boolean;
  includeSpace?: boolean;
  includeProject?: boolean;
  includeParentFolder?: boolean;
  includeReactions?: boolean;
  includePermissions?: boolean;
  includeSubscriptionsList?: boolean;
  includePotentialSubscribers?: boolean;
  includePathToFile?: boolean;
}

export interface FilesGetResult {
  file: ResourceHubFile;
}

export interface GetThemeInput {}

export interface GetThemeResult {
  theme: AccountTheme;
}

export interface GoalsCountChildrenInput {
  id: Id;
}

export interface GoalsCountChildrenResult {
  childrenCount: GoalChildrenCount;
}

export interface GoalsGetInput {
  id: Id;
  includeChampion?: boolean | null;
  includeClosedBy?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includePermissions?: boolean | null;
  includeProjects?: boolean | null;
  includeReviewer?: boolean | null;
  includeSpace?: boolean | null;
  includeSpaceMembers?: boolean | null;
  includeResourceHub?: boolean | null;
  includeAccessLevels?: boolean | null;
  includePrivacy?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includeRetrospective?: boolean | null;
  includeChecklist?: boolean;
  includeMarkdown?: boolean;
}

export interface GoalsGetResult {
  goal: Goal;
  markdown?: string;
}

export interface GoalsGetCheckInInput {
  id: Id;
  includeAuthor?: boolean | null;
  includeAcknowledgedBy?: boolean | null;
  includeReactions?: boolean | null;
  includeGoal?: boolean | null;
  includeGoalTargets?: boolean | null;
  includeGoalChecklist?: boolean | null;
  includeReviewer?: boolean | null;
  includeChampion?: boolean | null;
  includeSpace?: boolean | null;
  includeSpaceMembers?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includePermissions?: boolean | null;
}

export interface GoalsGetCheckInResult {
  update: GoalProgressUpdate;
}

export interface GoalsListInput {
  spaceId?: Id | null;
  includeProjects?: boolean | null;
  includeSpace?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeChampion?: boolean | null;
  includeReviewer?: boolean | null;
}

export interface GoalsListResult {
  goals?: Goal[] | null;
}

export interface GoalsListAccessMembersInput {
  goalId: Id;
}

export interface GoalsListAccessMembersResult {
  people: Person[];
}

export interface GoalsListCheckInsInput {
  goalId: Id;
}

export interface GoalsListCheckInsResult {
  checkIns: GoalProgressUpdate[];
}

export interface GoalsListContributorsInput {
  goalId: Id;
}

export interface GoalsListContributorsResult {
  contributors?: Person[] | null;
}

export interface GoalsListDiscussionsInput {
  goalId: Id;
}

export interface GoalsListDiscussionsResult {
  discussions: Discussion[];
}

export interface GoalsSearchParentGoalInput {
  query: string;
  goalId: Id;
}

export interface GoalsSearchParentGoalResult {
  goals: Goal[];
}

export interface InvitationsGetInvitationInput {
  token: string;
}

export interface InvitationsGetInvitationResult {
  inviteLink: InviteLink;
  member: Person;
}

export interface InvitationsGetInviteLinkAvailabilityInput {
  token: string;
}

export interface InvitationsGetInviteLinkAvailabilityResult {
  inviteLink?: InviteLink | null;
  memberLimitExceeded: boolean;
}

export interface InvitationsGetInviteLinkByTokenInput {
  token: string;
}

export interface InvitationsGetInviteLinkByTokenResult {
  inviteLink?: InviteLink | null;
}

export interface KpisGetKpiInput {
  kpiId: Id;
}

export interface KpisGetKpiResult {
  kpi: Kpi;
}

export interface KpisListKpisInput {
  spaceId: Id;
}

export interface KpisListKpisResult {
  kpis: Kpi[];
}

export interface LinksGetInput {
  id: Id;
  includeAuthor?: boolean;
  includeSpace?: boolean;
  includeProject?: boolean;
  includeGoal?: boolean;
  includeResourceHub?: boolean;
  includeParentFolder?: boolean;
  includeReactions?: boolean;
  includePermissions?: boolean;
  includeSubscriptionsList?: boolean;
  includePotentialSubscribers?: boolean;
  includeUnreadNotifications?: boolean;
  includePathToLink?: boolean;
}

export interface LinksGetResult {
  link: ResourceHubLink;
}

export interface McpGrantsListInput {}

export interface McpGrantsListResult {
  mcpGrants: McpGrant[];
}

export interface NotificationsGetUnreadCountInput {}

export interface NotificationsGetUnreadCountResult {
  unread: number;
}

export interface NotificationsIsSubscribedInput {
  resourceId: Id;
  resourceType: SubscriptionParentType;
}

export interface NotificationsIsSubscribedResult {
  subscribed: boolean;
}

export interface NotificationsListInput {
  page?: number;
  perPage?: number;
}

export interface NotificationsListResult {
  notifications: Notification[];
}

export interface PeopleGetInput {
  id: Id;
  includeManager?: boolean;
  includeReports?: boolean;
  includePeers?: boolean;
  includePermissions?: boolean;
  includeAccount?: boolean;
}

export interface PeopleGetResult {
  person: Person;
}

export interface PeopleGetAccountInput {}

export interface PeopleGetAccountResult {
  account: Account;
}

export interface PeopleGetAssignmentsCountInput {}

export interface PeopleGetAssignmentsCountResult {
  count: number;
}

export interface PeopleGetBindedInput {
  resourseType: string;
  resourseId: Id;
}

export interface PeopleGetBindedResult {
  people: Person[];
}

export interface PeopleGetMeInput {
  includeManager?: boolean;
}

export interface PeopleGetMeResult {
  me: Person;
}

export interface PeopleListInput {
  onlySuspended?: boolean;
  includeSuspended?: boolean;
  includeManager?: boolean;
  includeAccount?: boolean;
  includeInviteLink?: boolean;
  includeCompanyAccessLevels?: boolean;
}

export interface PeopleListResult {
  people: Person[];
}

export interface PeopleListAssignmentsInput {}

export interface PeopleListAssignmentsResult {
  dueSoon: ReviewAssignmentGroup[];
  needsReview: ReviewAssignmentGroup[];
  upcoming: ReviewAssignmentGroup[];
}

export interface PeopleListPossibleManagersInput {
  userId?: Id;
  query?: string | null;
}

export interface PeopleListPossibleManagersResult {
  people: Person[];
}

export interface PeopleSearchInput {
  query?: string;
  ignoredIds?: Id[];
  searchScopeType?: SearchScopeOptions;
  searchScopeId?: Id | null;
}

export interface PeopleSearchResult {
  people: Person[];
}

export interface ProductReleasesGetLatestInput {}

export interface ProductReleasesGetLatestResult {
  productRelease?: ProductRelease | null;
}

export interface ProjectTemplatesGetInput {
  id: Id;
}

export interface ProjectTemplatesGetResult {
  template: ProjectTemplate;
}

export interface ProjectTemplatesGetDiscussionInput {
  templateId: Id;
  discussionId: Id;
}

export interface ProjectTemplatesGetDiscussionResult {
  discussion: ProjectTemplateDiscussion;
}

export interface ProjectTemplatesListInput {
  spaceId?: Id | null;
  search?: string;
  archiveStatus?: ProjectTemplateArchiveStatus;
}

export interface ProjectTemplatesListResult {
  templates: ProjectTemplate[];
}

export interface ProjectTemplatesListCommentsInput {
  templateId: Id;
  parentType: ProjectTemplateCommentParentType;
  parentId: Id;
}

export interface ProjectTemplatesListCommentsResult {
  comments: ProjectTemplateComment[];
}

export interface ProjectsCountChildrenInput {
  id: Id;
  useTaskId?: boolean;
  useMilestoneId?: boolean;
}

export interface ProjectsCountChildrenResult {
  childrenCount: ProjectChildrenCount;
}

export interface ProjectsGetInput {
  id: Id;
  includeContributors?: boolean | null;
  includeGoal?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeMilestones?: boolean | null;
  includePermissions?: boolean | null;
  includeChampion?: boolean | null;
  includeReviewer?: boolean | null;
  includeSpace?: boolean | null;
  includeResourceHub?: boolean | null;
  includeContributorsAccessLevels?: boolean | null;
  includeAccessLevels?: boolean | null;
  includePrivacy?: boolean | null;
  includeRetrospective?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includeSubscriptionList?: boolean | null;
  includeMarkdown?: boolean;
}

export interface ProjectsGetResult {
  project: Project;
  markdown?: string;
}

export interface ProjectsGetCheckInInput {
  id: Id;
  includeAuthor?: boolean;
  includeAcknowledgedBy?: boolean;
  includeProject?: boolean;
  includeSpace?: boolean;
  includeReactions?: boolean;
  includeSubscriptionsList?: boolean;
  includePotentialSubscribers?: boolean;
  includeUnreadNotifications?: boolean | null;
}

export interface ProjectsGetCheckInResult {
  projectCheckIn: ProjectCheckIn;
}

export interface ProjectsGetContributorInput {
  id: Id;
  includeProject?: boolean;
  includePermissions?: boolean;
  includeAccessLevel?: boolean | null;
}

export interface ProjectsGetContributorResult {
  contributor: ProjectContributor;
}

export interface ProjectsGetDiscussionInput {
  id: Id;
  includeUnreadNotifications?: boolean;
  includePermissions?: boolean;
  includeSubscriptionsList?: boolean;
  includePotentialSubscribers?: boolean;
  includeUnreadProjectNotifications?: boolean;
  includeProject?: boolean;
  includeSpace?: boolean;
}

export interface ProjectsGetDiscussionResult {
  discussion: CommentThread;
}

export interface ProjectsGetMilestoneInput {
  id: Id;
  includeComments?: boolean;
  includeProject?: boolean;
  includeCreator?: boolean;
  includePermissions?: boolean;
  includeSpace?: boolean;
  includeSubscriptionList?: boolean;
  includeAvailableStatuses?: boolean;
  includeMarkdown?: boolean;
}

export interface ProjectsGetMilestoneResult {
  milestone: Milestone;
  markdown?: string;
}

export interface ProjectsGetRetrospectiveInput {
  projectId: Id;
  includeAuthor?: boolean | null;
  includeProject?: boolean | null;
  includeClosedAt?: boolean | null;
  includePermissions?: boolean | null;
  includeReactions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
}

export interface ProjectsGetRetrospectiveResult {
  retrospective: ProjectRetrospective;
}

export interface ProjectsListInput {
  onlyMyProjects?: boolean | null;
  onlyReviewedByMe?: boolean | null;
  spaceId?: Id | null;
  goalId?: Id | null;
  includeSpace?: boolean | null;
  includeMilestones?: boolean | null;
  includeContributors?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeChampion?: boolean | null;
  includeReviewer?: boolean | null;
  includeGoal?: boolean | null;
  includeArchived?: boolean | null;
  includePrivacy?: boolean | null;
  includeRetrospective?: boolean | null;
}

export interface ProjectsListResult {
  projects: Project[];
}

export interface ProjectsListCheckInsInput {
  projectId: Id;
  includeAuthor?: boolean;
  includeProject?: boolean;
  includeReactions?: boolean;
}

export interface ProjectsListCheckInsResult {
  projectCheckIns: ProjectCheckIn[];
}

export interface ProjectsListContributorsInput {
  projectId: Id;
  query?: string | null;
  ignoredIds?: Id[] | null;
}

export interface ProjectsListContributorsResult {
  contributors: Person[] | null;
}

export interface ProjectsListDiscussionsInput {
  projectId: Id;
}

export interface ProjectsListDiscussionsResult {
  discussions: CommentThread[];
}

export interface ProjectsListMilestoneTasksInput {
  milestoneId: Id;
}

export interface ProjectsListMilestoneTasksResult {
  tasks: Task[];
}

export interface ProjectsListMilestonesInput {
  projectId: Id;
  query?: string;
}

export interface ProjectsListMilestonesResult {
  milestones: Milestone[] | null;
}

export interface ProjectsSearchInput {
  query: string;
  accessLevel?: AccessOptions;
  ignoredIds?: Id[];
  activeOnly?: boolean;
}

export interface ProjectsSearchResult {
  projects: Project[];
}

export interface ProjectsSearchParentGoalInput {
  query: string;
  projectId: Id;
}

export interface ProjectsSearchParentGoalResult {
  goals: Goal[];
}

export interface ProjectsSearchPotentialContributorsInput {
  projectId: Id;
  query?: string | null;
}

export interface ProjectsSearchPotentialContributorsResult {
  people: Person[];
}

export interface ResourceHubsGetInput {
  id: Id;
  includeSpace?: boolean | null;
  includeProject?: boolean | null;
  includeGoal?: boolean | null;
  includeNodes?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includePermissions?: boolean | null;
}

export interface ResourceHubsGetResult {
  resourceHub: ResourceHub;
}

export interface ResourceHubsGetFolderInput {
  id: Id;
  includeNodes?: boolean;
  includeResourceHub?: boolean;
  includeSpace?: boolean;
  includeProject?: boolean;
  includeGoal?: boolean;
  includePathToFolder?: boolean;
  includePermissions?: boolean;
  includePotentialSubscribers?: boolean;
}

export interface ResourceHubsGetFolderResult {
  folder: ResourceHubFolder;
}

export interface ResourceHubsListNodesInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  includeCommentsCount?: boolean | null;
  includeChildrenCount?: boolean | null;
}

export interface ResourceHubsListNodesResult {
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
}

export interface ResourceHubsSearchInput {
  resourceHubId: Id;
  query: string;
}

export interface ResourceHubsSearchResult {
  nodes: ResourceHubNode[];
}

export interface SiteMessagesListActiveInput {}

export interface SiteMessagesListActiveResult {
  messages: SiteMessage[];
}

export interface SpacesCountByAccessLevelInput {
  accessLevel: AccessOptions;
}

export interface SpacesCountByAccessLevelResult {
  count: number;
}

export interface SpacesGetInput {
  id: Id;
  includePermissions?: boolean | null;
  includeMembers?: boolean | null;
  includeAccessLevels?: boolean | null;
  includeMembersAccessLevels?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includeMarkdown?: boolean;
}

export interface SpacesGetResult {
  space: Space;
  markdown?: string;
}

export interface SpacesGetDiscussionInput {
  id: Id;
  includeAuthor?: boolean | null;
  includeReactions?: boolean | null;
  includeSpace?: boolean | null;
  includeSpaceMembers?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includePermissions?: boolean | null;
}

export interface SpacesGetDiscussionResult {
  discussion: Discussion;
}

export interface SpacesListInput {
  accessLevel?: AccessOptions;
  includePermissions?: boolean;
  includeAccessLevels?: boolean;
  includeMembers?: boolean;
}

export interface SpacesListResult {
  spaces: Space[];
}

export interface SpacesListDiscussionsInput {
  spaceId: Id;
  includeAuthor?: boolean | null;
  includeCommentsCount?: boolean | null;
  includeMyDrafts?: boolean | null;
}

export interface SpacesListDiscussionsResult {
  discussions: Discussion[];
  myDrafts?: Discussion[] | null;
}

export interface SpacesListMembersInput {
  spaceId: Id;
  query?: string | null;
  ignoredIds?: Id[] | null;
}

export interface SpacesListMembersResult {
  people: Person[];
}

export interface SpacesListTasksInput {
  spaceId: Id;
}

export interface SpacesListTasksResult {
  tasks: Task[];
}

export interface SpacesListToolsInput {
  spaceId: Id;
}

export interface SpacesListToolsResult {
  tools: SpaceTools;
}

export interface SpacesSearchInput {
  query: string;
  accessLevel?: AccessOptions;
  ignoredIds?: Id[];
  withTasksEnabledOnly?: boolean;
}

export interface SpacesSearchResult {
  spaces: Space[];
}

export interface SpacesSearchPotentialMembersInput {
  spaceId: Id;
  query?: string;
  excludeIds?: Id[];
  limit?: number;
}

export interface SpacesSearchPotentialMembersResult {
  people: Person[];
}

export interface TasksGetInput {
  id: Id;
  includeAssignees?: boolean;
  includeMilestone?: boolean;
  includeProject?: boolean;
  includeCreator?: boolean;
  includeProjectSpace?: boolean;
  includePermissions?: boolean;
  includeSubscriptionList?: boolean;
  includeAvailableStatuses?: boolean;
  includeMarkdown?: boolean;
}

export interface TasksGetResult {
  task?: Task | null;
  markdown?: string;
}

export interface TasksListInput {
  projectId: Id;
}

export interface TasksListResult {
  tasks: Task[];
}

export interface TasksListPotentialAssigneesInput {
  id: Id;
  type: TaskType;
  query?: string | null;
  ignoredIds?: Id[] | null;
}

export interface TasksListPotentialAssigneesResult {
  people: Person[];
}

export interface TasksListTaskStatusesInput {
  taskId: Id;
}

export interface TasksListTaskStatusesResult {
  taskStatuses: TaskStatus[];
}

export interface AddCompanyOwnersInput {
  peopleIds?: Id[] | null;
}

export interface AddCompanyOwnersResult {}

export interface AddCompanyTrustedEmailDomainInput {
  companyId?: string | null;
  domain?: string | null;
}

export interface AddCompanyTrustedEmailDomainResult {
  company?: Company | null;
}

export interface AddFirstCompanyInput {
  companyName?: string | null;
  fullName?: string | null;
  email?: string | null;
  title?: string | null;
  password?: string | null;
  passwordConfirmation?: string | null;
}

export interface AddFirstCompanyResult {
  company?: Company | null;
}

export interface ApiTokensCreateInput {
  readOnly?: boolean;
}

export interface ApiTokensCreateResult {
  apiToken: ApiToken;
  token: string;
}

export interface ApiTokensDeleteInput {
  id: Id;
}

export interface ApiTokensDeleteResult {
  success: boolean;
}

export interface ApiTokensSetReadOnlyInput {
  id: Id;
  readOnly: boolean;
}

export interface ApiTokensSetReadOnlyResult {
  apiToken: ApiToken;
}

export interface ApiTokensUpdateNameInput {
  id: Id;
  name?: string | null;
}

export interface ApiTokensUpdateNameResult {
  apiToken: ApiToken;
}

export interface BillingCancelInput {}

export interface BillingCancelResult {
  billing: BillingOverview;
}

export interface BillingChangePlanInput {
  plan: string;
  billingInterval: BillingInterval;
}

export interface BillingChangePlanResult {
  billing: BillingOverview;
}

export interface BillingCreateCheckoutSessionInput {
  plan: string;
  billingInterval: BillingInterval;
}

export interface BillingCreateCheckoutSessionResult {
  session: BillingCheckoutSession;
}

export interface BillingCreateCustomerPortalSessionInput {
  returnTo?: string | null;
}

export interface BillingCreateCustomerPortalSessionResult {
  session: BillingHostedSession;
}

export interface BillingCreatePaymentMethodSessionInput {
  returnTo?: string | null;
}

export interface BillingCreatePaymentMethodSessionResult {
  session: BillingHostedSession;
}

export interface BillingReactivateInput {}

export interface BillingReactivateResult {
  billing: BillingOverview;
}

export interface BillingRefreshInput {}

export interface BillingRefreshResult {
  billing: BillingOverview;
}

export interface ChangePasswordInput {
  currentPassword?: string | null;
  newPassword?: string | null;
  newPasswordConfirmation?: string | null;
}

export interface ChangePasswordResult {}

export interface CliAuthAuthEmailCodeInput {
  email: string;
  code: string;
  inviteToken?: string | null;
}

export interface CliAuthAuthEmailCodeResult {
  status: CliAuthStatus;
  companies: Company[];
  bootstrapToken?: string | null;
  message?: string | null;
}

export interface CliAuthAuthPasswordInput {
  email: string;
  password: string;
  inviteToken?: string | null;
}

export interface CliAuthAuthPasswordResult {
  status: CliAuthStatus;
  companies: Company[];
  bootstrapToken?: string | null;
  message?: string | null;
}

export interface CliAuthCheckAccountInput {
  email: string;
}

export interface CliAuthCheckAccountResult {
  exists: boolean;
  hasPassword?: boolean | null;
}

export interface CliAuthCreateCompanyInput {
  companyName: string;
  title?: string | null;
}

export interface CliAuthCreateCompanyResult {
  company: Company;
  person: Person;
}

export interface CliAuthCreateTokenInput {
  companyId: CompanyId;
  readOnly?: boolean;
}

export interface CliAuthCreateTokenResult {
  company: Company;
  apiToken: ApiToken;
  token: string;
}

export interface CliAuthJoinCompanyInput {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface CliAuthJoinCompanyResult {
  status: CliAuthStatus;
  companies: Company[];
  bootstrapToken?: string | null;
  message?: string | null;
}

export interface CliAuthJoinWithInviteInput {
  token: string;
}

export interface CliAuthJoinWithInviteResult {
  company: Company;
}

export interface CliAuthRequestEmailCodeInput {
  email: string;
}

export interface CliAuthRequestEmailCodeResult {}

export interface CliAuthSetupCompanyInput {
  companyName: string;
  title?: string | null;
}

export interface CliAuthSetupCompanyResult {
  company: Company;
  person: Person;
}

export interface CliAuthSignupInput {
  email: string;
  code: string;
  fullName: string;
  password: string;
}

export interface CliAuthSignupResult {
  status: CliAuthStatus;
  companies: Company[];
  bootstrapToken?: string | null;
  message?: string | null;
}

export interface CliAuthStartGoogleInput {
  inviteToken?: string | null;
}

export interface CliAuthStartGoogleResult {
  status: CliAuthStatus;
  companies: Company[];
  bootstrapToken: string;
  loginUrl: string;
  pollIntervalMs: number;
}

export interface CliAuthStartGoogleSignupInput {}

export interface CliAuthStartGoogleSignupResult {
  status: CliAuthStatus;
  companies: Company[];
  bootstrapToken: string;
  loginUrl: string;
  pollIntervalMs: number;
}

export interface CommentsCreateInput {
  entityId: Id;
  entityType: CommentParentType;
  content: Json;
}

export interface CommentsCreateResult {
  comment: Comment;
}

export interface CommentsDeleteInput {
  commentId: Id;
  parentType: CommentParentType;
}

export interface CommentsDeleteResult {
  comment: Comment;
}

export interface CommentsUpdateInput {
  content: Json;
  commentId: Id;
  parentType: CommentParentType;
}

export interface CommentsUpdateResult {
  comment: Comment;
}

export interface CompaniesConvertMemberToGuestInput {
  personId: Id;
}

export interface CompaniesConvertMemberToGuestResult {
  person: Person;
}

export interface CompaniesCreateInput {
  companyName: string;
  title: string;
  plan?: string;
  billingPeriod?: BillingInterval;
  isDemo?: boolean;
}

export interface CompaniesCreateResult {
  company: Company;
}

export interface CompaniesCreateAdminsInput {
  peopleIds: Id[];
}

export interface CompaniesCreateAdminsResult {}

export interface CompaniesCreateMemberInput {
  fullName: string;
  email: string;
  title: string;
}

export interface CompaniesCreateMemberResult {
  inviteLink: InviteLink;
  newAccount: boolean;
  personId?: string | null;
}

export interface CompaniesDeleteActivityInput {
  activityId: Id;
}

export interface CompaniesDeleteActivityResult {
  success: boolean;
}

export interface CompaniesDeleteAdminInput {
  personId: Id;
}

export interface CompaniesDeleteAdminResult {
  person: Person;
}

export interface CompaniesDeleteMemberInput {
  personId: Id;
}

export interface CompaniesDeleteMemberResult {
  person: Person;
}

export interface CompaniesDeleteOwnerInput {
  personId: Id;
}

export interface CompaniesDeleteOwnerResult {}

export interface CompaniesDeleteTrustedEmailDomainInput {
  companyId: string;
  domain: string;
}

export interface CompaniesDeleteTrustedEmailDomainResult {
  company: Company;
}

export interface CompaniesGrantResourceAccessInput {
  personId: Id;
  resources: ResourceAccessInput[];
}

export interface CompaniesGrantResourceAccessResult {
  success: boolean;
}

export interface CompaniesInviteGuestInput {
  fullName: string;
  email: string;
  title: string;
}

export interface CompaniesInviteGuestResult {
  inviteLink?: InviteLink | null;
  newAccount: boolean;
  personId?: string | null;
}

export interface CompaniesRestoreMemberInput {
  personId: Id;
}

export interface CompaniesRestoreMemberResult {}

export interface CompaniesUpdateInput {
  name: string;
}

export interface CompaniesUpdateResult {
  company: Company;
}

export interface CompaniesUpdateMembersPermissionsInput {
  members: EditCompanyMemberPermissionsInput[];
}

export interface CompaniesUpdateMembersPermissionsResult {
  success: boolean;
}

export interface CompanyTransfersCreateImportArtifactBlobsInput {
  files?: BlobCreationInput[] | null;
}

export interface CompanyTransfersCreateImportArtifactBlobsResult {
  blobs?: BlobCreationOutput[] | null;
}

export interface CompanyTransfersStartExportInput {}

export interface CompanyTransfersStartExportResult {
  exportRun: CompanyExportRun;
}

export interface CompanyTransfersStartImportInput {
  packageBlobId: Id;
}

export interface CompanyTransfersStartImportResult {
  importRun: CompanyImportRun;
}

export interface CompleteCompanySetupInput {
  spaces: SpaceSetupInput[];
}

export interface CompleteCompanySetupResult {}

export interface CreateAccountInput {
  inviteToken?: string | null;
  code?: string | null;
  email?: string | null;
  password?: string | null;
  fullName?: string | null;
}

export interface CreateAccountResult {
  company?: Company | null;
  person?: Person | null;
  error?: string | null;
  joinErrorDetails?: Json | null;
}

export interface CreateAvatarBlobInput {
  files?: BlobCreationInput[] | null;
}

export interface CreateAvatarBlobResult {
  blobs?: BlobCreationOutput[] | null;
}

export interface CreateBlobInput {
  files?: BlobCreationInput[] | null;
}

export interface CreateBlobResult {
  blobs?: BlobCreationOutput[] | null;
}

export interface CreateEmailActivationCodeInput {
  email?: string | null;
}

export interface CreateEmailActivationCodeResult {}

export interface DeleteCompanyInput {}

export interface DeleteCompanyResult {
  success: boolean;
}

export interface DocumentsCreateInput {
  resourceHubId: Id;
  folderId?: Id | null;
  name: string;
  content: Json;
  postAsDraft?: boolean | null;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
  copiedDocumentId?: Id | null;
}

export interface DocumentsCreateResult {
  document: Document;
}

export interface DocumentsDeleteInput {
  documentId: Id;
}

export interface DocumentsDeleteResult {
  document: Document;
}

export interface DocumentsPublishInput {
  documentId: Id;
  name?: string | null;
  content?: Json | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface DocumentsPublishResult {
  document: ResourceHubDocument;
}

export interface DocumentsRestoreVersionInput {
  documentId: Id;
  versionNumber: number;
  expectedCurrentVersion: number;
}

export interface DocumentsRestoreVersionResult {
  document: ResourceHubDocument;
  restoredVersion?: DocumentVersion | null;
}

export interface DocumentsUpdateInput {
  documentId: Id;
  name: string;
  content: Json;
  expectedVersion?: number | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface DocumentsUpdateResult {
  document?: ResourceHubDocument | null;
}

export interface FilesCreateInput {
  resourceHubId: Id;
  folderId?: Id | null;
  files: ResourceHubUploadedFile[];
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
}

export interface FilesCreateResult {
  files: ResourceHubFile[];
}

export interface FilesDeleteInput {
  fileId: Id;
}

export interface FilesDeleteResult {
  file: ResourceHubFile;
}

export interface FilesUpdateInput {
  fileId: Id;
  name: string;
  description?: Json;
}

export interface FilesUpdateResult {
  file: ResourceHubFile;
}

export interface GoalsAcknowledgeCheckInInput {
  id: Id;
}

export interface GoalsAcknowledgeCheckInResult {
  update?: GoalProgressUpdate | null;
}

export interface GoalsAcknowledgeRetrospectiveInput {
  goalId: Id;
}

export interface GoalsAcknowledgeRetrospectiveResult {
  activity: Activity;
}

export interface GoalsChangeParentInput {
  goalId: Id;
  parentGoalId: Id | null;
}

export interface GoalsChangeParentResult {
  goal?: Goal | null;
}

export interface GoalsCloseInput {
  goalId: Id;
  success: string;
  retrospective: Json;
  successStatus: SuccessStatus;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface GoalsCloseResult {
  goal: Goal;
}

export interface GoalsCreateInput {
  spaceId: Id;
  name: string;
  championId?: Id | null;
  reviewerId?: Id | null;
  timeframe?: Timeframe | null;
  targets?: CreateTargetInput[] | null;
  description?: Json | null;
  parentGoalId?: Id | null;
  anonymousAccessLevel: AccessOptionsInt;
  companyAccessLevel: AccessOptionsInt;
  spaceAccessLevel: AccessOptionsInt;
}

export interface GoalsCreateResult {
  goal?: Goal | null;
}

export interface GoalsCreateAccessMembersInput {
  goalId: Id;
  members: AddMemberInput[];
}

export interface GoalsCreateAccessMembersResult {
  success: boolean;
}

export interface GoalsCreateCheckInput {
  goalId: Id;
  name: string;
}

export interface GoalsCreateCheckResult {
  checkId: Id;
  success: boolean;
}

export interface GoalsCreateCheckInInput {
  goalId: Id;
  status: GoalCheckInStatus;
  dueDate?: ContextualDate | null;
  checklist?: GoalCheckUpdate[];
  content: Json;
  newTargetValues?: string;
  postAsDraft?: boolean;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
  scheduledAt?: string | null;
}

export interface GoalsCreateCheckInResult {
  update?: GoalProgressUpdate | null;
}

export interface GoalsCreateDiscussionInput {
  goalId: Id;
  title: string;
  message: Json;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
}

export interface GoalsCreateDiscussionResult {
  discussion: CommentThread;
  activityId: string;
}

export interface GoalsCreateTargetInput {
  goalId: Id;
  name: string;
  startValue: number;
  targetValue: number;
  unit: string;
}

export interface GoalsCreateTargetResult {
  targetId: Id;
  success: boolean;
}

export interface GoalsDeleteInput {
  goalId: Id;
}

export interface GoalsDeleteResult {
  goal?: Goal | null;
}

export interface GoalsDeleteAccessMemberInput {
  goalId: Id;
  personId: Id;
}

export interface GoalsDeleteAccessMemberResult {
  success: boolean;
}

export interface GoalsDeleteCheckInput {
  goalId: Id;
  checkId: Id;
}

export interface GoalsDeleteCheckResult {
  success: boolean;
}

export interface GoalsDeleteCheckInInput {
  id: Id;
}

export interface GoalsDeleteCheckInResult {
  success: boolean;
}

export interface GoalsDeleteTargetInput {
  goalId: Id;
  targetId: Id;
}

export interface GoalsDeleteTargetResult {
  success: boolean;
}

export interface GoalsReopenInput {
  id: Id;
  message: Json;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface GoalsReopenResult {
  goal: Goal;
}

export interface GoalsToggleCheckInput {
  goalId: Id;
  checkId: Id;
}

export interface GoalsToggleCheckResult {
  success: boolean;
}

export interface GoalsUpdateAccessLevelsInput {
  goalId: Id;
  accessLevels: AccessLevels;
}

export interface GoalsUpdateAccessLevelsResult {
  success: boolean;
}

export interface GoalsUpdateAccessMemberInput {
  goalId: Id;
  personId: Id;
  accessLevel: AccessOptionsInt;
}

export interface GoalsUpdateAccessMemberResult {
  success: boolean;
}

export interface GoalsUpdateChampionInput {
  goalId: Id;
  championId: Id | null;
}

export interface GoalsUpdateChampionResult {
  success: boolean;
}

export interface GoalsUpdateCheckInput {
  goalId: Id;
  checkId: Id;
  name: string;
}

export interface GoalsUpdateCheckResult {
  success: boolean;
}

export interface GoalsUpdateCheckInInput {
  id: Id;
  dueDate: ContextualDate | null;
  status: GoalCheckInStatus;
  content: Json;
  state?: CheckInState | null;
  newTargetValues?: string | null;
  checklist?: GoalCheckUpdate[] | null;
  scheduledAt?: string | null;
}

export interface GoalsUpdateCheckInResult {
  update?: GoalProgressUpdate | null;
}

export interface GoalsUpdateCheckIndexInput {
  goalId: Id;
  checkId: Id;
  index: number;
}

export interface GoalsUpdateCheckIndexResult {
  success: boolean;
}

export interface GoalsUpdateDescriptionInput {
  goalId: Id;
  description: Json;
}

export interface GoalsUpdateDescriptionResult {
  success: boolean;
}

export interface GoalsUpdateDiscussionInput {
  activityId: Id;
  title: string;
  message: Json;
}

export interface GoalsUpdateDiscussionResult {}

export interface GoalsUpdateDueDateInput {
  goalId: Id;
  dueDate: ContextualDate | null;
}

export interface GoalsUpdateDueDateResult {
  success: boolean;
}

export interface GoalsUpdateNameInput {
  goalId: Id;
  name: string;
}

export interface GoalsUpdateNameResult {
  success: boolean;
}

export interface GoalsUpdateParentGoalInput {
  goalId: Id;
  parentGoalId: Id | null;
}

export interface GoalsUpdateParentGoalResult {
  success: boolean;
}

export interface GoalsUpdateReviewerInput {
  goalId: Id;
  reviewerId: Id | null;
}

export interface GoalsUpdateReviewerResult {
  success: boolean;
}

export interface GoalsUpdateSpaceInput {
  goalId: Id;
  spaceId: Id;
}

export interface GoalsUpdateSpaceResult {
  success: boolean;
}

export interface GoalsUpdateStartDateInput {
  goalId: Id;
  startDate: ContextualDate | null;
}

export interface GoalsUpdateStartDateResult {
  success: boolean;
}

export interface GoalsUpdateTargetInput {
  goalId: Id;
  targetId: Id;
  name?: string | null;
  startValue?: number | null;
  targetValue?: number | null;
  unit?: string | null;
}

export interface GoalsUpdateTargetResult {
  success: boolean;
}

export interface GoalsUpdateTargetIndexInput {
  goalId: Id;
  targetId: Id;
  index: number;
}

export interface GoalsUpdateTargetIndexResult {
  success: boolean;
}

export interface GoalsUpdateTargetValueInput {
  goalId: Id;
  targetId: Id;
  value: number;
}

export interface GoalsUpdateTargetValueResult {
  success: boolean;
}

export interface InvitationsGetCompanyInviteLinkInput {}

export interface InvitationsGetCompanyInviteLinkResult {
  inviteLink: InviteLink;
}

export interface InvitationsJoinCompanyViaInviteLinkInput {
  token: string;
}

export interface InvitationsJoinCompanyViaInviteLinkResult {
  company?: Company | null;
}

export interface InvitationsNewInvitationTokenInput {
  personId: string;
}

export interface InvitationsNewInvitationTokenResult {
  inviteLink: InviteLink;
}

export interface InvitationsResetCompanyInviteLinkInput {}

export interface InvitationsResetCompanyInviteLinkResult {
  inviteLink: InviteLink;
}

export interface InvitationsUpdateCompanyInviteLinkInput {
  isActive?: boolean;
  allowedDomains?: string[];
}

export interface InvitationsUpdateCompanyInviteLinkResult {
  inviteLink?: InviteLink;
}

export interface JoinCompanyInput {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface JoinCompanyResult {
  result: string;
}

export interface KpisAddKpiAnnotationInput {
  kpiId: Id;
  date: string;
  title: string;
}

export interface KpisAddKpiAnnotationResult {
  annotation: KpiAnnotation;
}

export interface KpisCreateKpiInput {
  spaceId: Id;
  name: string;
  unit: string;
  cadence: string;
  championId?: Id | null;
  description?: Json | null;
}

export interface KpisCreateKpiResult {
  kpi: Kpi;
}

export interface KpisDeleteKpiInput {
  kpiId: Id;
}

export interface KpisDeleteKpiResult {
  kpi: Kpi;
}

export interface KpisDeleteKpiAnnotationInput {
  annotationId: Id;
}

export interface KpisDeleteKpiAnnotationResult {
  annotation: KpiAnnotation;
}

export interface KpisEditKpiInput {
  kpiId: Id;
  name?: string | null;
  unit?: string | null;
  cadence?: string | null;
  championId?: Id | null;
  description?: Json | null;
}

export interface KpisEditKpiResult {
  kpi: Kpi;
}

export interface KpisEditKpiAnnotationInput {
  annotationId: Id;
  date?: string | null;
  title?: string | null;
}

export interface KpisEditKpiAnnotationResult {
  annotation: KpiAnnotation;
}

export interface KpisLogKpiEntryInput {
  kpiId: Id;
  value: number;
  period: string;
}

export interface KpisLogKpiEntryResult {
  entry: KpiEntry;
}

export interface LinksCreateInput {
  resourceHubId: Id;
  folderId?: Id | null;
  name: string;
  url: string;
  description?: Json;
  type: ResourceHubLinkType;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
}

export interface LinksCreateResult {
  link: ResourceHubLink;
}

export interface LinksDeleteInput {
  linkId: Id;
}

export interface LinksDeleteResult {
  success: boolean;
}

export interface LinksUpdateInput {
  linkId: Id;
  name: string;
  type: ResourceHubLinkType;
  url: string;
  description?: Json;
}

export interface LinksUpdateResult {
  link: ResourceHubLink;
}

export interface MarkBlobUploadedInput {
  blobId: Id;
}

export interface MarkBlobUploadedResult {
  blob: Blob;
}

export interface McpGrantsRevokeInput {
  id: Id;
}

export interface McpGrantsRevokeResult {
  success: boolean;
}

export interface NotificationsMarkAllAsReadInput {}

export interface NotificationsMarkAllAsReadResult {}

export interface NotificationsMarkAsReadInput {
  id: Id;
}

export interface NotificationsMarkAsReadResult {}

export interface NotificationsMarkManyAsReadInput {
  ids: Id[];
}

export interface NotificationsMarkManyAsReadResult {}

export interface NotificationsSubscribeInput {
  subscriptionListId: Id;
  type: SubscriptionParentType;
}

export interface NotificationsSubscribeResult {}

export interface NotificationsUnsubscribeInput {
  subscriptionListId: Id;
}

export interface NotificationsUnsubscribeResult {}

export interface NotificationsUpdateSubscriptionsListInput {
  subscriptionListId: Id;
  type: string;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface NotificationsUpdateSubscriptionsListResult {}

export interface PeopleUpdateInput {
  id: Id;
  fullName?: string;
  title?: string;
  timezone?: string;
  timeFormat?: TimeFormat;
  managerId?: Id | null;
  theme?: string;
  notifyAboutAssignments?: boolean;
  notifyOnMention?: boolean;
  sendDailySummary?: boolean;
  emailWindowMinutes?: number;
  dailySummaryDeliveryTime?: string;
  description?: Json | null;
}

export interface PeopleUpdateResult {
  person: Person;
}

export interface PeopleUpdatePictureInput {
  personId: Id;
  avatarBlobId: Id | null;
  avatarUrl: string | null;
}

export interface PeopleUpdatePictureResult {
  person: Person;
}

export interface PeopleUpdateThemeInput {
  theme: AccountTheme;
}

export interface PeopleUpdateThemeResult {
  success: boolean;
}

export interface ProductReleasesDismissInput {
  id: string;
}

export interface ProductReleasesDismissResult {
  success: boolean;
}

export interface ProjectTemplatesArchiveInput {
  id: Id;
}

export interface ProjectTemplatesArchiveResult {
  success: boolean;
}

export interface ProjectTemplatesCreateInput {
  spaceId: Id;
  name: string;
  description?: Json | null;
  durationDays?: number | null;
}

export interface ProjectTemplatesCreateResult {
  template: ProjectTemplate;
}

export interface ProjectTemplatesCreateCommentInput {
  templateId: Id;
  parentType: ProjectTemplateCommentParentType;
  parentId: Id;
  content: Json;
}

export interface ProjectTemplatesCreateCommentResult {
  comment: ProjectTemplateComment;
}

export interface ProjectTemplatesCreateDiscussionInput {
  templateId: Id;
  title: string;
  body: Json;
}

export interface ProjectTemplatesCreateDiscussionResult {
  discussion: ProjectTemplateDiscussion;
}

export interface ProjectTemplatesCreateDocumentInput {
  templateId: Id;
  parentFolderId?: Id | null;
  name: string;
  content: Json;
}

export interface ProjectTemplatesCreateDocumentResult {
  document: ProjectTemplateResourceDocument;
}

export interface ProjectTemplatesCreateFilesInput {
  templateId: Id;
  parentFolderId?: Id | null;
  files: ProjectTemplateUploadedFile[];
}

export interface ProjectTemplatesCreateFilesResult {
  files: ProjectTemplateResourceFile[];
}

export interface ProjectTemplatesCreateFolderInput {
  templateId: Id;
  parentFolderId?: Id | null;
  name: string;
}

export interface ProjectTemplatesCreateFolderResult {
  folder: ProjectTemplateResourceFolder;
}

export interface ProjectTemplatesCreateFromProjectInput {
  projectId: Id;
  name: string;
  description?: Json | null;
  includePeopleAndAssignments?: boolean;
  includeDiscussions?: boolean;
  includeDocsAndFiles?: boolean;
  includeComments?: boolean;
}

export interface ProjectTemplatesCreateFromProjectResult {
  template?: ProjectTemplate | null;
  scheduleIssues: ProjectTemplateScheduleIssue[];
}

export interface ProjectTemplatesCreateLinkInput {
  templateId: Id;
  parentFolderId?: Id | null;
  name: string;
  url: string;
  description?: Json | null;
  type: ProjectTemplateResourceLinkType;
}

export interface ProjectTemplatesCreateLinkResult {
  link: ProjectTemplateResourceLink;
}

export interface ProjectTemplatesCreateMilestoneInput {
  templateId: Id;
  title: string;
  description?: Json | null;
  dueOffsetDays?: number | null;
}

export interface ProjectTemplatesCreateMilestoneResult {
  milestone: ProjectTemplateMilestone;
}

export interface ProjectTemplatesCreatePersonInput {
  templateId: Id;
  personId: Id;
  role: ProjectTemplatePersonRole;
  responsibility?: string | null;
  accessLevel: AccessOptionsInt;
}

export interface ProjectTemplatesCreatePersonResult {
  person: ProjectTemplatePerson;
}

export interface ProjectTemplatesCreateProjectInput {
  templateId: Id;
  spaceId: Id;
  startDate: string;
  name: string;
  goalId?: Id | null;
  anonymousAccessLevel: AccessOptionsInt;
  companyAccessLevel: AccessOptionsInt;
  spaceAccessLevel: AccessOptionsInt;
}

export interface ProjectTemplatesCreateProjectResult {
  project: Project;
}

export interface ProjectTemplatesCreateTaskInput {
  templateId: Id;
  milestoneId?: Id | null;
  name: string;
  description?: Json | null;
  priority?: string | null;
  size?: string | null;
  dueOffsetDays?: number | null;
  reminders?: TaskReminder[];
  taskStatus?: TaskStatus;
  assigneeIds?: Id[];
}

export interface ProjectTemplatesCreateTaskResult {
  task: ProjectTemplateTask;
}

export interface ProjectTemplatesDeleteInput {
  id: Id;
}

export interface ProjectTemplatesDeleteResult {
  success: boolean;
}

export interface ProjectTemplatesDeleteCommentInput {
  templateId: Id;
  commentId: Id;
}

export interface ProjectTemplatesDeleteCommentResult {
  success: boolean;
}

export interface ProjectTemplatesDeleteMilestoneInput {
  templateId: Id;
  milestoneId: Id;
}

export interface ProjectTemplatesDeleteMilestoneResult {
  success: boolean;
}

export interface ProjectTemplatesDeletePersonInput {
  templateId: Id;
  templatePersonId: Id;
}

export interface ProjectTemplatesDeletePersonResult {
  success: boolean;
}

export interface ProjectTemplatesDeleteResourceInput {
  templateId: Id;
  nodeId: Id;
}

export interface ProjectTemplatesDeleteResourceResult {
  success: boolean;
}

export interface ProjectTemplatesDeleteTaskInput {
  templateId: Id;
  taskId: Id;
}

export interface ProjectTemplatesDeleteTaskResult {
  success: boolean;
}

export interface ProjectTemplatesDuplicateInput {
  id: Id;
  name: string;
}

export interface ProjectTemplatesDuplicateResult {
  template: ProjectTemplate;
}

export interface ProjectTemplatesMoveResourceInput {
  templateId: Id;
  nodeId: Id;
  parentFolderId?: Id | null;
}

export interface ProjectTemplatesMoveResourceResult {
  success: boolean;
}

export interface ProjectTemplatesRestoreInput {
  id: Id;
}

export interface ProjectTemplatesRestoreResult {
  success: boolean;
}

export interface ProjectTemplatesUpdateInput {
  id: Id;
  name?: string;
  description?: Json | null;
  durationDays?: number | null;
  taskStatuses?: TaskStatus[];
  deletedStatusReplacements?: DeletedStatusReplacement[];
  milestonesOrderingState?: string[];
  tasksKanbanState?: Json;
}

export interface ProjectTemplatesUpdateResult {
  success: boolean;
}

export interface ProjectTemplatesUpdateCommentInput {
  templateId: Id;
  commentId: Id;
  content: Json;
}

export interface ProjectTemplatesUpdateCommentResult {
  comment: ProjectTemplateComment;
}

export interface ProjectTemplatesUpdateDiscussionInput {
  templateId: Id;
  discussionId: Id;
  title: string;
  body: Json;
}

export interface ProjectTemplatesUpdateDiscussionResult {
  discussion: ProjectTemplateDiscussion;
}

export interface ProjectTemplatesUpdateDocumentInput {
  templateId: Id;
  documentId: Id;
  name: string;
  content: Json;
}

export interface ProjectTemplatesUpdateDocumentResult {
  document: ProjectTemplateResourceDocument;
}

export interface ProjectTemplatesUpdateFileInput {
  templateId: Id;
  fileId: Id;
  name: string;
  description?: Json | null;
}

export interface ProjectTemplatesUpdateFileResult {
  file: ProjectTemplateResourceFile;
}

export interface ProjectTemplatesUpdateFolderInput {
  templateId: Id;
  folderId: Id;
  name: string;
}

export interface ProjectTemplatesUpdateFolderResult {
  folder: ProjectTemplateResourceFolder;
}

export interface ProjectTemplatesUpdateLinkInput {
  templateId: Id;
  linkId: Id;
  name: string;
  url: string;
  description?: Json | null;
  type: ProjectTemplateResourceLinkType;
}

export interface ProjectTemplatesUpdateLinkResult {
  link: ProjectTemplateResourceLink;
}

export interface ProjectTemplatesUpdateMilestoneInput {
  templateId: Id;
  milestoneId: Id;
  title?: string;
  description?: Json | null;
  dueOffsetDays?: number | null;
  tasksOrderingState?: string[];
  tasksKanbanState?: Json;
}

export interface ProjectTemplatesUpdateMilestoneResult {
  milestone: ProjectTemplateMilestone;
}

export interface ProjectTemplatesUpdateMilestoneAndOrderingInput {
  templateId: Id;
  taskId: Id;
  milestoneId: Id | null;
  index: number;
}

export interface ProjectTemplatesUpdateMilestoneAndOrderingResult {
  task: ProjectTemplateTask;
}

export interface ProjectTemplatesUpdatePersonInput {
  templateId: Id;
  templatePersonId: Id;
  personId?: Id;
  role?: ProjectTemplatePersonRole;
  responsibility?: string | null;
  accessLevel?: AccessOptionsInt;
}

export interface ProjectTemplatesUpdatePersonResult {
  person: ProjectTemplatePerson;
}

export interface ProjectTemplatesUpdateTaskInput {
  templateId: Id;
  taskId: Id;
  milestoneId?: Id | null;
  name?: string;
  description?: Json;
  priority?: string | null;
  size?: string | null;
  dueOffsetDays?: number | null;
  reminders?: TaskReminder[];
  taskStatus?: TaskStatus;
}

export interface ProjectTemplatesUpdateTaskResult {
  task: ProjectTemplateTask;
}

export interface ProjectTemplatesUpdateTaskAssigneesInput {
  templateId: Id;
  taskId: Id;
  assigneeIds: Id[];
}

export interface ProjectTemplatesUpdateTaskAssigneesResult {
  assignments: ProjectTemplateTaskAssignment[];
}

export interface ProjectsAcknowledgeCheckInInput {
  id: Id;
}

export interface ProjectsAcknowledgeCheckInResult {
  checkIn: ProjectCheckIn;
}

export interface ProjectsAcknowledgeRetrospectiveInput {
  projectId: Id;
}

export interface ProjectsAcknowledgeRetrospectiveResult {
  retrospective: ProjectRetrospective;
}

export interface ProjectsCloseInput {
  projectId: Id;
  retrospective: Json;
  successStatus: SuccessStatus;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface ProjectsCloseResult {
  retrospective: ProjectRetrospective;
}

export interface ProjectsCreateInput {
  spaceId: Id;
  name: string;
  championId?: Id | null;
  reviewerId?: Id | null;
  goalId?: Id | null;
  description?: Json | null;
  anonymousAccessLevel: AccessOptionsInt;
  companyAccessLevel: AccessOptionsInt;
  spaceAccessLevel: AccessOptionsInt;
}

export interface ProjectsCreateResult {
  project: Project;
}

export interface ProjectsCreateCheckInInput {
  projectId: Id;
  status: ProjectCheckInStatus;
  description: Json;
  postAsDraft?: boolean;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
  scheduledAt?: string | null;
}

export interface ProjectsCreateCheckInResult {
  checkIn: ProjectCheckIn;
}

export interface ProjectsCreateContributorInput {
  projectId: Id;
  personId: Id;
  responsibility: string;
  permissions: AccessOptions;
  role: ProjectContributorRole | null;
}

export interface ProjectsCreateContributorResult {
  projectContributor: ProjectContributor;
}

export interface ProjectsCreateContributorsInput {
  projectId: Id;
  contributors: ProjectContributorInput[];
}

export interface ProjectsCreateContributorsResult {
  success: boolean;
}

export interface ProjectsCreateDiscussionInput {
  projectId: Id;
  title: string;
  message: Json;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
}

export interface ProjectsCreateDiscussionResult {
  discussion: CommentThread;
}

export interface ProjectsCreateMilestoneInput {
  projectId: Id;
  name: string;
  dueDate: ContextualDate | null;
}

export interface ProjectsCreateMilestoneResult {
  milestone: Milestone;
}

export interface ProjectsCreateMilestoneCommentInput {
  milestoneId: Id;
  content: Json | null;
  action: string;
  openTasksResolution?: MilestoneOpenTasksResolutionInput | null;
}

export interface ProjectsCreateMilestoneCommentResult {
  comment: MilestoneComment;
}

export interface ProjectsDeleteInput {
  projectId: Id;
}

export interface ProjectsDeleteResult {
  project: Project;
}

export interface ProjectsDeleteCheckInInput {
  checkInId: Id;
}

export interface ProjectsDeleteCheckInResult {
  success: boolean;
}

export interface ProjectsDeleteContributorInput {
  contribId: string;
}

export interface ProjectsDeleteContributorResult {
  projectContributor: ProjectContributor;
}

export interface ProjectsDeleteMilestoneInput {
  milestoneId: Id;
}

export interface ProjectsDeleteMilestoneResult {
  success: boolean;
}

export interface ProjectsMoveToSpaceInput {
  projectId: Id;
  spaceId: Id;
}

export interface ProjectsMoveToSpaceResult {}

export interface ProjectsPauseInput {
  projectId: Id;
  message: Json;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface ProjectsPauseResult {
  project: Project;
}

export interface ProjectsResumeInput {
  projectId: Id;
  message: Json;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface ProjectsResumeResult {
  project: Project;
}

export interface ProjectsUpdateChampionInput {
  projectId: Id;
  championId: Id | null;
}

export interface ProjectsUpdateChampionResult {
  success: boolean | null;
}

export interface ProjectsUpdateCheckInInput {
  checkInId: Id;
  status: ProjectCheckInStatus;
  description: Json;
  state?: CheckInState | null;
  scheduledAt?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface ProjectsUpdateCheckInResult {
  checkIn: ProjectCheckIn;
}

export interface ProjectsUpdateContributorInput {
  contribId: Id;
  personId?: Id | null;
  responsibility?: string | null;
  permissions?: AccessOptions | null;
  role?: ProjectContributorRole | null;
}

export interface ProjectsUpdateContributorResult {
  contributor: ProjectContributor;
}

export interface ProjectsUpdateDescriptionInput {
  projectId: Id;
  description: Json;
}

export interface ProjectsUpdateDescriptionResult {
  project: Project;
}

export interface ProjectsUpdateDiscussionInput {
  id: Id;
  title: string;
  message: Json;
  subscriberIds?: Id[];
}

export interface ProjectsUpdateDiscussionResult {
  discussion: CommentThread;
}

export interface ProjectsUpdateDueDateInput {
  projectId: Id;
  dueDate: ContextualDate | null;
}

export interface ProjectsUpdateDueDateResult {
  success: boolean | null;
}

export interface ProjectsUpdateKanbanInput {
  projectId: Id;
  taskId: Id;
  status: TaskStatus;
  kanbanState: Json;
}

export interface ProjectsUpdateKanbanResult {
  project: Project;
  task: Task;
}

export interface ProjectsUpdateMilestoneInput {
  projectId: Id;
  milestoneId: Id;
  name: string;
  dueDate: ContextualDate | null;
}

export interface ProjectsUpdateMilestoneResult {
  milestone: Milestone;
}

export interface ProjectsUpdateMilestoneDescriptionInput {
  milestoneId: Id;
  description: Json;
}

export interface ProjectsUpdateMilestoneDescriptionResult {
  milestone: Milestone;
}

export interface ProjectsUpdateMilestoneDueDateInput {
  milestoneId: Id;
  dueDate: ContextualDate | null;
}

export interface ProjectsUpdateMilestoneDueDateResult {
  milestone: Milestone;
}

export interface ProjectsUpdateMilestoneKanbanInput {
  milestoneId: Id;
  taskId: Id;
  status: TaskStatus;
  kanbanState: Json;
}

export interface ProjectsUpdateMilestoneKanbanResult {
  task: Task;
}

export interface ProjectsUpdateMilestoneOrderingInput {
  projectId: Id;
  orderingState: string[];
}

export interface ProjectsUpdateMilestoneOrderingResult {
  project: Project;
}

export interface ProjectsUpdateMilestoneTitleInput {
  milestoneId: Id;
  title: string;
}

export interface ProjectsUpdateMilestoneTitleResult {
  milestone: Milestone;
}

export interface ProjectsUpdateNameInput {
  projectId: Id;
  name: string;
}

export interface ProjectsUpdateNameResult {
  project: Project;
}

export interface ProjectsUpdateParentGoalInput {
  projectId: Id;
  goalId: Id | null;
}

export interface ProjectsUpdateParentGoalResult {
  success: boolean | null;
}

export interface ProjectsUpdatePermissionsInput {
  projectId: Id;
  accessLevels: AccessLevels;
}

export interface ProjectsUpdatePermissionsResult {
  success: boolean;
}

export interface ProjectsUpdateRetrospectiveInput {
  retrospectiveId: Id;
  content: Json;
  successStatus: SuccessStatus;
}

export interface ProjectsUpdateRetrospectiveResult {
  retrospective: ProjectRetrospective;
}

export interface ProjectsUpdateReviewerInput {
  projectId: Id;
  reviewerId: Id | null;
}

export interface ProjectsUpdateReviewerResult {
  success: boolean | null;
}

export interface ProjectsUpdateStartDateInput {
  projectId: Id;
  startDate: ContextualDate | null;
}

export interface ProjectsUpdateStartDateResult {
  success: boolean | null;
}

export interface ProjectsUpdateTaskStatusesInput {
  projectId: Id;
  taskStatuses: TaskStatus[];
  deletedStatusReplacements?: DeletedStatusReplacement[] | null;
}

export interface ProjectsUpdateTaskStatusesResult {
  success: boolean | null;
}

export interface ProjectsUpdateTasksViewInput {
  projectId: Id;
  tasksView: ProjectTasksView;
}

export interface ProjectsUpdateTasksViewResult {
  project: Project;
}

export interface ReactionsCreateInput {
  entityId: Id;
  entityType: ReactionEntityType;
  parentType?: ReactionParentType;
  emoji: string;
}

export interface ReactionsCreateResult {
  reaction: Reaction;
}

export interface ReactionsDeleteInput {
  reactionId: Id;
}

export interface ReactionsDeleteResult {
  success: boolean;
}

export interface RequestPasswordResetInput {
  email?: string | null;
}

export interface RequestPasswordResetResult {}

export interface ResetPasswordInput {
  email?: string | null;
  password?: string | null;
  passwordConfirmation?: string | null;
  resetPasswordToken?: string | null;
}

export interface ResetPasswordResult {}

export interface ResourceHubsCopyFolderInput {
  folderName?: string;
  folderId: Id;
  destParentFolderId?: Id | null;
}

export interface ResourceHubsCopyFolderResult {
  folderId: Id;
}

export interface ResourceHubsCreateFolderInput {
  resourceHubId: Id;
  folderId?: Id | null;
  name: string;
}

export interface ResourceHubsCreateFolderResult {
  folder: ResourceHubFolder;
}

export interface ResourceHubsDeleteFolderInput {
  folderId: Id;
}

export interface ResourceHubsDeleteFolderResult {
  success: boolean;
}

export interface ResourceHubsRenameFolderInput {
  folderId: Id;
  newName: string;
}

export interface ResourceHubsRenameFolderResult {
  success: boolean;
}

export interface ResourceHubsUpdateParentFolderInput {
  resourceId: Id;
  resourceType: string;
  newFolderId?: Id | null;
}

export interface ResourceHubsUpdateParentFolderResult {
  success: boolean;
}

export interface SpacesAddMembersInput {
  spaceId: Id;
  members: AddMemberInput[];
}

export interface SpacesAddMembersResult {
  success: boolean;
}

export interface SpacesArchiveDiscussionInput {
  id: Id;
}

export interface SpacesArchiveDiscussionResult {}

export interface SpacesCreateInput {
  name: string;
  mission: string;
  companyPermissions: AccessOptionsInt;
  publicPermissions: AccessOptionsInt;
}

export interface SpacesCreateResult {
  space: Space;
}

export interface SpacesCreateDiscussionInput {
  spaceId: Id;
  title: string;
  body?: Json;
  postAsDraft?: boolean;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
  scheduledAt?: string | null;
}

export interface SpacesCreateDiscussionResult {
  discussion: Discussion;
}

export interface SpacesDeleteInput {
  spaceId: Id;
}

export interface SpacesDeleteResult {
  space: Space;
}

export interface SpacesDeleteMemberInput {
  spaceId: Id;
  memberId: Id;
}

export interface SpacesDeleteMemberResult {}

export interface SpacesJoinInput {
  spaceId: Id;
}

export interface SpacesJoinResult {}

export interface SpacesPublishDiscussionInput {
  id: Id;
}

export interface SpacesPublishDiscussionResult {
  discussion: Discussion;
}

export interface SpacesUpdateInput {
  id: Id;
  name: string;
  mission: string;
}

export interface SpacesUpdateResult {
  space: Space;
}

export interface SpacesUpdateDiscussionInput {
  id: Id;
  title?: string | null;
  body?: Json | null;
  state?: DiscussionState | null;
  scheduledAt?: string | null;
}

export interface SpacesUpdateDiscussionResult {
  discussion: Discussion;
}

export interface SpacesUpdateKanbanInput {
  spaceId: Id;
  taskId: Id;
  status: TaskStatus;
  kanbanState: Json;
}

export interface SpacesUpdateKanbanResult {
  task: Task;
}

export interface SpacesUpdateMembersPermissionsInput {
  spaceId: Id;
  members: EditMemberPermissionsInput[];
}

export interface SpacesUpdateMembersPermissionsResult {
  success: boolean;
}

export interface SpacesUpdatePermissionsInput {
  spaceId: Id;
  accessLevels: AccessLevels;
}

export interface SpacesUpdatePermissionsResult {
  success: boolean;
}

export interface SpacesUpdateTaskStatusesInput {
  spaceId: Id;
  taskStatuses: TaskStatus[];
  deletedStatusReplacements?: DeletedStatusReplacement[] | null;
}

export interface SpacesUpdateTaskStatusesResult {
  success: boolean;
}

export interface SpacesUpdateToolsInput {
  spaceId: Id;
  tools: UpdateSpaceToolsPayload;
}

export interface SpacesUpdateToolsResult {
  success: boolean;
  tools: SpaceTools;
}

export interface TasksCreateInput {
  type: TaskType;
  id: Id;
  milestoneId?: Id | null;
  name: string;
  assigneeId?: Id | null;
  assigneeIds?: Id[] | null;
  description?: Json | null;
  dueDate: ContextualDate | null;
  status?: TaskStatus;
}

export interface TasksCreateResult {
  task: Task;
  updatedMilestone?: Milestone;
  updatedSpace?: Space;
}

export interface TasksDeleteInput {
  taskId: Id;
  type: TaskType;
}

export interface TasksDeleteResult {
  success: boolean;
  updatedMilestone: Milestone | null;
}

export interface TasksMoveInput {
  taskId: Id;
  destinationType: TaskType;
  destinationId: Id;
}

export interface TasksMoveResult {
  task: Task;
  destinationType: TaskType;
  destinationId: Id;
}

export interface TasksUpdateAssigneeInput {
  taskId: Id;
  assigneeId?: Id | null;
  assigneeIds?: Id[] | null;
  type: TaskType;
}

export interface TasksUpdateAssigneeResult {
  task: Task;
}

export interface TasksUpdateDescriptionInput {
  taskId: Id;
  description: Json;
  type: TaskType;
}

export interface TasksUpdateDescriptionResult {
  task: Task;
}

export interface TasksUpdateDueDateInput {
  taskId: Id;
  dueDate: ContextualDate | null;
  type: TaskType;
}

export interface TasksUpdateDueDateResult {
  task: Task;
}

export interface TasksUpdateMilestoneInput {
  taskId: Id;
  milestoneId: Id | null;
}

export interface TasksUpdateMilestoneResult {
  task: Task;
}

export interface TasksUpdateMilestoneAndOrderingInput {
  taskId: Id;
  milestoneId: Id | null;
  index: number;
}

export interface TasksUpdateMilestoneAndOrderingResult {
  task: Task;
  updatedMilestones: Milestone[];
}

export interface TasksUpdateNameInput {
  taskId: Id;
  name: string;
  type: TaskType;
}

export interface TasksUpdateNameResult {
  task: Task;
}

export interface TasksUpdateRemindersInput {
  taskId: Id;
  reminders: TaskReminder[];
  type: TaskType;
}

export interface TasksUpdateRemindersResult {
  task: Task;
}

export interface TasksUpdateStatusInput {
  taskId: Id;
  status: TaskStatus | null;
  type: TaskType;
}

export interface TasksUpdateStatusResult {
  task: Task;
  updatedMilestone: Milestone | null;
}

class ApiNamespaceCompanyTransfers {
  constructor(private client: ApiClient) {}

  async getExportRun(input: CompanyTransfersGetExportRunInput): Promise<CompanyTransfersGetExportRunResult> {
    return this.client.get("/company_transfers/get_export_run", input);
  }

  async getImportRun(input: CompanyTransfersGetImportRunInput): Promise<CompanyTransfersGetImportRunResult> {
    return this.client.get("/company_transfers/get_import_run", input);
  }

  async listExportRuns(input: CompanyTransfersListExportRunsInput): Promise<CompanyTransfersListExportRunsResult> {
    return this.client.get("/company_transfers/list_export_runs", input);
  }

  async listImportRuns(input: CompanyTransfersListImportRunsInput): Promise<CompanyTransfersListImportRunsResult> {
    return this.client.get("/company_transfers/list_import_runs", input);
  }

  async createImportArtifactBlobs(
    input: CompanyTransfersCreateImportArtifactBlobsInput,
  ): Promise<CompanyTransfersCreateImportArtifactBlobsResult> {
    return this.client.post("/company_transfers/create_import_artifact_blobs", input);
  }

  async startExport(input: CompanyTransfersStartExportInput): Promise<CompanyTransfersStartExportResult> {
    return this.client.post("/company_transfers/start_export", input);
  }

  async startImport(input: CompanyTransfersStartImportInput): Promise<CompanyTransfersStartImportResult> {
    return this.client.post("/company_transfers/start_import", input);
  }
}

class ApiNamespaceCliAuth {
  constructor(private client: ApiClient) {}

  async companyCreationStatus(input: CliAuthCompanyCreationStatusInput): Promise<CliAuthCompanyCreationStatusResult> {
    return this.client.get("/cli_auth/company_creation_status", input);
  }

  async status(input: CliAuthStatusInput): Promise<CliAuthStatusResult> {
    return this.client.get("/cli_auth/status", input);
  }

  async authEmailCode(input: CliAuthAuthEmailCodeInput): Promise<CliAuthAuthEmailCodeResult> {
    return this.client.post("/cli_auth/auth_email_code", input);
  }

  async authPassword(input: CliAuthAuthPasswordInput): Promise<CliAuthAuthPasswordResult> {
    return this.client.post("/cli_auth/auth_password", input);
  }

  async checkAccount(input: CliAuthCheckAccountInput): Promise<CliAuthCheckAccountResult> {
    return this.client.post("/cli_auth/check_account", input);
  }

  async createCompany(input: CliAuthCreateCompanyInput): Promise<CliAuthCreateCompanyResult> {
    return this.client.post("/cli_auth/create_company", input);
  }

  async createToken(input: CliAuthCreateTokenInput): Promise<CliAuthCreateTokenResult> {
    return this.client.post("/cli_auth/create_token", input);
  }

  async joinCompany(input: CliAuthJoinCompanyInput): Promise<CliAuthJoinCompanyResult> {
    return this.client.post("/cli_auth/join_company", input);
  }

  async joinWithInvite(input: CliAuthJoinWithInviteInput): Promise<CliAuthJoinWithInviteResult> {
    return this.client.post("/cli_auth/join_with_invite", input);
  }

  async requestEmailCode(input: CliAuthRequestEmailCodeInput): Promise<CliAuthRequestEmailCodeResult> {
    return this.client.post("/cli_auth/request_email_code", input);
  }

  async setupCompany(input: CliAuthSetupCompanyInput): Promise<CliAuthSetupCompanyResult> {
    return this.client.post("/cli_auth/setup_company", input);
  }

  async signup(input: CliAuthSignupInput): Promise<CliAuthSignupResult> {
    return this.client.post("/cli_auth/signup", input);
  }

  async startGoogle(input: CliAuthStartGoogleInput): Promise<CliAuthStartGoogleResult> {
    return this.client.post("/cli_auth/start_google", input);
  }

  async startGoogleSignup(input: CliAuthStartGoogleSignupInput): Promise<CliAuthStartGoogleSignupResult> {
    return this.client.post("/cli_auth/start_google_signup", input);
  }
}

class ApiNamespaceMcpGrants {
  constructor(private client: ApiClient) {}

  async list(input: McpGrantsListInput): Promise<McpGrantsListResult> {
    return this.client.get("/mcp_grants/list", input);
  }

  async revoke(input: McpGrantsRevokeInput): Promise<McpGrantsRevokeResult> {
    return this.client.post("/mcp_grants/revoke", input);
  }
}

class ApiNamespaceApiTokens {
  constructor(private client: ApiClient) {}

  async list(input: ApiTokensListInput): Promise<ApiTokensListResult> {
    return this.client.get("/api_tokens/list", input);
  }

  async create(input: ApiTokensCreateInput): Promise<ApiTokensCreateResult> {
    return this.client.post("/api_tokens/create", input);
  }

  async delete(input: ApiTokensDeleteInput): Promise<ApiTokensDeleteResult> {
    return this.client.post("/api_tokens/delete", input);
  }

  async setReadOnly(input: ApiTokensSetReadOnlyInput): Promise<ApiTokensSetReadOnlyResult> {
    return this.client.post("/api_tokens/set_read_only", input);
  }

  async updateName(input: ApiTokensUpdateNameInput): Promise<ApiTokensUpdateNameResult> {
    return this.client.post("/api_tokens/update_name", input);
  }
}

class ApiNamespaceInvitations {
  constructor(private client: ApiClient) {}

  async getInvitation(input: InvitationsGetInvitationInput): Promise<InvitationsGetInvitationResult> {
    return this.client.get("/invitations/get_invitation", input);
  }

  async getInviteLinkAvailability(
    input: InvitationsGetInviteLinkAvailabilityInput,
  ): Promise<InvitationsGetInviteLinkAvailabilityResult> {
    return this.client.get("/invitations/get_invite_link_availability", input);
  }

  async getInviteLinkByToken(
    input: InvitationsGetInviteLinkByTokenInput,
  ): Promise<InvitationsGetInviteLinkByTokenResult> {
    return this.client.get("/invitations/get_invite_link_by_token", input);
  }

  async getCompanyInviteLink(
    input: InvitationsGetCompanyInviteLinkInput,
  ): Promise<InvitationsGetCompanyInviteLinkResult> {
    return this.client.post("/invitations/get_company_invite_link", input);
  }

  async joinCompanyViaInviteLink(
    input: InvitationsJoinCompanyViaInviteLinkInput,
  ): Promise<InvitationsJoinCompanyViaInviteLinkResult> {
    return this.client.post("/invitations/join_company_via_invite_link", input);
  }

  async newInvitationToken(input: InvitationsNewInvitationTokenInput): Promise<InvitationsNewInvitationTokenResult> {
    return this.client.post("/invitations/new_invitation_token", input);
  }

  async resetCompanyInviteLink(
    input: InvitationsResetCompanyInviteLinkInput,
  ): Promise<InvitationsResetCompanyInviteLinkResult> {
    return this.client.post("/invitations/reset_company_invite_link", input);
  }

  async updateCompanyInviteLink(
    input: InvitationsUpdateCompanyInviteLinkInput,
  ): Promise<InvitationsUpdateCompanyInviteLinkResult> {
    return this.client.post("/invitations/update_company_invite_link", input);
  }
}

class ApiNamespaceProductReleases {
  constructor(private client: ApiClient) {}

  async getLatest(input: ProductReleasesGetLatestInput): Promise<ProductReleasesGetLatestResult> {
    return this.client.get("/product_releases/get_latest", input);
  }

  async dismiss(input: ProductReleasesDismissInput): Promise<ProductReleasesDismissResult> {
    return this.client.post("/product_releases/dismiss", input);
  }
}

class ApiNamespaceSiteMessages {
  constructor(private client: ApiClient) {}

  async listActive(input: SiteMessagesListActiveInput): Promise<SiteMessagesListActiveResult> {
    return this.client.get("/site_messages/list_active", input);
  }
}

class ApiNamespaceBilling {
  constructor(private client: ApiClient) {}

  async get(input: BillingGetInput): Promise<BillingGetResult> {
    return this.client.get("/billing/get", input);
  }

  async getAccessState(input: BillingGetAccessStateInput): Promise<BillingGetAccessStateResult> {
    return this.client.get("/billing/get_access_state", input);
  }

  async getCatalog(input: BillingGetCatalogInput): Promise<BillingGetCatalogResult> {
    return this.client.get("/billing/get_catalog", input);
  }

  async getLimitWarnings(input: BillingGetLimitWarningsInput): Promise<BillingGetLimitWarningsResult> {
    return this.client.get("/billing/get_limit_warnings", input);
  }

  async cancel(input: BillingCancelInput): Promise<BillingCancelResult> {
    return this.client.post("/billing/cancel", input);
  }

  async changePlan(input: BillingChangePlanInput): Promise<BillingChangePlanResult> {
    return this.client.post("/billing/change_plan", input);
  }

  async createCheckoutSession(input: BillingCreateCheckoutSessionInput): Promise<BillingCreateCheckoutSessionResult> {
    return this.client.post("/billing/create_checkout_session", input);
  }

  async createCustomerPortalSession(
    input: BillingCreateCustomerPortalSessionInput,
  ): Promise<BillingCreateCustomerPortalSessionResult> {
    return this.client.post("/billing/create_customer_portal_session", input);
  }

  async createPaymentMethodSession(
    input: BillingCreatePaymentMethodSessionInput,
  ): Promise<BillingCreatePaymentMethodSessionResult> {
    return this.client.post("/billing/create_payment_method_session", input);
  }

  async reactivate(input: BillingReactivateInput): Promise<BillingReactivateResult> {
    return this.client.post("/billing/reactivate", input);
  }

  async refresh(input: BillingRefreshInput): Promise<BillingRefreshResult> {
    return this.client.post("/billing/refresh", input);
  }
}

class ApiNamespaceRoot {
  constructor(private client: ApiClient) {}

  async getTheme(input: GetThemeInput): Promise<GetThemeResult> {
    return this.client.get("/get_theme", input);
  }

  async addCompanyOwners(input: AddCompanyOwnersInput): Promise<AddCompanyOwnersResult> {
    return this.client.post("/add_company_owners", input);
  }

  async addCompanyTrustedEmailDomain(
    input: AddCompanyTrustedEmailDomainInput,
  ): Promise<AddCompanyTrustedEmailDomainResult> {
    return this.client.post("/add_company_trusted_email_domain", input);
  }

  async addFirstCompany(input: AddFirstCompanyInput): Promise<AddFirstCompanyResult> {
    return this.client.post("/add_first_company", input);
  }

  async changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    return this.client.post("/change_password", input);
  }

  async completeCompanySetup(input: CompleteCompanySetupInput): Promise<CompleteCompanySetupResult> {
    return this.client.post("/complete_company_setup", input);
  }

  async createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
    return this.client.post("/create_account", input);
  }

  async createAvatarBlob(input: CreateAvatarBlobInput): Promise<CreateAvatarBlobResult> {
    return this.client.post("/create_avatar_blob", input);
  }

  async createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
    return this.client.post("/create_blob", input);
  }

  async createEmailActivationCode(input: CreateEmailActivationCodeInput): Promise<CreateEmailActivationCodeResult> {
    return this.client.post("/create_email_activation_code", input);
  }

  async deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
    return this.client.post("/delete_company", input);
  }

  async joinCompany(input: JoinCompanyInput): Promise<JoinCompanyResult> {
    return this.client.post("/join_company", input);
  }

  async markBlobUploaded(input: MarkBlobUploadedInput): Promise<MarkBlobUploadedResult> {
    return this.client.post("/mark_blob_uploaded", input);
  }

  async requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    return this.client.post("/request_password_reset", input);
  }

  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    return this.client.post("/reset_password", input);
  }
}

class ApiNamespaceNotifications {
  constructor(private client: ApiClient) {}

  async getUnreadCount(input: NotificationsGetUnreadCountInput): Promise<NotificationsGetUnreadCountResult> {
    return this.client.get("/notifications/get_unread_count", input);
  }

  async isSubscribed(input: NotificationsIsSubscribedInput): Promise<NotificationsIsSubscribedResult> {
    return this.client.get("/notifications/is_subscribed", input);
  }

  async list(input: NotificationsListInput): Promise<NotificationsListResult> {
    return this.client.get("/notifications/list", input);
  }

  async markAllAsRead(input: NotificationsMarkAllAsReadInput): Promise<NotificationsMarkAllAsReadResult> {
    return this.client.post("/notifications/mark_all_as_read", input);
  }

  async markAsRead(input: NotificationsMarkAsReadInput): Promise<NotificationsMarkAsReadResult> {
    return this.client.post("/notifications/mark_as_read", input);
  }

  async markManyAsRead(input: NotificationsMarkManyAsReadInput): Promise<NotificationsMarkManyAsReadResult> {
    return this.client.post("/notifications/mark_many_as_read", input);
  }

  async subscribe(input: NotificationsSubscribeInput): Promise<NotificationsSubscribeResult> {
    return this.client.post("/notifications/subscribe", input);
  }

  async unsubscribe(input: NotificationsUnsubscribeInput): Promise<NotificationsUnsubscribeResult> {
    return this.client.post("/notifications/unsubscribe", input);
  }

  async updateSubscriptionsList(
    input: NotificationsUpdateSubscriptionsListInput,
  ): Promise<NotificationsUpdateSubscriptionsListResult> {
    return this.client.post("/notifications/update_subscriptions_list", input);
  }
}

class ApiNamespaceFiles {
  constructor(private client: ApiClient) {}

  async get(input: FilesGetInput): Promise<FilesGetResult> {
    return this.client.get("/files/get", input);
  }

  async create(input: FilesCreateInput): Promise<FilesCreateResult> {
    return this.client.post("/files/create", input);
  }

  async delete(input: FilesDeleteInput): Promise<FilesDeleteResult> {
    return this.client.post("/files/delete", input);
  }

  async update(input: FilesUpdateInput): Promise<FilesUpdateResult> {
    return this.client.post("/files/update", input);
  }
}

class ApiNamespaceLinks {
  constructor(private client: ApiClient) {}

  async get(input: LinksGetInput): Promise<LinksGetResult> {
    return this.client.get("/links/get", input);
  }

  async create(input: LinksCreateInput): Promise<LinksCreateResult> {
    return this.client.post("/links/create", input);
  }

  async delete(input: LinksDeleteInput): Promise<LinksDeleteResult> {
    return this.client.post("/links/delete", input);
  }

  async update(input: LinksUpdateInput): Promise<LinksUpdateResult> {
    return this.client.post("/links/update", input);
  }
}

class ApiNamespaceDocuments {
  constructor(private client: ApiClient) {}

  async get(input: DocumentsGetInput): Promise<DocumentsGetResult> {
    return this.client.get("/documents/get", input);
  }

  async getVersion(input: DocumentsGetVersionInput): Promise<DocumentsGetVersionResult> {
    return this.client.get("/documents/get_version", input);
  }

  async listVersions(input: DocumentsListVersionsInput): Promise<DocumentsListVersionsResult> {
    return this.client.get("/documents/list_versions", input);
  }

  async create(input: DocumentsCreateInput): Promise<DocumentsCreateResult> {
    return this.client.post("/documents/create", input);
  }

  async delete(input: DocumentsDeleteInput): Promise<DocumentsDeleteResult> {
    return this.client.post("/documents/delete", input);
  }

  async publish(input: DocumentsPublishInput): Promise<DocumentsPublishResult> {
    return this.client.post("/documents/publish", input);
  }

  async restoreVersion(input: DocumentsRestoreVersionInput): Promise<DocumentsRestoreVersionResult> {
    return this.client.post("/documents/restore_version", input);
  }

  async update(input: DocumentsUpdateInput): Promise<DocumentsUpdateResult> {
    return this.client.post("/documents/update", input);
  }
}

class ApiNamespaceResourceHubs {
  constructor(private client: ApiClient) {}

  async get(input: ResourceHubsGetInput): Promise<ResourceHubsGetResult> {
    return this.client.get("/resource_hubs/get", input);
  }

  async getFolder(input: ResourceHubsGetFolderInput): Promise<ResourceHubsGetFolderResult> {
    return this.client.get("/resource_hubs/get_folder", input);
  }

  async listNodes(input: ResourceHubsListNodesInput): Promise<ResourceHubsListNodesResult> {
    return this.client.get("/resource_hubs/list_nodes", input);
  }

  async search(input: ResourceHubsSearchInput): Promise<ResourceHubsSearchResult> {
    return this.client.get("/resource_hubs/search", input);
  }

  async copyFolder(input: ResourceHubsCopyFolderInput): Promise<ResourceHubsCopyFolderResult> {
    return this.client.post("/resource_hubs/copy_folder", input);
  }

  async createFolder(input: ResourceHubsCreateFolderInput): Promise<ResourceHubsCreateFolderResult> {
    return this.client.post("/resource_hubs/create_folder", input);
  }

  async deleteFolder(input: ResourceHubsDeleteFolderInput): Promise<ResourceHubsDeleteFolderResult> {
    return this.client.post("/resource_hubs/delete_folder", input);
  }

  async renameFolder(input: ResourceHubsRenameFolderInput): Promise<ResourceHubsRenameFolderResult> {
    return this.client.post("/resource_hubs/rename_folder", input);
  }

  async updateParentFolder(input: ResourceHubsUpdateParentFolderInput): Promise<ResourceHubsUpdateParentFolderResult> {
    return this.client.post("/resource_hubs/update_parent_folder", input);
  }
}

class ApiNamespaceComments {
  constructor(private client: ApiClient) {}

  async list(input: CommentsListInput): Promise<CommentsListResult> {
    return this.client.get("/comments/list", input);
  }

  async create(input: CommentsCreateInput): Promise<CommentsCreateResult> {
    return this.client.post("/comments/create", input);
  }

  async delete(input: CommentsDeleteInput): Promise<CommentsDeleteResult> {
    return this.client.post("/comments/delete", input);
  }

  async update(input: CommentsUpdateInput): Promise<CommentsUpdateResult> {
    return this.client.post("/comments/update", input);
  }
}

class ApiNamespaceCompanies {
  constructor(private client: ApiClient) {}

  async get(input: CompaniesGetInput): Promise<CompaniesGetResult> {
    return this.client.get("/companies/get", input);
  }

  async getActivity(input: CompaniesGetActivityInput): Promise<CompaniesGetActivityResult> {
    return this.client.get("/companies/get_activity", input);
  }

  async getFlatWorkMap(input: CompaniesGetFlatWorkMapInput): Promise<CompaniesGetFlatWorkMapResult> {
    return this.client.get("/companies/get_flat_work_map", input);
  }

  async getWorkMap(input: CompaniesGetWorkMapInput): Promise<CompaniesGetWorkMapResult> {
    return this.client.get("/companies/get_work_map", input);
  }

  async list(input: CompaniesListInput): Promise<CompaniesListResult> {
    return this.client.get("/companies/list", input);
  }

  async listActivities(input: CompaniesListActivitiesInput): Promise<CompaniesListActivitiesResult> {
    return this.client.get("/companies/list_activities", input);
  }

  async quickSearch(input: CompaniesQuickSearchInput): Promise<CompaniesQuickSearchResult> {
    return this.client.get("/companies/quick_search", input);
  }

  async search(input: CompaniesSearchInput): Promise<CompaniesSearchResult> {
    return this.client.get("/companies/search", input);
  }

  async convertMemberToGuest(input: CompaniesConvertMemberToGuestInput): Promise<CompaniesConvertMemberToGuestResult> {
    return this.client.post("/companies/convert_member_to_guest", input);
  }

  async create(input: CompaniesCreateInput): Promise<CompaniesCreateResult> {
    return this.client.post("/companies/create", input);
  }

  async createAdmins(input: CompaniesCreateAdminsInput): Promise<CompaniesCreateAdminsResult> {
    return this.client.post("/companies/create_admins", input);
  }

  async createMember(input: CompaniesCreateMemberInput): Promise<CompaniesCreateMemberResult> {
    return this.client.post("/companies/create_member", input);
  }

  async deleteActivity(input: CompaniesDeleteActivityInput): Promise<CompaniesDeleteActivityResult> {
    return this.client.post("/companies/delete_activity", input);
  }

  async deleteAdmin(input: CompaniesDeleteAdminInput): Promise<CompaniesDeleteAdminResult> {
    return this.client.post("/companies/delete_admin", input);
  }

  async deleteMember(input: CompaniesDeleteMemberInput): Promise<CompaniesDeleteMemberResult> {
    return this.client.post("/companies/delete_member", input);
  }

  async deleteOwner(input: CompaniesDeleteOwnerInput): Promise<CompaniesDeleteOwnerResult> {
    return this.client.post("/companies/delete_owner", input);
  }

  async deleteTrustedEmailDomain(
    input: CompaniesDeleteTrustedEmailDomainInput,
  ): Promise<CompaniesDeleteTrustedEmailDomainResult> {
    return this.client.post("/companies/delete_trusted_email_domain", input);
  }

  async grantResourceAccess(input: CompaniesGrantResourceAccessInput): Promise<CompaniesGrantResourceAccessResult> {
    return this.client.post("/companies/grant_resource_access", input);
  }

  async inviteGuest(input: CompaniesInviteGuestInput): Promise<CompaniesInviteGuestResult> {
    return this.client.post("/companies/invite_guest", input);
  }

  async restoreMember(input: CompaniesRestoreMemberInput): Promise<CompaniesRestoreMemberResult> {
    return this.client.post("/companies/restore_member", input);
  }

  async update(input: CompaniesUpdateInput): Promise<CompaniesUpdateResult> {
    return this.client.post("/companies/update", input);
  }

  async updateMembersPermissions(
    input: CompaniesUpdateMembersPermissionsInput,
  ): Promise<CompaniesUpdateMembersPermissionsResult> {
    return this.client.post("/companies/update_members_permissions", input);
  }
}

class ApiNamespacePeople {
  constructor(private client: ApiClient) {}

  async get(input: PeopleGetInput): Promise<PeopleGetResult> {
    return this.client.get("/people/get", input);
  }

  async getAccount(input: PeopleGetAccountInput): Promise<PeopleGetAccountResult> {
    return this.client.get("/people/get_account", input);
  }

  async getAssignmentsCount(input: PeopleGetAssignmentsCountInput): Promise<PeopleGetAssignmentsCountResult> {
    return this.client.get("/people/get_assignments_count", input);
  }

  async getBinded(input: PeopleGetBindedInput): Promise<PeopleGetBindedResult> {
    return this.client.get("/people/get_binded", input);
  }

  async getMe(input: PeopleGetMeInput): Promise<PeopleGetMeResult> {
    return this.client.get("/people/get_me", input);
  }

  async list(input: PeopleListInput): Promise<PeopleListResult> {
    return this.client.get("/people/list", input);
  }

  async listAssignments(input: PeopleListAssignmentsInput): Promise<PeopleListAssignmentsResult> {
    return this.client.get("/people/list_assignments", input);
  }

  async listPossibleManagers(input: PeopleListPossibleManagersInput): Promise<PeopleListPossibleManagersResult> {
    return this.client.get("/people/list_possible_managers", input);
  }

  async search(input: PeopleSearchInput): Promise<PeopleSearchResult> {
    return this.client.get("/people/search", input);
  }

  async update(input: PeopleUpdateInput): Promise<PeopleUpdateResult> {
    return this.client.post("/people/update", input);
  }

  async updatePicture(input: PeopleUpdatePictureInput): Promise<PeopleUpdatePictureResult> {
    return this.client.post("/people/update_picture", input);
  }

  async updateTheme(input: PeopleUpdateThemeInput): Promise<PeopleUpdateThemeResult> {
    return this.client.post("/people/update_theme", input);
  }
}

class ApiNamespaceKpis {
  constructor(private client: ApiClient) {}

  async getKpi(input: KpisGetKpiInput): Promise<KpisGetKpiResult> {
    return this.client.get("/kpis/get_kpi", input);
  }

  async listKpis(input: KpisListKpisInput): Promise<KpisListKpisResult> {
    return this.client.get("/kpis/list_kpis", input);
  }

  async addKpiAnnotation(input: KpisAddKpiAnnotationInput): Promise<KpisAddKpiAnnotationResult> {
    return this.client.post("/kpis/add_kpi_annotation", input);
  }

  async createKpi(input: KpisCreateKpiInput): Promise<KpisCreateKpiResult> {
    return this.client.post("/kpis/create_kpi", input);
  }

  async deleteKpi(input: KpisDeleteKpiInput): Promise<KpisDeleteKpiResult> {
    return this.client.post("/kpis/delete_kpi", input);
  }

  async deleteKpiAnnotation(input: KpisDeleteKpiAnnotationInput): Promise<KpisDeleteKpiAnnotationResult> {
    return this.client.post("/kpis/delete_kpi_annotation", input);
  }

  async editKpi(input: KpisEditKpiInput): Promise<KpisEditKpiResult> {
    return this.client.post("/kpis/edit_kpi", input);
  }

  async editKpiAnnotation(input: KpisEditKpiAnnotationInput): Promise<KpisEditKpiAnnotationResult> {
    return this.client.post("/kpis/edit_kpi_annotation", input);
  }

  async logKpiEntry(input: KpisLogKpiEntryInput): Promise<KpisLogKpiEntryResult> {
    return this.client.post("/kpis/log_kpi_entry", input);
  }
}

class ApiNamespaceSpaces {
  constructor(private client: ApiClient) {}

  async countByAccessLevel(input: SpacesCountByAccessLevelInput): Promise<SpacesCountByAccessLevelResult> {
    return this.client.get("/spaces/count_by_access_level", input);
  }

  async get(input: SpacesGetInput): Promise<SpacesGetResult> {
    return this.client.get("/spaces/get", input);
  }

  async getDiscussion(input: SpacesGetDiscussionInput): Promise<SpacesGetDiscussionResult> {
    return this.client.get("/spaces/get_discussion", input);
  }

  async list(input: SpacesListInput): Promise<SpacesListResult> {
    return this.client.get("/spaces/list", input);
  }

  async listDiscussions(input: SpacesListDiscussionsInput): Promise<SpacesListDiscussionsResult> {
    return this.client.get("/spaces/list_discussions", input);
  }

  async listMembers(input: SpacesListMembersInput): Promise<SpacesListMembersResult> {
    return this.client.get("/spaces/list_members", input);
  }

  async listTasks(input: SpacesListTasksInput): Promise<SpacesListTasksResult> {
    return this.client.get("/spaces/list_tasks", input);
  }

  async listTools(input: SpacesListToolsInput): Promise<SpacesListToolsResult> {
    return this.client.get("/spaces/list_tools", input);
  }

  async search(input: SpacesSearchInput): Promise<SpacesSearchResult> {
    return this.client.get("/spaces/search", input);
  }

  async searchPotentialMembers(input: SpacesSearchPotentialMembersInput): Promise<SpacesSearchPotentialMembersResult> {
    return this.client.get("/spaces/search_potential_members", input);
  }

  async addMembers(input: SpacesAddMembersInput): Promise<SpacesAddMembersResult> {
    return this.client.post("/spaces/add_members", input);
  }

  async archiveDiscussion(input: SpacesArchiveDiscussionInput): Promise<SpacesArchiveDiscussionResult> {
    return this.client.post("/spaces/archive_discussion", input);
  }

  async create(input: SpacesCreateInput): Promise<SpacesCreateResult> {
    return this.client.post("/spaces/create", input);
  }

  async createDiscussion(input: SpacesCreateDiscussionInput): Promise<SpacesCreateDiscussionResult> {
    return this.client.post("/spaces/create_discussion", input);
  }

  async delete(input: SpacesDeleteInput): Promise<SpacesDeleteResult> {
    return this.client.post("/spaces/delete", input);
  }

  async deleteMember(input: SpacesDeleteMemberInput): Promise<SpacesDeleteMemberResult> {
    return this.client.post("/spaces/delete_member", input);
  }

  async join(input: SpacesJoinInput): Promise<SpacesJoinResult> {
    return this.client.post("/spaces/join", input);
  }

  async publishDiscussion(input: SpacesPublishDiscussionInput): Promise<SpacesPublishDiscussionResult> {
    return this.client.post("/spaces/publish_discussion", input);
  }

  async update(input: SpacesUpdateInput): Promise<SpacesUpdateResult> {
    return this.client.post("/spaces/update", input);
  }

  async updateDiscussion(input: SpacesUpdateDiscussionInput): Promise<SpacesUpdateDiscussionResult> {
    return this.client.post("/spaces/update_discussion", input);
  }

  async updateKanban(input: SpacesUpdateKanbanInput): Promise<SpacesUpdateKanbanResult> {
    return this.client.post("/spaces/update_kanban", input);
  }

  async updateMembersPermissions(
    input: SpacesUpdateMembersPermissionsInput,
  ): Promise<SpacesUpdateMembersPermissionsResult> {
    return this.client.post("/spaces/update_members_permissions", input);
  }

  async updatePermissions(input: SpacesUpdatePermissionsInput): Promise<SpacesUpdatePermissionsResult> {
    return this.client.post("/spaces/update_permissions", input);
  }

  async updateTaskStatuses(input: SpacesUpdateTaskStatusesInput): Promise<SpacesUpdateTaskStatusesResult> {
    return this.client.post("/spaces/update_task_statuses", input);
  }

  async updateTools(input: SpacesUpdateToolsInput): Promise<SpacesUpdateToolsResult> {
    return this.client.post("/spaces/update_tools", input);
  }
}

class ApiNamespaceTasks {
  constructor(private client: ApiClient) {}

  async get(input: TasksGetInput): Promise<TasksGetResult> {
    return this.client.get("/tasks/get", input);
  }

  async list(input: TasksListInput): Promise<TasksListResult> {
    return this.client.get("/tasks/list", input);
  }

  async listPotentialAssignees(input: TasksListPotentialAssigneesInput): Promise<TasksListPotentialAssigneesResult> {
    return this.client.get("/tasks/list_potential_assignees", input);
  }

  async listTaskStatuses(input: TasksListTaskStatusesInput): Promise<TasksListTaskStatusesResult> {
    return this.client.get("/tasks/list_task_statuses", input);
  }

  async create(input: TasksCreateInput): Promise<TasksCreateResult> {
    return this.client.post("/tasks/create", input);
  }

  async delete(input: TasksDeleteInput): Promise<TasksDeleteResult> {
    return this.client.post("/tasks/delete", input);
  }

  async move(input: TasksMoveInput): Promise<TasksMoveResult> {
    return this.client.post("/tasks/move", input);
  }

  async updateAssignee(input: TasksUpdateAssigneeInput): Promise<TasksUpdateAssigneeResult> {
    return this.client.post("/tasks/update_assignee", input);
  }

  async updateDescription(input: TasksUpdateDescriptionInput): Promise<TasksUpdateDescriptionResult> {
    return this.client.post("/tasks/update_description", input);
  }

  async updateDueDate(input: TasksUpdateDueDateInput): Promise<TasksUpdateDueDateResult> {
    return this.client.post("/tasks/update_due_date", input);
  }

  async updateMilestone(input: TasksUpdateMilestoneInput): Promise<TasksUpdateMilestoneResult> {
    return this.client.post("/tasks/update_milestone", input);
  }

  async updateMilestoneAndOrdering(
    input: TasksUpdateMilestoneAndOrderingInput,
  ): Promise<TasksUpdateMilestoneAndOrderingResult> {
    return this.client.post("/tasks/update_milestone_and_ordering", input);
  }

  async updateName(input: TasksUpdateNameInput): Promise<TasksUpdateNameResult> {
    return this.client.post("/tasks/update_name", input);
  }

  async updateReminders(input: TasksUpdateRemindersInput): Promise<TasksUpdateRemindersResult> {
    return this.client.post("/tasks/update_reminders", input);
  }

  async updateStatus(input: TasksUpdateStatusInput): Promise<TasksUpdateStatusResult> {
    return this.client.post("/tasks/update_status", input);
  }
}

class ApiNamespaceProjectTemplates {
  constructor(private client: ApiClient) {}

  async get(input: ProjectTemplatesGetInput): Promise<ProjectTemplatesGetResult> {
    return this.client.get("/project_templates/get", input);
  }

  async getDiscussion(input: ProjectTemplatesGetDiscussionInput): Promise<ProjectTemplatesGetDiscussionResult> {
    return this.client.get("/project_templates/get_discussion", input);
  }

  async list(input: ProjectTemplatesListInput): Promise<ProjectTemplatesListResult> {
    return this.client.get("/project_templates/list", input);
  }

  async listComments(input: ProjectTemplatesListCommentsInput): Promise<ProjectTemplatesListCommentsResult> {
    return this.client.get("/project_templates/list_comments", input);
  }

  async archive(input: ProjectTemplatesArchiveInput): Promise<ProjectTemplatesArchiveResult> {
    return this.client.post("/project_templates/archive", input);
  }

  async create(input: ProjectTemplatesCreateInput): Promise<ProjectTemplatesCreateResult> {
    return this.client.post("/project_templates/create", input);
  }

  async createComment(input: ProjectTemplatesCreateCommentInput): Promise<ProjectTemplatesCreateCommentResult> {
    return this.client.post("/project_templates/create_comment", input);
  }

  async createDiscussion(
    input: ProjectTemplatesCreateDiscussionInput,
  ): Promise<ProjectTemplatesCreateDiscussionResult> {
    return this.client.post("/project_templates/create_discussion", input);
  }

  async createDocument(input: ProjectTemplatesCreateDocumentInput): Promise<ProjectTemplatesCreateDocumentResult> {
    return this.client.post("/project_templates/create_document", input);
  }

  async createFiles(input: ProjectTemplatesCreateFilesInput): Promise<ProjectTemplatesCreateFilesResult> {
    return this.client.post("/project_templates/create_files", input);
  }

  async createFolder(input: ProjectTemplatesCreateFolderInput): Promise<ProjectTemplatesCreateFolderResult> {
    return this.client.post("/project_templates/create_folder", input);
  }

  async createFromProject(
    input: ProjectTemplatesCreateFromProjectInput,
  ): Promise<ProjectTemplatesCreateFromProjectResult> {
    return this.client.post("/project_templates/create_from_project", input);
  }

  async createLink(input: ProjectTemplatesCreateLinkInput): Promise<ProjectTemplatesCreateLinkResult> {
    return this.client.post("/project_templates/create_link", input);
  }

  async createMilestone(input: ProjectTemplatesCreateMilestoneInput): Promise<ProjectTemplatesCreateMilestoneResult> {
    return this.client.post("/project_templates/create_milestone", input);
  }

  async createPerson(input: ProjectTemplatesCreatePersonInput): Promise<ProjectTemplatesCreatePersonResult> {
    return this.client.post("/project_templates/create_person", input);
  }

  async createProject(input: ProjectTemplatesCreateProjectInput): Promise<ProjectTemplatesCreateProjectResult> {
    return this.client.post("/project_templates/create_project", input);
  }

  async createTask(input: ProjectTemplatesCreateTaskInput): Promise<ProjectTemplatesCreateTaskResult> {
    return this.client.post("/project_templates/create_task", input);
  }

  async delete(input: ProjectTemplatesDeleteInput): Promise<ProjectTemplatesDeleteResult> {
    return this.client.post("/project_templates/delete", input);
  }

  async deleteComment(input: ProjectTemplatesDeleteCommentInput): Promise<ProjectTemplatesDeleteCommentResult> {
    return this.client.post("/project_templates/delete_comment", input);
  }

  async deleteMilestone(input: ProjectTemplatesDeleteMilestoneInput): Promise<ProjectTemplatesDeleteMilestoneResult> {
    return this.client.post("/project_templates/delete_milestone", input);
  }

  async deletePerson(input: ProjectTemplatesDeletePersonInput): Promise<ProjectTemplatesDeletePersonResult> {
    return this.client.post("/project_templates/delete_person", input);
  }

  async deleteResource(input: ProjectTemplatesDeleteResourceInput): Promise<ProjectTemplatesDeleteResourceResult> {
    return this.client.post("/project_templates/delete_resource", input);
  }

  async deleteTask(input: ProjectTemplatesDeleteTaskInput): Promise<ProjectTemplatesDeleteTaskResult> {
    return this.client.post("/project_templates/delete_task", input);
  }

  async duplicate(input: ProjectTemplatesDuplicateInput): Promise<ProjectTemplatesDuplicateResult> {
    return this.client.post("/project_templates/duplicate", input);
  }

  async moveResource(input: ProjectTemplatesMoveResourceInput): Promise<ProjectTemplatesMoveResourceResult> {
    return this.client.post("/project_templates/move_resource", input);
  }

  async restore(input: ProjectTemplatesRestoreInput): Promise<ProjectTemplatesRestoreResult> {
    return this.client.post("/project_templates/restore", input);
  }

  async update(input: ProjectTemplatesUpdateInput): Promise<ProjectTemplatesUpdateResult> {
    return this.client.post("/project_templates/update", input);
  }

  async updateComment(input: ProjectTemplatesUpdateCommentInput): Promise<ProjectTemplatesUpdateCommentResult> {
    return this.client.post("/project_templates/update_comment", input);
  }

  async updateDiscussion(
    input: ProjectTemplatesUpdateDiscussionInput,
  ): Promise<ProjectTemplatesUpdateDiscussionResult> {
    return this.client.post("/project_templates/update_discussion", input);
  }

  async updateDocument(input: ProjectTemplatesUpdateDocumentInput): Promise<ProjectTemplatesUpdateDocumentResult> {
    return this.client.post("/project_templates/update_document", input);
  }

  async updateFile(input: ProjectTemplatesUpdateFileInput): Promise<ProjectTemplatesUpdateFileResult> {
    return this.client.post("/project_templates/update_file", input);
  }

  async updateFolder(input: ProjectTemplatesUpdateFolderInput): Promise<ProjectTemplatesUpdateFolderResult> {
    return this.client.post("/project_templates/update_folder", input);
  }

  async updateLink(input: ProjectTemplatesUpdateLinkInput): Promise<ProjectTemplatesUpdateLinkResult> {
    return this.client.post("/project_templates/update_link", input);
  }

  async updateMilestone(input: ProjectTemplatesUpdateMilestoneInput): Promise<ProjectTemplatesUpdateMilestoneResult> {
    return this.client.post("/project_templates/update_milestone", input);
  }

  async updateMilestoneAndOrdering(
    input: ProjectTemplatesUpdateMilestoneAndOrderingInput,
  ): Promise<ProjectTemplatesUpdateMilestoneAndOrderingResult> {
    return this.client.post("/project_templates/update_milestone_and_ordering", input);
  }

  async updatePerson(input: ProjectTemplatesUpdatePersonInput): Promise<ProjectTemplatesUpdatePersonResult> {
    return this.client.post("/project_templates/update_person", input);
  }

  async updateTask(input: ProjectTemplatesUpdateTaskInput): Promise<ProjectTemplatesUpdateTaskResult> {
    return this.client.post("/project_templates/update_task", input);
  }

  async updateTaskAssignees(
    input: ProjectTemplatesUpdateTaskAssigneesInput,
  ): Promise<ProjectTemplatesUpdateTaskAssigneesResult> {
    return this.client.post("/project_templates/update_task_assignees", input);
  }
}

class ApiNamespaceProjects {
  constructor(private client: ApiClient) {}

  async countChildren(input: ProjectsCountChildrenInput): Promise<ProjectsCountChildrenResult> {
    return this.client.get("/projects/count_children", input);
  }

  async get(input: ProjectsGetInput): Promise<ProjectsGetResult> {
    return this.client.get("/projects/get", input);
  }

  async getCheckIn(input: ProjectsGetCheckInInput): Promise<ProjectsGetCheckInResult> {
    return this.client.get("/projects/get_check_in", input);
  }

  async getContributor(input: ProjectsGetContributorInput): Promise<ProjectsGetContributorResult> {
    return this.client.get("/projects/get_contributor", input);
  }

  async getDiscussion(input: ProjectsGetDiscussionInput): Promise<ProjectsGetDiscussionResult> {
    return this.client.get("/projects/get_discussion", input);
  }

  async getMilestone(input: ProjectsGetMilestoneInput): Promise<ProjectsGetMilestoneResult> {
    return this.client.get("/projects/get_milestone", input);
  }

  async getRetrospective(input: ProjectsGetRetrospectiveInput): Promise<ProjectsGetRetrospectiveResult> {
    return this.client.get("/projects/get_retrospective", input);
  }

  async list(input: ProjectsListInput): Promise<ProjectsListResult> {
    return this.client.get("/projects/list", input);
  }

  async listCheckIns(input: ProjectsListCheckInsInput): Promise<ProjectsListCheckInsResult> {
    return this.client.get("/projects/list_check_ins", input);
  }

  async listContributors(input: ProjectsListContributorsInput): Promise<ProjectsListContributorsResult> {
    return this.client.get("/projects/list_contributors", input);
  }

  async listDiscussions(input: ProjectsListDiscussionsInput): Promise<ProjectsListDiscussionsResult> {
    return this.client.get("/projects/list_discussions", input);
  }

  async listMilestoneTasks(input: ProjectsListMilestoneTasksInput): Promise<ProjectsListMilestoneTasksResult> {
    return this.client.get("/projects/list_milestone_tasks", input);
  }

  async listMilestones(input: ProjectsListMilestonesInput): Promise<ProjectsListMilestonesResult> {
    return this.client.get("/projects/list_milestones", input);
  }

  async search(input: ProjectsSearchInput): Promise<ProjectsSearchResult> {
    return this.client.get("/projects/search", input);
  }

  async searchParentGoal(input: ProjectsSearchParentGoalInput): Promise<ProjectsSearchParentGoalResult> {
    return this.client.get("/projects/search_parent_goal", input);
  }

  async searchPotentialContributors(
    input: ProjectsSearchPotentialContributorsInput,
  ): Promise<ProjectsSearchPotentialContributorsResult> {
    return this.client.get("/projects/search_potential_contributors", input);
  }

  async acknowledgeCheckIn(input: ProjectsAcknowledgeCheckInInput): Promise<ProjectsAcknowledgeCheckInResult> {
    return this.client.post("/projects/acknowledge_check_in", input);
  }

  async acknowledgeRetrospective(
    input: ProjectsAcknowledgeRetrospectiveInput,
  ): Promise<ProjectsAcknowledgeRetrospectiveResult> {
    return this.client.post("/projects/acknowledge_retrospective", input);
  }

  async close(input: ProjectsCloseInput): Promise<ProjectsCloseResult> {
    return this.client.post("/projects/close", input);
  }

  async create(input: ProjectsCreateInput): Promise<ProjectsCreateResult> {
    return this.client.post("/projects/create", input);
  }

  async createCheckIn(input: ProjectsCreateCheckInInput): Promise<ProjectsCreateCheckInResult> {
    return this.client.post("/projects/create_check_in", input);
  }

  async createContributor(input: ProjectsCreateContributorInput): Promise<ProjectsCreateContributorResult> {
    return this.client.post("/projects/create_contributor", input);
  }

  async createContributors(input: ProjectsCreateContributorsInput): Promise<ProjectsCreateContributorsResult> {
    return this.client.post("/projects/create_contributors", input);
  }

  async createDiscussion(input: ProjectsCreateDiscussionInput): Promise<ProjectsCreateDiscussionResult> {
    return this.client.post("/projects/create_discussion", input);
  }

  async createMilestone(input: ProjectsCreateMilestoneInput): Promise<ProjectsCreateMilestoneResult> {
    return this.client.post("/projects/create_milestone", input);
  }

  async createMilestoneComment(
    input: ProjectsCreateMilestoneCommentInput,
  ): Promise<ProjectsCreateMilestoneCommentResult> {
    return this.client.post("/projects/create_milestone_comment", input);
  }

  async delete(input: ProjectsDeleteInput): Promise<ProjectsDeleteResult> {
    return this.client.post("/projects/delete", input);
  }

  async deleteCheckIn(input: ProjectsDeleteCheckInInput): Promise<ProjectsDeleteCheckInResult> {
    return this.client.post("/projects/delete_check_in", input);
  }

  async deleteContributor(input: ProjectsDeleteContributorInput): Promise<ProjectsDeleteContributorResult> {
    return this.client.post("/projects/delete_contributor", input);
  }

  async deleteMilestone(input: ProjectsDeleteMilestoneInput): Promise<ProjectsDeleteMilestoneResult> {
    return this.client.post("/projects/delete_milestone", input);
  }

  async moveToSpace(input: ProjectsMoveToSpaceInput): Promise<ProjectsMoveToSpaceResult> {
    return this.client.post("/projects/move_to_space", input);
  }

  async pause(input: ProjectsPauseInput): Promise<ProjectsPauseResult> {
    return this.client.post("/projects/pause", input);
  }

  async resume(input: ProjectsResumeInput): Promise<ProjectsResumeResult> {
    return this.client.post("/projects/resume", input);
  }

  async updateChampion(input: ProjectsUpdateChampionInput): Promise<ProjectsUpdateChampionResult> {
    return this.client.post("/projects/update_champion", input);
  }

  async updateCheckIn(input: ProjectsUpdateCheckInInput): Promise<ProjectsUpdateCheckInResult> {
    return this.client.post("/projects/update_check_in", input);
  }

  async updateContributor(input: ProjectsUpdateContributorInput): Promise<ProjectsUpdateContributorResult> {
    return this.client.post("/projects/update_contributor", input);
  }

  async updateDescription(input: ProjectsUpdateDescriptionInput): Promise<ProjectsUpdateDescriptionResult> {
    return this.client.post("/projects/update_description", input);
  }

  async updateDiscussion(input: ProjectsUpdateDiscussionInput): Promise<ProjectsUpdateDiscussionResult> {
    return this.client.post("/projects/update_discussion", input);
  }

  async updateDueDate(input: ProjectsUpdateDueDateInput): Promise<ProjectsUpdateDueDateResult> {
    return this.client.post("/projects/update_due_date", input);
  }

  async updateKanban(input: ProjectsUpdateKanbanInput): Promise<ProjectsUpdateKanbanResult> {
    return this.client.post("/projects/update_kanban", input);
  }

  async updateMilestone(input: ProjectsUpdateMilestoneInput): Promise<ProjectsUpdateMilestoneResult> {
    return this.client.post("/projects/update_milestone", input);
  }

  async updateMilestoneDescription(
    input: ProjectsUpdateMilestoneDescriptionInput,
  ): Promise<ProjectsUpdateMilestoneDescriptionResult> {
    return this.client.post("/projects/update_milestone_description", input);
  }

  async updateMilestoneDueDate(
    input: ProjectsUpdateMilestoneDueDateInput,
  ): Promise<ProjectsUpdateMilestoneDueDateResult> {
    return this.client.post("/projects/update_milestone_due_date", input);
  }

  async updateMilestoneKanban(input: ProjectsUpdateMilestoneKanbanInput): Promise<ProjectsUpdateMilestoneKanbanResult> {
    return this.client.post("/projects/update_milestone_kanban", input);
  }

  async updateMilestoneOrdering(
    input: ProjectsUpdateMilestoneOrderingInput,
  ): Promise<ProjectsUpdateMilestoneOrderingResult> {
    return this.client.post("/projects/update_milestone_ordering", input);
  }

  async updateMilestoneTitle(input: ProjectsUpdateMilestoneTitleInput): Promise<ProjectsUpdateMilestoneTitleResult> {
    return this.client.post("/projects/update_milestone_title", input);
  }

  async updateName(input: ProjectsUpdateNameInput): Promise<ProjectsUpdateNameResult> {
    return this.client.post("/projects/update_name", input);
  }

  async updateParentGoal(input: ProjectsUpdateParentGoalInput): Promise<ProjectsUpdateParentGoalResult> {
    return this.client.post("/projects/update_parent_goal", input);
  }

  async updatePermissions(input: ProjectsUpdatePermissionsInput): Promise<ProjectsUpdatePermissionsResult> {
    return this.client.post("/projects/update_permissions", input);
  }

  async updateRetrospective(input: ProjectsUpdateRetrospectiveInput): Promise<ProjectsUpdateRetrospectiveResult> {
    return this.client.post("/projects/update_retrospective", input);
  }

  async updateReviewer(input: ProjectsUpdateReviewerInput): Promise<ProjectsUpdateReviewerResult> {
    return this.client.post("/projects/update_reviewer", input);
  }

  async updateStartDate(input: ProjectsUpdateStartDateInput): Promise<ProjectsUpdateStartDateResult> {
    return this.client.post("/projects/update_start_date", input);
  }

  async updateTaskStatuses(input: ProjectsUpdateTaskStatusesInput): Promise<ProjectsUpdateTaskStatusesResult> {
    return this.client.post("/projects/update_task_statuses", input);
  }

  async updateTasksView(input: ProjectsUpdateTasksViewInput): Promise<ProjectsUpdateTasksViewResult> {
    return this.client.post("/projects/update_tasks_view", input);
  }
}

class ApiNamespaceGoals {
  constructor(private client: ApiClient) {}

  async countChildren(input: GoalsCountChildrenInput): Promise<GoalsCountChildrenResult> {
    return this.client.get("/goals/count_children", input);
  }

  async get(input: GoalsGetInput): Promise<GoalsGetResult> {
    return this.client.get("/goals/get", input);
  }

  async getCheckIn(input: GoalsGetCheckInInput): Promise<GoalsGetCheckInResult> {
    return this.client.get("/goals/get_check_in", input);
  }

  async list(input: GoalsListInput): Promise<GoalsListResult> {
    return this.client.get("/goals/list", input);
  }

  async listAccessMembers(input: GoalsListAccessMembersInput): Promise<GoalsListAccessMembersResult> {
    return this.client.get("/goals/list_access_members", input);
  }

  async listCheckIns(input: GoalsListCheckInsInput): Promise<GoalsListCheckInsResult> {
    return this.client.get("/goals/list_check_ins", input);
  }

  async listContributors(input: GoalsListContributorsInput): Promise<GoalsListContributorsResult> {
    return this.client.get("/goals/list_contributors", input);
  }

  async listDiscussions(input: GoalsListDiscussionsInput): Promise<GoalsListDiscussionsResult> {
    return this.client.get("/goals/list_discussions", input);
  }

  async searchParentGoal(input: GoalsSearchParentGoalInput): Promise<GoalsSearchParentGoalResult> {
    return this.client.get("/goals/search_parent_goal", input);
  }

  async acknowledgeCheckIn(input: GoalsAcknowledgeCheckInInput): Promise<GoalsAcknowledgeCheckInResult> {
    return this.client.post("/goals/acknowledge_check_in", input);
  }

  async acknowledgeRetrospective(
    input: GoalsAcknowledgeRetrospectiveInput,
  ): Promise<GoalsAcknowledgeRetrospectiveResult> {
    return this.client.post("/goals/acknowledge_retrospective", input);
  }

  async changeParent(input: GoalsChangeParentInput): Promise<GoalsChangeParentResult> {
    return this.client.post("/goals/change_parent", input);
  }

  async close(input: GoalsCloseInput): Promise<GoalsCloseResult> {
    return this.client.post("/goals/close", input);
  }

  async create(input: GoalsCreateInput): Promise<GoalsCreateResult> {
    return this.client.post("/goals/create", input);
  }

  async createAccessMembers(input: GoalsCreateAccessMembersInput): Promise<GoalsCreateAccessMembersResult> {
    return this.client.post("/goals/create_access_members", input);
  }

  async createCheck(input: GoalsCreateCheckInput): Promise<GoalsCreateCheckResult> {
    return this.client.post("/goals/create_check", input);
  }

  async createCheckIn(input: GoalsCreateCheckInInput): Promise<GoalsCreateCheckInResult> {
    return this.client.post("/goals/create_check_in", input);
  }

  async createDiscussion(input: GoalsCreateDiscussionInput): Promise<GoalsCreateDiscussionResult> {
    return this.client.post("/goals/create_discussion", input);
  }

  async createTarget(input: GoalsCreateTargetInput): Promise<GoalsCreateTargetResult> {
    return this.client.post("/goals/create_target", input);
  }

  async delete(input: GoalsDeleteInput): Promise<GoalsDeleteResult> {
    return this.client.post("/goals/delete", input);
  }

  async deleteAccessMember(input: GoalsDeleteAccessMemberInput): Promise<GoalsDeleteAccessMemberResult> {
    return this.client.post("/goals/delete_access_member", input);
  }

  async deleteCheck(input: GoalsDeleteCheckInput): Promise<GoalsDeleteCheckResult> {
    return this.client.post("/goals/delete_check", input);
  }

  async deleteCheckIn(input: GoalsDeleteCheckInInput): Promise<GoalsDeleteCheckInResult> {
    return this.client.post("/goals/delete_check_in", input);
  }

  async deleteTarget(input: GoalsDeleteTargetInput): Promise<GoalsDeleteTargetResult> {
    return this.client.post("/goals/delete_target", input);
  }

  async reopen(input: GoalsReopenInput): Promise<GoalsReopenResult> {
    return this.client.post("/goals/reopen", input);
  }

  async toggleCheck(input: GoalsToggleCheckInput): Promise<GoalsToggleCheckResult> {
    return this.client.post("/goals/toggle_check", input);
  }

  async updateAccessLevels(input: GoalsUpdateAccessLevelsInput): Promise<GoalsUpdateAccessLevelsResult> {
    return this.client.post("/goals/update_access_levels", input);
  }

  async updateAccessMember(input: GoalsUpdateAccessMemberInput): Promise<GoalsUpdateAccessMemberResult> {
    return this.client.post("/goals/update_access_member", input);
  }

  async updateChampion(input: GoalsUpdateChampionInput): Promise<GoalsUpdateChampionResult> {
    return this.client.post("/goals/update_champion", input);
  }

  async updateCheck(input: GoalsUpdateCheckInput): Promise<GoalsUpdateCheckResult> {
    return this.client.post("/goals/update_check", input);
  }

  async updateCheckIn(input: GoalsUpdateCheckInInput): Promise<GoalsUpdateCheckInResult> {
    return this.client.post("/goals/update_check_in", input);
  }

  async updateCheckIndex(input: GoalsUpdateCheckIndexInput): Promise<GoalsUpdateCheckIndexResult> {
    return this.client.post("/goals/update_check_index", input);
  }

  async updateDescription(input: GoalsUpdateDescriptionInput): Promise<GoalsUpdateDescriptionResult> {
    return this.client.post("/goals/update_description", input);
  }

  async updateDiscussion(input: GoalsUpdateDiscussionInput): Promise<GoalsUpdateDiscussionResult> {
    return this.client.post("/goals/update_discussion", input);
  }

  async updateDueDate(input: GoalsUpdateDueDateInput): Promise<GoalsUpdateDueDateResult> {
    return this.client.post("/goals/update_due_date", input);
  }

  async updateName(input: GoalsUpdateNameInput): Promise<GoalsUpdateNameResult> {
    return this.client.post("/goals/update_name", input);
  }

  async updateParentGoal(input: GoalsUpdateParentGoalInput): Promise<GoalsUpdateParentGoalResult> {
    return this.client.post("/goals/update_parent_goal", input);
  }

  async updateReviewer(input: GoalsUpdateReviewerInput): Promise<GoalsUpdateReviewerResult> {
    return this.client.post("/goals/update_reviewer", input);
  }

  async updateSpace(input: GoalsUpdateSpaceInput): Promise<GoalsUpdateSpaceResult> {
    return this.client.post("/goals/update_space", input);
  }

  async updateStartDate(input: GoalsUpdateStartDateInput): Promise<GoalsUpdateStartDateResult> {
    return this.client.post("/goals/update_start_date", input);
  }

  async updateTarget(input: GoalsUpdateTargetInput): Promise<GoalsUpdateTargetResult> {
    return this.client.post("/goals/update_target", input);
  }

  async updateTargetIndex(input: GoalsUpdateTargetIndexInput): Promise<GoalsUpdateTargetIndexResult> {
    return this.client.post("/goals/update_target_index", input);
  }

  async updateTargetValue(input: GoalsUpdateTargetValueInput): Promise<GoalsUpdateTargetValueResult> {
    return this.client.post("/goals/update_target_value", input);
  }
}

class ApiNamespaceReactions {
  constructor(private client: ApiClient) {}

  async create(input: ReactionsCreateInput): Promise<ReactionsCreateResult> {
    return this.client.post("/reactions/create", input);
  }

  async delete(input: ReactionsDeleteInput): Promise<ReactionsDeleteResult> {
    return this.client.post("/reactions/delete", input);
  }
}

export class ApiClient {
  private basePath: string;
  private headers: any;
  public apiNamespaceCompanyTransfers: ApiNamespaceCompanyTransfers;
  public apiNamespaceCliAuth: ApiNamespaceCliAuth;
  public apiNamespaceMcpGrants: ApiNamespaceMcpGrants;
  public apiNamespaceApiTokens: ApiNamespaceApiTokens;
  public apiNamespaceInvitations: ApiNamespaceInvitations;
  public apiNamespaceProductReleases: ApiNamespaceProductReleases;
  public apiNamespaceSiteMessages: ApiNamespaceSiteMessages;
  public apiNamespaceBilling: ApiNamespaceBilling;
  public apiNamespaceRoot: ApiNamespaceRoot;
  public apiNamespaceNotifications: ApiNamespaceNotifications;
  public apiNamespaceFiles: ApiNamespaceFiles;
  public apiNamespaceLinks: ApiNamespaceLinks;
  public apiNamespaceDocuments: ApiNamespaceDocuments;
  public apiNamespaceResourceHubs: ApiNamespaceResourceHubs;
  public apiNamespaceComments: ApiNamespaceComments;
  public apiNamespaceCompanies: ApiNamespaceCompanies;
  public apiNamespacePeople: ApiNamespacePeople;
  public apiNamespaceKpis: ApiNamespaceKpis;
  public apiNamespaceSpaces: ApiNamespaceSpaces;
  public apiNamespaceTasks: ApiNamespaceTasks;
  public apiNamespaceProjectTemplates: ApiNamespaceProjectTemplates;
  public apiNamespaceProjects: ApiNamespaceProjects;
  public apiNamespaceGoals: ApiNamespaceGoals;
  public apiNamespaceReactions: ApiNamespaceReactions;

  constructor() {
    this.apiNamespaceCompanyTransfers = new ApiNamespaceCompanyTransfers(this);
    this.apiNamespaceCliAuth = new ApiNamespaceCliAuth(this);
    this.apiNamespaceMcpGrants = new ApiNamespaceMcpGrants(this);
    this.apiNamespaceApiTokens = new ApiNamespaceApiTokens(this);
    this.apiNamespaceInvitations = new ApiNamespaceInvitations(this);
    this.apiNamespaceProductReleases = new ApiNamespaceProductReleases(this);
    this.apiNamespaceSiteMessages = new ApiNamespaceSiteMessages(this);
    this.apiNamespaceBilling = new ApiNamespaceBilling(this);
    this.apiNamespaceRoot = new ApiNamespaceRoot(this);
    this.apiNamespaceNotifications = new ApiNamespaceNotifications(this);
    this.apiNamespaceFiles = new ApiNamespaceFiles(this);
    this.apiNamespaceLinks = new ApiNamespaceLinks(this);
    this.apiNamespaceDocuments = new ApiNamespaceDocuments(this);
    this.apiNamespaceResourceHubs = new ApiNamespaceResourceHubs(this);
    this.apiNamespaceComments = new ApiNamespaceComments(this);
    this.apiNamespaceCompanies = new ApiNamespaceCompanies(this);
    this.apiNamespacePeople = new ApiNamespacePeople(this);
    this.apiNamespaceKpis = new ApiNamespaceKpis(this);
    this.apiNamespaceSpaces = new ApiNamespaceSpaces(this);
    this.apiNamespaceTasks = new ApiNamespaceTasks(this);
    this.apiNamespaceProjectTemplates = new ApiNamespaceProjectTemplates(this);
    this.apiNamespaceProjects = new ApiNamespaceProjects(this);
    this.apiNamespaceGoals = new ApiNamespaceGoals(this);
    this.apiNamespaceReactions = new ApiNamespaceReactions(this);
  }

  setBasePath(basePath: string) {
    this.basePath = basePath;
  }

  getBasePath() {
    if (!this.basePath) throw new Error("ApiClient is not configured");
    return this.basePath;
  }

  setHeaders(headers: any) {
    this.headers = headers;
  }

  getHeaders() {
    return this.headers || {};
  }

  // @ts-ignore
  async post(path: string, data: any) {
    try {
      const response = await axios.post(this.getBasePath() + path, toSnake(data), { headers: this.getHeaders() });
      return toCamel(response.data);
    } catch (error) {
      handleStaleClientError(error);
      throw error;
    }
  }

  // @ts-ignore
  async get(path: string, params: any) {
    try {
      const response = await axios.get(this.getBasePath() + path, {
        params: toSnake(params),
        headers: this.getHeaders(),
      });
      return toCamel(response.data);
    } catch (error) {
      handleStaleClientError(error);
      throw error;
    }
  }

  getTheme(input: GetThemeInput): Promise<GetThemeResult> {
    return this.apiNamespaceRoot.getTheme(input);
  }

  addCompanyOwners(input: AddCompanyOwnersInput): Promise<AddCompanyOwnersResult> {
    return this.apiNamespaceRoot.addCompanyOwners(input);
  }

  addCompanyTrustedEmailDomain(input: AddCompanyTrustedEmailDomainInput): Promise<AddCompanyTrustedEmailDomainResult> {
    return this.apiNamespaceRoot.addCompanyTrustedEmailDomain(input);
  }

  addFirstCompany(input: AddFirstCompanyInput): Promise<AddFirstCompanyResult> {
    return this.apiNamespaceRoot.addFirstCompany(input);
  }

  changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    return this.apiNamespaceRoot.changePassword(input);
  }

  completeCompanySetup(input: CompleteCompanySetupInput): Promise<CompleteCompanySetupResult> {
    return this.apiNamespaceRoot.completeCompanySetup(input);
  }

  createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
    return this.apiNamespaceRoot.createAccount(input);
  }

  createAvatarBlob(input: CreateAvatarBlobInput): Promise<CreateAvatarBlobResult> {
    return this.apiNamespaceRoot.createAvatarBlob(input);
  }

  createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
    return this.apiNamespaceRoot.createBlob(input);
  }

  createEmailActivationCode(input: CreateEmailActivationCodeInput): Promise<CreateEmailActivationCodeResult> {
    return this.apiNamespaceRoot.createEmailActivationCode(input);
  }

  deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
    return this.apiNamespaceRoot.deleteCompany(input);
  }

  joinCompany(input: JoinCompanyInput): Promise<JoinCompanyResult> {
    return this.apiNamespaceRoot.joinCompany(input);
  }

  markBlobUploaded(input: MarkBlobUploadedInput): Promise<MarkBlobUploadedResult> {
    return this.apiNamespaceRoot.markBlobUploaded(input);
  }

  requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    return this.apiNamespaceRoot.requestPasswordReset(input);
  }

  resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    return this.apiNamespaceRoot.resetPassword(input);
  }
}

function buildApiQueryKeyPrefix(client: ApiClient, path: string) {
  return ["operately-api", client.getBasePath(), client.getHeaders(), path] as const;
}

function buildApiQueryKey<InputT>(client: ApiClient, path: string, input: InputT) {
  return [...buildApiQueryKeyPrefix(client, path), input] as const;
}

const defaultApiClient = new ApiClient();

export async function getTheme(input: GetThemeInput): Promise<GetThemeResult> {
  return defaultApiClient.getTheme(input);
}
export async function addCompanyOwners(input: AddCompanyOwnersInput): Promise<AddCompanyOwnersResult> {
  return defaultApiClient.addCompanyOwners(input);
}
export async function addCompanyTrustedEmailDomain(
  input: AddCompanyTrustedEmailDomainInput,
): Promise<AddCompanyTrustedEmailDomainResult> {
  return defaultApiClient.addCompanyTrustedEmailDomain(input);
}
export async function addFirstCompany(input: AddFirstCompanyInput): Promise<AddFirstCompanyResult> {
  return defaultApiClient.addFirstCompany(input);
}
export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  return defaultApiClient.changePassword(input);
}
export async function completeCompanySetup(input: CompleteCompanySetupInput): Promise<CompleteCompanySetupResult> {
  return defaultApiClient.completeCompanySetup(input);
}
export async function createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
  return defaultApiClient.createAccount(input);
}
export async function createAvatarBlob(input: CreateAvatarBlobInput): Promise<CreateAvatarBlobResult> {
  return defaultApiClient.createAvatarBlob(input);
}
export async function createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
  return defaultApiClient.createBlob(input);
}
export async function createEmailActivationCode(
  input: CreateEmailActivationCodeInput,
): Promise<CreateEmailActivationCodeResult> {
  return defaultApiClient.createEmailActivationCode(input);
}
export async function deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
  return defaultApiClient.deleteCompany(input);
}
export async function joinCompany(input: JoinCompanyInput): Promise<JoinCompanyResult> {
  return defaultApiClient.joinCompany(input);
}
export async function markBlobUploaded(input: MarkBlobUploadedInput): Promise<MarkBlobUploadedResult> {
  return defaultApiClient.markBlobUploaded(input);
}
export async function requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
  return defaultApiClient.requestPasswordReset(input);
}
export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  return defaultApiClient.resetPassword(input);
}

export function getThemeQueryKeyPrefix() {
  return buildApiQueryKeyPrefix(defaultApiClient, "/get_theme");
}

export function getThemeQueryKey(input: GetThemeInput) {
  return buildApiQueryKey(defaultApiClient, "/get_theme", input);
}

export function getThemeQueryOptions(input: GetThemeInput) {
  return queryOptions({
    queryKey: getThemeQueryKey(input),
    queryFn: () => defaultApiClient.getTheme(input),
    staleTime: "static",
    refetchOnMount: true,
  });
}

export function getThemeQuery(input: GetThemeInput) {
  return queryClient.query(getThemeQueryOptions(input));
}

export function addCompanyOwnersMutationOptions() {
  return mutationOptions({
    mutationFn: (input: AddCompanyOwnersInput) => defaultApiClient.addCompanyOwners(input),
  });
}

export function addCompanyTrustedEmailDomainMutationOptions() {
  return mutationOptions({
    mutationFn: (input: AddCompanyTrustedEmailDomainInput) => defaultApiClient.addCompanyTrustedEmailDomain(input),
  });
}

export function addFirstCompanyMutationOptions() {
  return mutationOptions({
    mutationFn: (input: AddFirstCompanyInput) => defaultApiClient.addFirstCompany(input),
  });
}

export function changePasswordMutationOptions() {
  return mutationOptions({
    mutationFn: (input: ChangePasswordInput) => defaultApiClient.changePassword(input),
  });
}

export function completeCompanySetupMutationOptions() {
  return mutationOptions({
    mutationFn: (input: CompleteCompanySetupInput) => defaultApiClient.completeCompanySetup(input),
  });
}

export function createAccountMutationOptions() {
  return mutationOptions({
    mutationFn: (input: CreateAccountInput) => defaultApiClient.createAccount(input),
  });
}

export function createAvatarBlobMutationOptions() {
  return mutationOptions({
    mutationFn: (input: CreateAvatarBlobInput) => defaultApiClient.createAvatarBlob(input),
  });
}

export function createBlobMutationOptions() {
  return mutationOptions({
    mutationFn: (input: CreateBlobInput) => defaultApiClient.createBlob(input),
  });
}

export function createEmailActivationCodeMutationOptions() {
  return mutationOptions({
    mutationFn: (input: CreateEmailActivationCodeInput) => defaultApiClient.createEmailActivationCode(input),
  });
}

export function deleteCompanyMutationOptions() {
  return mutationOptions({
    mutationFn: (input: DeleteCompanyInput) => defaultApiClient.deleteCompany(input),
  });
}

export function joinCompanyMutationOptions() {
  return mutationOptions({
    mutationFn: (input: JoinCompanyInput) => defaultApiClient.joinCompany(input),
  });
}

export function markBlobUploadedMutationOptions() {
  return mutationOptions({
    mutationFn: (input: MarkBlobUploadedInput) => defaultApiClient.markBlobUploaded(input),
  });
}

export function requestPasswordResetMutationOptions() {
  return mutationOptions({
    mutationFn: (input: RequestPasswordResetInput) => defaultApiClient.requestPasswordReset(input),
  });
}

export function resetPasswordMutationOptions() {
  return mutationOptions({
    mutationFn: (input: ResetPasswordInput) => defaultApiClient.resetPassword(input),
  });
}

export function useGetTheme(input: GetThemeInput): UseQueryHookResult<GetThemeResult> {
  return useQuery<GetThemeResult>(() => defaultApiClient.getTheme(input));
}

export function useAddCompanyOwners(): UseMutationHookResult<AddCompanyOwnersInput, AddCompanyOwnersResult> {
  return useMutation<AddCompanyOwnersInput, AddCompanyOwnersResult>((input) =>
    defaultApiClient.addCompanyOwners(input),
  );
}

export function useAddCompanyTrustedEmailDomain(): UseMutationHookResult<
  AddCompanyTrustedEmailDomainInput,
  AddCompanyTrustedEmailDomainResult
> {
  return useMutation<AddCompanyTrustedEmailDomainInput, AddCompanyTrustedEmailDomainResult>((input) =>
    defaultApiClient.addCompanyTrustedEmailDomain(input),
  );
}

export function useAddFirstCompany(): UseMutationHookResult<AddFirstCompanyInput, AddFirstCompanyResult> {
  return useMutation<AddFirstCompanyInput, AddFirstCompanyResult>((input) => defaultApiClient.addFirstCompany(input));
}

export function useChangePassword(): UseMutationHookResult<ChangePasswordInput, ChangePasswordResult> {
  return useMutation<ChangePasswordInput, ChangePasswordResult>((input) => defaultApiClient.changePassword(input));
}

export function useCompleteCompanySetup(): UseMutationHookResult<
  CompleteCompanySetupInput,
  CompleteCompanySetupResult
> {
  return useMutation<CompleteCompanySetupInput, CompleteCompanySetupResult>((input) =>
    defaultApiClient.completeCompanySetup(input),
  );
}

export function useCreateAccount(): UseMutationHookResult<CreateAccountInput, CreateAccountResult> {
  return useMutation<CreateAccountInput, CreateAccountResult>((input) => defaultApiClient.createAccount(input));
}

export function useCreateAvatarBlob(): UseMutationHookResult<CreateAvatarBlobInput, CreateAvatarBlobResult> {
  return useMutation<CreateAvatarBlobInput, CreateAvatarBlobResult>((input) =>
    defaultApiClient.createAvatarBlob(input),
  );
}

export function useCreateBlob(): UseMutationHookResult<CreateBlobInput, CreateBlobResult> {
  return useMutation<CreateBlobInput, CreateBlobResult>((input) => defaultApiClient.createBlob(input));
}

export function useCreateEmailActivationCode(): UseMutationHookResult<
  CreateEmailActivationCodeInput,
  CreateEmailActivationCodeResult
> {
  return useMutation<CreateEmailActivationCodeInput, CreateEmailActivationCodeResult>((input) =>
    defaultApiClient.createEmailActivationCode(input),
  );
}

export function useDeleteCompany(): UseMutationHookResult<DeleteCompanyInput, DeleteCompanyResult> {
  return useMutation<DeleteCompanyInput, DeleteCompanyResult>((input) => defaultApiClient.deleteCompany(input));
}

export function useJoinCompany(): UseMutationHookResult<JoinCompanyInput, JoinCompanyResult> {
  return useMutation<JoinCompanyInput, JoinCompanyResult>((input) => defaultApiClient.joinCompany(input));
}

export function useMarkBlobUploaded(): UseMutationHookResult<MarkBlobUploadedInput, MarkBlobUploadedResult> {
  return useMutation<MarkBlobUploadedInput, MarkBlobUploadedResult>((input) =>
    defaultApiClient.markBlobUploaded(input),
  );
}

export function useRequestPasswordReset(): UseMutationHookResult<
  RequestPasswordResetInput,
  RequestPasswordResetResult
> {
  return useMutation<RequestPasswordResetInput, RequestPasswordResetResult>((input) =>
    defaultApiClient.requestPasswordReset(input),
  );
}

export function useResetPassword(): UseMutationHookResult<ResetPasswordInput, ResetPasswordResult> {
  return useMutation<ResetPasswordInput, ResetPasswordResult>((input) => defaultApiClient.resetPassword(input));
}

export default {
  default: defaultApiClient,

  getTheme,
  useGetTheme,
  getThemeQueryKeyPrefix,
  getThemeQueryKey,
  getThemeQueryOptions,
  getThemeQuery,
  addCompanyOwners,
  useAddCompanyOwners,
  addCompanyOwnersMutationOptions,
  addCompanyTrustedEmailDomain,
  useAddCompanyTrustedEmailDomain,
  addCompanyTrustedEmailDomainMutationOptions,
  addFirstCompany,
  useAddFirstCompany,
  addFirstCompanyMutationOptions,
  changePassword,
  useChangePassword,
  changePasswordMutationOptions,
  completeCompanySetup,
  useCompleteCompanySetup,
  completeCompanySetupMutationOptions,
  createAccount,
  useCreateAccount,
  createAccountMutationOptions,
  createAvatarBlob,
  useCreateAvatarBlob,
  createAvatarBlobMutationOptions,
  createBlob,
  useCreateBlob,
  createBlobMutationOptions,
  createEmailActivationCode,
  useCreateEmailActivationCode,
  createEmailActivationCodeMutationOptions,
  deleteCompany,
  useDeleteCompany,
  deleteCompanyMutationOptions,
  joinCompany,
  useJoinCompany,
  joinCompanyMutationOptions,
  markBlobUploaded,
  useMarkBlobUploaded,
  markBlobUploadedMutationOptions,
  requestPasswordReset,
  useRequestPasswordReset,
  requestPasswordResetMutationOptions,
  resetPassword,
  useResetPassword,
  resetPasswordMutationOptions,

  company_transfers: {
    listExportRuns: (input: CompanyTransfersListExportRunsInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.listExportRuns(input),
    useListExportRuns: (input: CompanyTransfersListExportRunsInput) =>
      useQuery<CompanyTransfersListExportRunsResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.listExportRuns(input),
      ),
    listExportRunsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/company_transfers/list_export_runs"),
    listExportRunsQueryKey: (input: CompanyTransfersListExportRunsInput) =>
      buildApiQueryKey(defaultApiClient, "/company_transfers/list_export_runs", input),
    listExportRunsQueryOptions: (input: CompanyTransfersListExportRunsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/list_export_runs", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.listExportRuns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listExportRunsQuery: (input: CompanyTransfersListExportRunsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/list_export_runs", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.listExportRuns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getImportRun: (input: CompanyTransfersGetImportRunInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.getImportRun(input),
    useGetImportRun: (input: CompanyTransfersGetImportRunInput) =>
      useQuery<CompanyTransfersGetImportRunResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.getImportRun(input),
      ),
    getImportRunQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/company_transfers/get_import_run"),
    getImportRunQueryKey: (input: CompanyTransfersGetImportRunInput) =>
      buildApiQueryKey(defaultApiClient, "/company_transfers/get_import_run", input),
    getImportRunQueryOptions: (input: CompanyTransfersGetImportRunInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/get_import_run", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.getImportRun(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getImportRunQuery: (input: CompanyTransfersGetImportRunInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/get_import_run", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.getImportRun(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listImportRuns: (input: CompanyTransfersListImportRunsInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.listImportRuns(input),
    useListImportRuns: (input: CompanyTransfersListImportRunsInput) =>
      useQuery<CompanyTransfersListImportRunsResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.listImportRuns(input),
      ),
    listImportRunsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/company_transfers/list_import_runs"),
    listImportRunsQueryKey: (input: CompanyTransfersListImportRunsInput) =>
      buildApiQueryKey(defaultApiClient, "/company_transfers/list_import_runs", input),
    listImportRunsQueryOptions: (input: CompanyTransfersListImportRunsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/list_import_runs", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.listImportRuns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listImportRunsQuery: (input: CompanyTransfersListImportRunsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/list_import_runs", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.listImportRuns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getExportRun: (input: CompanyTransfersGetExportRunInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.getExportRun(input),
    useGetExportRun: (input: CompanyTransfersGetExportRunInput) =>
      useQuery<CompanyTransfersGetExportRunResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.getExportRun(input),
      ),
    getExportRunQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/company_transfers/get_export_run"),
    getExportRunQueryKey: (input: CompanyTransfersGetExportRunInput) =>
      buildApiQueryKey(defaultApiClient, "/company_transfers/get_export_run", input),
    getExportRunQueryOptions: (input: CompanyTransfersGetExportRunInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/get_export_run", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.getExportRun(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getExportRunQuery: (input: CompanyTransfersGetExportRunInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/company_transfers/get_export_run", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanyTransfers.getExportRun(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    createImportArtifactBlobs: (input: CompanyTransfersCreateImportArtifactBlobsInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.createImportArtifactBlobs(input),
    useCreateImportArtifactBlobs: () =>
      useMutation<CompanyTransfersCreateImportArtifactBlobsInput, CompanyTransfersCreateImportArtifactBlobsResult>(
        (input) => defaultApiClient.apiNamespaceCompanyTransfers.createImportArtifactBlobs(input),
      ),
    createImportArtifactBlobsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompanyTransfersCreateImportArtifactBlobsInput) =>
          defaultApiClient.apiNamespaceCompanyTransfers.createImportArtifactBlobs(input),
      }),

    startImport: (input: CompanyTransfersStartImportInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.startImport(input),
    useStartImport: () =>
      useMutation<CompanyTransfersStartImportInput, CompanyTransfersStartImportResult>((input) =>
        defaultApiClient.apiNamespaceCompanyTransfers.startImport(input),
      ),
    startImportMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompanyTransfersStartImportInput) =>
          defaultApiClient.apiNamespaceCompanyTransfers.startImport(input),
      }),

    startExport: (input: CompanyTransfersStartExportInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.startExport(input),
    useStartExport: () =>
      useMutation<CompanyTransfersStartExportInput, CompanyTransfersStartExportResult>((input) =>
        defaultApiClient.apiNamespaceCompanyTransfers.startExport(input),
      ),
    startExportMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompanyTransfersStartExportInput) =>
          defaultApiClient.apiNamespaceCompanyTransfers.startExport(input),
      }),
  },

  cli_auth: {
    status: (input: CliAuthStatusInput) => defaultApiClient.apiNamespaceCliAuth.status(input),
    useStatus: (input: CliAuthStatusInput) =>
      useQuery<CliAuthStatusResult>(() => defaultApiClient.apiNamespaceCliAuth.status(input)),
    statusQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/cli_auth/status"),
    statusQueryKey: (input: CliAuthStatusInput) => buildApiQueryKey(defaultApiClient, "/cli_auth/status", input),
    statusQueryOptions: (input: CliAuthStatusInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/cli_auth/status", input),
        queryFn: () => defaultApiClient.apiNamespaceCliAuth.status(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    statusQuery: (input: CliAuthStatusInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/cli_auth/status", input),
        queryFn: () => defaultApiClient.apiNamespaceCliAuth.status(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    companyCreationStatus: (input: CliAuthCompanyCreationStatusInput) =>
      defaultApiClient.apiNamespaceCliAuth.companyCreationStatus(input),
    useCompanyCreationStatus: (input: CliAuthCompanyCreationStatusInput) =>
      useQuery<CliAuthCompanyCreationStatusResult>(() =>
        defaultApiClient.apiNamespaceCliAuth.companyCreationStatus(input),
      ),
    companyCreationStatusQueryKeyPrefix: () =>
      buildApiQueryKeyPrefix(defaultApiClient, "/cli_auth/company_creation_status"),
    companyCreationStatusQueryKey: (input: CliAuthCompanyCreationStatusInput) =>
      buildApiQueryKey(defaultApiClient, "/cli_auth/company_creation_status", input),
    companyCreationStatusQueryOptions: (input: CliAuthCompanyCreationStatusInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/cli_auth/company_creation_status", input),
        queryFn: () => defaultApiClient.apiNamespaceCliAuth.companyCreationStatus(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    companyCreationStatusQuery: (input: CliAuthCompanyCreationStatusInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/cli_auth/company_creation_status", input),
        queryFn: () => defaultApiClient.apiNamespaceCliAuth.companyCreationStatus(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    startGoogleSignup: (input: CliAuthStartGoogleSignupInput) =>
      defaultApiClient.apiNamespaceCliAuth.startGoogleSignup(input),
    useStartGoogleSignup: () =>
      useMutation<CliAuthStartGoogleSignupInput, CliAuthStartGoogleSignupResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.startGoogleSignup(input),
      ),
    startGoogleSignupMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthStartGoogleSignupInput) =>
          defaultApiClient.apiNamespaceCliAuth.startGoogleSignup(input),
      }),

    requestEmailCode: (input: CliAuthRequestEmailCodeInput) =>
      defaultApiClient.apiNamespaceCliAuth.requestEmailCode(input),
    useRequestEmailCode: () =>
      useMutation<CliAuthRequestEmailCodeInput, CliAuthRequestEmailCodeResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.requestEmailCode(input),
      ),
    requestEmailCodeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthRequestEmailCodeInput) =>
          defaultApiClient.apiNamespaceCliAuth.requestEmailCode(input),
      }),

    createToken: (input: CliAuthCreateTokenInput) => defaultApiClient.apiNamespaceCliAuth.createToken(input),
    useCreateToken: () =>
      useMutation<CliAuthCreateTokenInput, CliAuthCreateTokenResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.createToken(input),
      ),
    createTokenMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthCreateTokenInput) => defaultApiClient.apiNamespaceCliAuth.createToken(input),
      }),

    setupCompany: (input: CliAuthSetupCompanyInput) => defaultApiClient.apiNamespaceCliAuth.setupCompany(input),
    useSetupCompany: () =>
      useMutation<CliAuthSetupCompanyInput, CliAuthSetupCompanyResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.setupCompany(input),
      ),
    setupCompanyMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthSetupCompanyInput) => defaultApiClient.apiNamespaceCliAuth.setupCompany(input),
      }),

    authEmailCode: (input: CliAuthAuthEmailCodeInput) => defaultApiClient.apiNamespaceCliAuth.authEmailCode(input),
    useAuthEmailCode: () =>
      useMutation<CliAuthAuthEmailCodeInput, CliAuthAuthEmailCodeResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.authEmailCode(input),
      ),
    authEmailCodeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthAuthEmailCodeInput) => defaultApiClient.apiNamespaceCliAuth.authEmailCode(input),
      }),

    createCompany: (input: CliAuthCreateCompanyInput) => defaultApiClient.apiNamespaceCliAuth.createCompany(input),
    useCreateCompany: () =>
      useMutation<CliAuthCreateCompanyInput, CliAuthCreateCompanyResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.createCompany(input),
      ),
    createCompanyMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthCreateCompanyInput) => defaultApiClient.apiNamespaceCliAuth.createCompany(input),
      }),

    joinWithInvite: (input: CliAuthJoinWithInviteInput) => defaultApiClient.apiNamespaceCliAuth.joinWithInvite(input),
    useJoinWithInvite: () =>
      useMutation<CliAuthJoinWithInviteInput, CliAuthJoinWithInviteResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.joinWithInvite(input),
      ),
    joinWithInviteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthJoinWithInviteInput) => defaultApiClient.apiNamespaceCliAuth.joinWithInvite(input),
      }),

    joinCompany: (input: CliAuthJoinCompanyInput) => defaultApiClient.apiNamespaceCliAuth.joinCompany(input),
    useJoinCompany: () =>
      useMutation<CliAuthJoinCompanyInput, CliAuthJoinCompanyResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.joinCompany(input),
      ),
    joinCompanyMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthJoinCompanyInput) => defaultApiClient.apiNamespaceCliAuth.joinCompany(input),
      }),

    startGoogle: (input: CliAuthStartGoogleInput) => defaultApiClient.apiNamespaceCliAuth.startGoogle(input),
    useStartGoogle: () =>
      useMutation<CliAuthStartGoogleInput, CliAuthStartGoogleResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.startGoogle(input),
      ),
    startGoogleMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthStartGoogleInput) => defaultApiClient.apiNamespaceCliAuth.startGoogle(input),
      }),

    checkAccount: (input: CliAuthCheckAccountInput) => defaultApiClient.apiNamespaceCliAuth.checkAccount(input),
    useCheckAccount: () =>
      useMutation<CliAuthCheckAccountInput, CliAuthCheckAccountResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.checkAccount(input),
      ),
    checkAccountMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthCheckAccountInput) => defaultApiClient.apiNamespaceCliAuth.checkAccount(input),
      }),

    authPassword: (input: CliAuthAuthPasswordInput) => defaultApiClient.apiNamespaceCliAuth.authPassword(input),
    useAuthPassword: () =>
      useMutation<CliAuthAuthPasswordInput, CliAuthAuthPasswordResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.authPassword(input),
      ),
    authPasswordMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthAuthPasswordInput) => defaultApiClient.apiNamespaceCliAuth.authPassword(input),
      }),

    signup: (input: CliAuthSignupInput) => defaultApiClient.apiNamespaceCliAuth.signup(input),
    useSignup: () =>
      useMutation<CliAuthSignupInput, CliAuthSignupResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.signup(input),
      ),
    signupMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CliAuthSignupInput) => defaultApiClient.apiNamespaceCliAuth.signup(input),
      }),
  },

  mcp_grants: {
    list: (input: McpGrantsListInput) => defaultApiClient.apiNamespaceMcpGrants.list(input),
    useList: (input: McpGrantsListInput) =>
      useQuery<McpGrantsListResult>(() => defaultApiClient.apiNamespaceMcpGrants.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/mcp_grants/list"),
    listQueryKey: (input: McpGrantsListInput) => buildApiQueryKey(defaultApiClient, "/mcp_grants/list", input),
    listQueryOptions: (input: McpGrantsListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/mcp_grants/list", input),
        queryFn: () => defaultApiClient.apiNamespaceMcpGrants.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: McpGrantsListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/mcp_grants/list", input),
        queryFn: () => defaultApiClient.apiNamespaceMcpGrants.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    revoke: (input: McpGrantsRevokeInput) => defaultApiClient.apiNamespaceMcpGrants.revoke(input),
    useRevoke: () =>
      useMutation<McpGrantsRevokeInput, McpGrantsRevokeResult>((input) =>
        defaultApiClient.apiNamespaceMcpGrants.revoke(input),
      ),
    revokeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: McpGrantsRevokeInput) => defaultApiClient.apiNamespaceMcpGrants.revoke(input),
      }),
  },

  api_tokens: {
    list: (input: ApiTokensListInput) => defaultApiClient.apiNamespaceApiTokens.list(input),
    useList: (input: ApiTokensListInput) =>
      useQuery<ApiTokensListResult>(() => defaultApiClient.apiNamespaceApiTokens.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/api_tokens/list"),
    listQueryKey: (input: ApiTokensListInput) => buildApiQueryKey(defaultApiClient, "/api_tokens/list", input),
    listQueryOptions: (input: ApiTokensListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/api_tokens/list", input),
        queryFn: () => defaultApiClient.apiNamespaceApiTokens.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: ApiTokensListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/api_tokens/list", input),
        queryFn: () => defaultApiClient.apiNamespaceApiTokens.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    create: (input: ApiTokensCreateInput) => defaultApiClient.apiNamespaceApiTokens.create(input),
    useCreate: () =>
      useMutation<ApiTokensCreateInput, ApiTokensCreateResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.create(input),
      ),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ApiTokensCreateInput) => defaultApiClient.apiNamespaceApiTokens.create(input),
      }),

    setReadOnly: (input: ApiTokensSetReadOnlyInput) => defaultApiClient.apiNamespaceApiTokens.setReadOnly(input),
    useSetReadOnly: () =>
      useMutation<ApiTokensSetReadOnlyInput, ApiTokensSetReadOnlyResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.setReadOnly(input),
      ),
    setReadOnlyMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ApiTokensSetReadOnlyInput) => defaultApiClient.apiNamespaceApiTokens.setReadOnly(input),
      }),

    updateName: (input: ApiTokensUpdateNameInput) => defaultApiClient.apiNamespaceApiTokens.updateName(input),
    useUpdateName: () =>
      useMutation<ApiTokensUpdateNameInput, ApiTokensUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.updateName(input),
      ),
    updateNameMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ApiTokensUpdateNameInput) => defaultApiClient.apiNamespaceApiTokens.updateName(input),
      }),

    delete: (input: ApiTokensDeleteInput) => defaultApiClient.apiNamespaceApiTokens.delete(input),
    useDelete: () =>
      useMutation<ApiTokensDeleteInput, ApiTokensDeleteResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.delete(input),
      ),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ApiTokensDeleteInput) => defaultApiClient.apiNamespaceApiTokens.delete(input),
      }),
  },

  invitations: {
    getInviteLinkByToken: (input: InvitationsGetInviteLinkByTokenInput) =>
      defaultApiClient.apiNamespaceInvitations.getInviteLinkByToken(input),
    useGetInviteLinkByToken: (input: InvitationsGetInviteLinkByTokenInput) =>
      useQuery<InvitationsGetInviteLinkByTokenResult>(() =>
        defaultApiClient.apiNamespaceInvitations.getInviteLinkByToken(input),
      ),
    getInviteLinkByTokenQueryKeyPrefix: () =>
      buildApiQueryKeyPrefix(defaultApiClient, "/invitations/get_invite_link_by_token"),
    getInviteLinkByTokenQueryKey: (input: InvitationsGetInviteLinkByTokenInput) =>
      buildApiQueryKey(defaultApiClient, "/invitations/get_invite_link_by_token", input),
    getInviteLinkByTokenQueryOptions: (input: InvitationsGetInviteLinkByTokenInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/invitations/get_invite_link_by_token", input),
        queryFn: () => defaultApiClient.apiNamespaceInvitations.getInviteLinkByToken(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getInviteLinkByTokenQuery: (input: InvitationsGetInviteLinkByTokenInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/invitations/get_invite_link_by_token", input),
        queryFn: () => defaultApiClient.apiNamespaceInvitations.getInviteLinkByToken(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getInvitation: (input: InvitationsGetInvitationInput) =>
      defaultApiClient.apiNamespaceInvitations.getInvitation(input),
    useGetInvitation: (input: InvitationsGetInvitationInput) =>
      useQuery<InvitationsGetInvitationResult>(() => defaultApiClient.apiNamespaceInvitations.getInvitation(input)),
    getInvitationQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/invitations/get_invitation"),
    getInvitationQueryKey: (input: InvitationsGetInvitationInput) =>
      buildApiQueryKey(defaultApiClient, "/invitations/get_invitation", input),
    getInvitationQueryOptions: (input: InvitationsGetInvitationInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/invitations/get_invitation", input),
        queryFn: () => defaultApiClient.apiNamespaceInvitations.getInvitation(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getInvitationQuery: (input: InvitationsGetInvitationInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/invitations/get_invitation", input),
        queryFn: () => defaultApiClient.apiNamespaceInvitations.getInvitation(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getInviteLinkAvailability: (input: InvitationsGetInviteLinkAvailabilityInput) =>
      defaultApiClient.apiNamespaceInvitations.getInviteLinkAvailability(input),
    useGetInviteLinkAvailability: (input: InvitationsGetInviteLinkAvailabilityInput) =>
      useQuery<InvitationsGetInviteLinkAvailabilityResult>(() =>
        defaultApiClient.apiNamespaceInvitations.getInviteLinkAvailability(input),
      ),
    getInviteLinkAvailabilityQueryKeyPrefix: () =>
      buildApiQueryKeyPrefix(defaultApiClient, "/invitations/get_invite_link_availability"),
    getInviteLinkAvailabilityQueryKey: (input: InvitationsGetInviteLinkAvailabilityInput) =>
      buildApiQueryKey(defaultApiClient, "/invitations/get_invite_link_availability", input),
    getInviteLinkAvailabilityQueryOptions: (input: InvitationsGetInviteLinkAvailabilityInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/invitations/get_invite_link_availability", input),
        queryFn: () => defaultApiClient.apiNamespaceInvitations.getInviteLinkAvailability(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getInviteLinkAvailabilityQuery: (input: InvitationsGetInviteLinkAvailabilityInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/invitations/get_invite_link_availability", input),
        queryFn: () => defaultApiClient.apiNamespaceInvitations.getInviteLinkAvailability(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    newInvitationToken: (input: InvitationsNewInvitationTokenInput) =>
      defaultApiClient.apiNamespaceInvitations.newInvitationToken(input),
    useNewInvitationToken: () =>
      useMutation<InvitationsNewInvitationTokenInput, InvitationsNewInvitationTokenResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.newInvitationToken(input),
      ),
    newInvitationTokenMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: InvitationsNewInvitationTokenInput) =>
          defaultApiClient.apiNamespaceInvitations.newInvitationToken(input),
      }),

    resetCompanyInviteLink: (input: InvitationsResetCompanyInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.resetCompanyInviteLink(input),
    useResetCompanyInviteLink: () =>
      useMutation<InvitationsResetCompanyInviteLinkInput, InvitationsResetCompanyInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.resetCompanyInviteLink(input),
      ),
    resetCompanyInviteLinkMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: InvitationsResetCompanyInviteLinkInput) =>
          defaultApiClient.apiNamespaceInvitations.resetCompanyInviteLink(input),
      }),

    getCompanyInviteLink: (input: InvitationsGetCompanyInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.getCompanyInviteLink(input),
    useGetCompanyInviteLink: () =>
      useMutation<InvitationsGetCompanyInviteLinkInput, InvitationsGetCompanyInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.getCompanyInviteLink(input),
      ),
    getCompanyInviteLinkMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: InvitationsGetCompanyInviteLinkInput) =>
          defaultApiClient.apiNamespaceInvitations.getCompanyInviteLink(input),
      }),

    updateCompanyInviteLink: (input: InvitationsUpdateCompanyInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.updateCompanyInviteLink(input),
    useUpdateCompanyInviteLink: () =>
      useMutation<InvitationsUpdateCompanyInviteLinkInput, InvitationsUpdateCompanyInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.updateCompanyInviteLink(input),
      ),
    updateCompanyInviteLinkMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: InvitationsUpdateCompanyInviteLinkInput) =>
          defaultApiClient.apiNamespaceInvitations.updateCompanyInviteLink(input),
      }),

    joinCompanyViaInviteLink: (input: InvitationsJoinCompanyViaInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.joinCompanyViaInviteLink(input),
    useJoinCompanyViaInviteLink: () =>
      useMutation<InvitationsJoinCompanyViaInviteLinkInput, InvitationsJoinCompanyViaInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.joinCompanyViaInviteLink(input),
      ),
    joinCompanyViaInviteLinkMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: InvitationsJoinCompanyViaInviteLinkInput) =>
          defaultApiClient.apiNamespaceInvitations.joinCompanyViaInviteLink(input),
      }),
  },

  product_releases: {
    getLatest: (input: ProductReleasesGetLatestInput) => defaultApiClient.apiNamespaceProductReleases.getLatest(input),
    useGetLatest: (input: ProductReleasesGetLatestInput) =>
      useQuery<ProductReleasesGetLatestResult>(() => defaultApiClient.apiNamespaceProductReleases.getLatest(input)),
    getLatestQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/product_releases/get_latest"),
    getLatestQueryKey: (input: ProductReleasesGetLatestInput) =>
      buildApiQueryKey(defaultApiClient, "/product_releases/get_latest", input),
    getLatestQueryOptions: (input: ProductReleasesGetLatestInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/product_releases/get_latest", input),
        queryFn: () => defaultApiClient.apiNamespaceProductReleases.getLatest(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getLatestQuery: (input: ProductReleasesGetLatestInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/product_releases/get_latest", input),
        queryFn: () => defaultApiClient.apiNamespaceProductReleases.getLatest(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    dismiss: (input: ProductReleasesDismissInput) => defaultApiClient.apiNamespaceProductReleases.dismiss(input),
    useDismiss: () =>
      useMutation<ProductReleasesDismissInput, ProductReleasesDismissResult>((input) =>
        defaultApiClient.apiNamespaceProductReleases.dismiss(input),
      ),
    dismissMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProductReleasesDismissInput) => defaultApiClient.apiNamespaceProductReleases.dismiss(input),
      }),
  },

  site_messages: {
    listActive: (input: SiteMessagesListActiveInput) => defaultApiClient.apiNamespaceSiteMessages.listActive(input),
    useListActive: (input: SiteMessagesListActiveInput) =>
      useQuery<SiteMessagesListActiveResult>(() => defaultApiClient.apiNamespaceSiteMessages.listActive(input)),
    listActiveQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/site_messages/list_active"),
    listActiveQueryKey: (input: SiteMessagesListActiveInput) =>
      buildApiQueryKey(defaultApiClient, "/site_messages/list_active", input),
    listActiveQueryOptions: (input: SiteMessagesListActiveInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/site_messages/list_active", input),
        queryFn: () => defaultApiClient.apiNamespaceSiteMessages.listActive(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listActiveQuery: (input: SiteMessagesListActiveInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/site_messages/list_active", input),
        queryFn: () => defaultApiClient.apiNamespaceSiteMessages.listActive(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
  },

  billing: {
    getCatalog: (input: BillingGetCatalogInput) => defaultApiClient.apiNamespaceBilling.getCatalog(input),
    useGetCatalog: (input: BillingGetCatalogInput) =>
      useQuery<BillingGetCatalogResult>(() => defaultApiClient.apiNamespaceBilling.getCatalog(input)),
    getCatalogQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/billing/get_catalog"),
    getCatalogQueryKey: (input: BillingGetCatalogInput) =>
      buildApiQueryKey(defaultApiClient, "/billing/get_catalog", input),
    getCatalogQueryOptions: (input: BillingGetCatalogInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get_catalog", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.getCatalog(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getCatalogQuery: (input: BillingGetCatalogInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get_catalog", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.getCatalog(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: BillingGetInput) => defaultApiClient.apiNamespaceBilling.get(input),
    useGet: (input: BillingGetInput) =>
      useQuery<BillingGetResult>(() => defaultApiClient.apiNamespaceBilling.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/billing/get"),
    getQueryKey: (input: BillingGetInput) => buildApiQueryKey(defaultApiClient, "/billing/get", input),
    getQueryOptions: (input: BillingGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: BillingGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getLimitWarnings: (input: BillingGetLimitWarningsInput) =>
      defaultApiClient.apiNamespaceBilling.getLimitWarnings(input),
    useGetLimitWarnings: (input: BillingGetLimitWarningsInput) =>
      useQuery<BillingGetLimitWarningsResult>(() => defaultApiClient.apiNamespaceBilling.getLimitWarnings(input)),
    getLimitWarningsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/billing/get_limit_warnings"),
    getLimitWarningsQueryKey: (input: BillingGetLimitWarningsInput) =>
      buildApiQueryKey(defaultApiClient, "/billing/get_limit_warnings", input),
    getLimitWarningsQueryOptions: (input: BillingGetLimitWarningsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get_limit_warnings", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.getLimitWarnings(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getLimitWarningsQuery: (input: BillingGetLimitWarningsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get_limit_warnings", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.getLimitWarnings(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getAccessState: (input: BillingGetAccessStateInput) => defaultApiClient.apiNamespaceBilling.getAccessState(input),
    useGetAccessState: (input: BillingGetAccessStateInput) =>
      useQuery<BillingGetAccessStateResult>(() => defaultApiClient.apiNamespaceBilling.getAccessState(input)),
    getAccessStateQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/billing/get_access_state"),
    getAccessStateQueryKey: (input: BillingGetAccessStateInput) =>
      buildApiQueryKey(defaultApiClient, "/billing/get_access_state", input),
    getAccessStateQueryOptions: (input: BillingGetAccessStateInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get_access_state", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.getAccessState(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getAccessStateQuery: (input: BillingGetAccessStateInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/billing/get_access_state", input),
        queryFn: () => defaultApiClient.apiNamespaceBilling.getAccessState(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    cancel: (input: BillingCancelInput) => defaultApiClient.apiNamespaceBilling.cancel(input),
    useCancel: () =>
      useMutation<BillingCancelInput, BillingCancelResult>((input) =>
        defaultApiClient.apiNamespaceBilling.cancel(input),
      ),
    cancelMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: BillingCancelInput) => defaultApiClient.apiNamespaceBilling.cancel(input),
      }),

    createPaymentMethodSession: (input: BillingCreatePaymentMethodSessionInput) =>
      defaultApiClient.apiNamespaceBilling.createPaymentMethodSession(input),
    useCreatePaymentMethodSession: () =>
      useMutation<BillingCreatePaymentMethodSessionInput, BillingCreatePaymentMethodSessionResult>((input) =>
        defaultApiClient.apiNamespaceBilling.createPaymentMethodSession(input),
      ),
    createPaymentMethodSessionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: BillingCreatePaymentMethodSessionInput) =>
          defaultApiClient.apiNamespaceBilling.createPaymentMethodSession(input),
      }),

    changePlan: (input: BillingChangePlanInput) => defaultApiClient.apiNamespaceBilling.changePlan(input),
    useChangePlan: () =>
      useMutation<BillingChangePlanInput, BillingChangePlanResult>((input) =>
        defaultApiClient.apiNamespaceBilling.changePlan(input),
      ),
    changePlanMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: BillingChangePlanInput) => defaultApiClient.apiNamespaceBilling.changePlan(input),
      }),

    createCustomerPortalSession: (input: BillingCreateCustomerPortalSessionInput) =>
      defaultApiClient.apiNamespaceBilling.createCustomerPortalSession(input),
    useCreateCustomerPortalSession: () =>
      useMutation<BillingCreateCustomerPortalSessionInput, BillingCreateCustomerPortalSessionResult>((input) =>
        defaultApiClient.apiNamespaceBilling.createCustomerPortalSession(input),
      ),
    createCustomerPortalSessionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: BillingCreateCustomerPortalSessionInput) =>
          defaultApiClient.apiNamespaceBilling.createCustomerPortalSession(input),
      }),

    createCheckoutSession: (input: BillingCreateCheckoutSessionInput) =>
      defaultApiClient.apiNamespaceBilling.createCheckoutSession(input),
    useCreateCheckoutSession: () =>
      useMutation<BillingCreateCheckoutSessionInput, BillingCreateCheckoutSessionResult>((input) =>
        defaultApiClient.apiNamespaceBilling.createCheckoutSession(input),
      ),
    createCheckoutSessionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: BillingCreateCheckoutSessionInput) =>
          defaultApiClient.apiNamespaceBilling.createCheckoutSession(input),
      }),

    reactivate: (input: BillingReactivateInput) => defaultApiClient.apiNamespaceBilling.reactivate(input),
    useReactivate: () =>
      useMutation<BillingReactivateInput, BillingReactivateResult>((input) =>
        defaultApiClient.apiNamespaceBilling.reactivate(input),
      ),
    reactivateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: BillingReactivateInput) => defaultApiClient.apiNamespaceBilling.reactivate(input),
      }),

    refresh: (input: BillingRefreshInput) => defaultApiClient.apiNamespaceBilling.refresh(input),
    useRefresh: () =>
      useMutation<BillingRefreshInput, BillingRefreshResult>((input) =>
        defaultApiClient.apiNamespaceBilling.refresh(input),
      ),
    refreshMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: BillingRefreshInput) => defaultApiClient.apiNamespaceBilling.refresh(input),
      }),
  },

  notifications: {
    isSubscribed: (input: NotificationsIsSubscribedInput) =>
      defaultApiClient.apiNamespaceNotifications.isSubscribed(input),
    useIsSubscribed: (input: NotificationsIsSubscribedInput) =>
      useQuery<NotificationsIsSubscribedResult>(() => defaultApiClient.apiNamespaceNotifications.isSubscribed(input)),
    isSubscribedQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/notifications/is_subscribed"),
    isSubscribedQueryKey: (input: NotificationsIsSubscribedInput) =>
      buildApiQueryKey(defaultApiClient, "/notifications/is_subscribed", input),
    isSubscribedQueryOptions: (input: NotificationsIsSubscribedInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/notifications/is_subscribed", input),
        queryFn: () => defaultApiClient.apiNamespaceNotifications.isSubscribed(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    isSubscribedQuery: (input: NotificationsIsSubscribedInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/notifications/is_subscribed", input),
        queryFn: () => defaultApiClient.apiNamespaceNotifications.isSubscribed(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getUnreadCount: (input: NotificationsGetUnreadCountInput) =>
      defaultApiClient.apiNamespaceNotifications.getUnreadCount(input),
    useGetUnreadCount: (input: NotificationsGetUnreadCountInput) =>
      useQuery<NotificationsGetUnreadCountResult>(() =>
        defaultApiClient.apiNamespaceNotifications.getUnreadCount(input),
      ),
    getUnreadCountQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/notifications/get_unread_count"),
    getUnreadCountQueryKey: (input: NotificationsGetUnreadCountInput) =>
      buildApiQueryKey(defaultApiClient, "/notifications/get_unread_count", input),
    getUnreadCountQueryOptions: (input: NotificationsGetUnreadCountInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/notifications/get_unread_count", input),
        queryFn: () => defaultApiClient.apiNamespaceNotifications.getUnreadCount(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getUnreadCountQuery: (input: NotificationsGetUnreadCountInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/notifications/get_unread_count", input),
        queryFn: () => defaultApiClient.apiNamespaceNotifications.getUnreadCount(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: NotificationsListInput) => defaultApiClient.apiNamespaceNotifications.list(input),
    useList: (input: NotificationsListInput) =>
      useQuery<NotificationsListResult>(() => defaultApiClient.apiNamespaceNotifications.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/notifications/list"),
    listQueryKey: (input: NotificationsListInput) => buildApiQueryKey(defaultApiClient, "/notifications/list", input),
    listQueryOptions: (input: NotificationsListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/notifications/list", input),
        queryFn: () => defaultApiClient.apiNamespaceNotifications.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: NotificationsListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/notifications/list", input),
        queryFn: () => defaultApiClient.apiNamespaceNotifications.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    markAllAsRead: (input: NotificationsMarkAllAsReadInput) =>
      defaultApiClient.apiNamespaceNotifications.markAllAsRead(input),
    useMarkAllAsRead: () =>
      useMutation<NotificationsMarkAllAsReadInput, NotificationsMarkAllAsReadResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.markAllAsRead(input),
      ),
    markAllAsReadMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: NotificationsMarkAllAsReadInput) =>
          defaultApiClient.apiNamespaceNotifications.markAllAsRead(input),
      }),

    unsubscribe: (input: NotificationsUnsubscribeInput) =>
      defaultApiClient.apiNamespaceNotifications.unsubscribe(input),
    useUnsubscribe: () =>
      useMutation<NotificationsUnsubscribeInput, NotificationsUnsubscribeResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.unsubscribe(input),
      ),
    unsubscribeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: NotificationsUnsubscribeInput) =>
          defaultApiClient.apiNamespaceNotifications.unsubscribe(input),
      }),

    markAsRead: (input: NotificationsMarkAsReadInput) => defaultApiClient.apiNamespaceNotifications.markAsRead(input),
    useMarkAsRead: () =>
      useMutation<NotificationsMarkAsReadInput, NotificationsMarkAsReadResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.markAsRead(input),
      ),
    markAsReadMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: NotificationsMarkAsReadInput) =>
          defaultApiClient.apiNamespaceNotifications.markAsRead(input),
      }),

    markManyAsRead: (input: NotificationsMarkManyAsReadInput) =>
      defaultApiClient.apiNamespaceNotifications.markManyAsRead(input),
    useMarkManyAsRead: () =>
      useMutation<NotificationsMarkManyAsReadInput, NotificationsMarkManyAsReadResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.markManyAsRead(input),
      ),
    markManyAsReadMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: NotificationsMarkManyAsReadInput) =>
          defaultApiClient.apiNamespaceNotifications.markManyAsRead(input),
      }),

    subscribe: (input: NotificationsSubscribeInput) => defaultApiClient.apiNamespaceNotifications.subscribe(input),
    useSubscribe: () =>
      useMutation<NotificationsSubscribeInput, NotificationsSubscribeResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.subscribe(input),
      ),
    subscribeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: NotificationsSubscribeInput) => defaultApiClient.apiNamespaceNotifications.subscribe(input),
      }),

    updateSubscriptionsList: (input: NotificationsUpdateSubscriptionsListInput) =>
      defaultApiClient.apiNamespaceNotifications.updateSubscriptionsList(input),
    useUpdateSubscriptionsList: () =>
      useMutation<NotificationsUpdateSubscriptionsListInput, NotificationsUpdateSubscriptionsListResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.updateSubscriptionsList(input),
      ),
    updateSubscriptionsListMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: NotificationsUpdateSubscriptionsListInput) =>
          defaultApiClient.apiNamespaceNotifications.updateSubscriptionsList(input),
      }),
  },

  files: {
    get: (input: FilesGetInput) => defaultApiClient.apiNamespaceFiles.get(input),
    useGet: (input: FilesGetInput) => useQuery<FilesGetResult>(() => defaultApiClient.apiNamespaceFiles.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/files/get"),
    getQueryKey: (input: FilesGetInput) => buildApiQueryKey(defaultApiClient, "/files/get", input),
    getQueryOptions: (input: FilesGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/files/get", input),
        queryFn: () => defaultApiClient.apiNamespaceFiles.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: FilesGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/files/get", input),
        queryFn: () => defaultApiClient.apiNamespaceFiles.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    delete: (input: FilesDeleteInput) => defaultApiClient.apiNamespaceFiles.delete(input),
    useDelete: () =>
      useMutation<FilesDeleteInput, FilesDeleteResult>((input) => defaultApiClient.apiNamespaceFiles.delete(input)),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: FilesDeleteInput) => defaultApiClient.apiNamespaceFiles.delete(input),
      }),

    update: (input: FilesUpdateInput) => defaultApiClient.apiNamespaceFiles.update(input),
    useUpdate: () =>
      useMutation<FilesUpdateInput, FilesUpdateResult>((input) => defaultApiClient.apiNamespaceFiles.update(input)),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: FilesUpdateInput) => defaultApiClient.apiNamespaceFiles.update(input),
      }),

    create: (input: FilesCreateInput) => defaultApiClient.apiNamespaceFiles.create(input),
    useCreate: () =>
      useMutation<FilesCreateInput, FilesCreateResult>((input) => defaultApiClient.apiNamespaceFiles.create(input)),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: FilesCreateInput) => defaultApiClient.apiNamespaceFiles.create(input),
      }),
  },

  links: {
    get: (input: LinksGetInput) => defaultApiClient.apiNamespaceLinks.get(input),
    useGet: (input: LinksGetInput) => useQuery<LinksGetResult>(() => defaultApiClient.apiNamespaceLinks.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/links/get"),
    getQueryKey: (input: LinksGetInput) => buildApiQueryKey(defaultApiClient, "/links/get", input),
    getQueryOptions: (input: LinksGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/links/get", input),
        queryFn: () => defaultApiClient.apiNamespaceLinks.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: LinksGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/links/get", input),
        queryFn: () => defaultApiClient.apiNamespaceLinks.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    create: (input: LinksCreateInput) => defaultApiClient.apiNamespaceLinks.create(input),
    useCreate: () =>
      useMutation<LinksCreateInput, LinksCreateResult>((input) => defaultApiClient.apiNamespaceLinks.create(input)),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: LinksCreateInput) => defaultApiClient.apiNamespaceLinks.create(input),
      }),

    update: (input: LinksUpdateInput) => defaultApiClient.apiNamespaceLinks.update(input),
    useUpdate: () =>
      useMutation<LinksUpdateInput, LinksUpdateResult>((input) => defaultApiClient.apiNamespaceLinks.update(input)),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: LinksUpdateInput) => defaultApiClient.apiNamespaceLinks.update(input),
      }),

    delete: (input: LinksDeleteInput) => defaultApiClient.apiNamespaceLinks.delete(input),
    useDelete: () =>
      useMutation<LinksDeleteInput, LinksDeleteResult>((input) => defaultApiClient.apiNamespaceLinks.delete(input)),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: LinksDeleteInput) => defaultApiClient.apiNamespaceLinks.delete(input),
      }),
  },

  documents: {
    get: (input: DocumentsGetInput) => defaultApiClient.apiNamespaceDocuments.get(input),
    useGet: (input: DocumentsGetInput) =>
      useQuery<DocumentsGetResult>(() => defaultApiClient.apiNamespaceDocuments.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/documents/get"),
    getQueryKey: (input: DocumentsGetInput) => buildApiQueryKey(defaultApiClient, "/documents/get", input),
    getQueryOptions: (input: DocumentsGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/documents/get", input),
        queryFn: () => defaultApiClient.apiNamespaceDocuments.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: DocumentsGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/documents/get", input),
        queryFn: () => defaultApiClient.apiNamespaceDocuments.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getVersion: (input: DocumentsGetVersionInput) => defaultApiClient.apiNamespaceDocuments.getVersion(input),
    useGetVersion: (input: DocumentsGetVersionInput) =>
      useQuery<DocumentsGetVersionResult>(() => defaultApiClient.apiNamespaceDocuments.getVersion(input)),
    getVersionQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/documents/get_version"),
    getVersionQueryKey: (input: DocumentsGetVersionInput) =>
      buildApiQueryKey(defaultApiClient, "/documents/get_version", input),
    getVersionQueryOptions: (input: DocumentsGetVersionInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/documents/get_version", input),
        queryFn: () => defaultApiClient.apiNamespaceDocuments.getVersion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getVersionQuery: (input: DocumentsGetVersionInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/documents/get_version", input),
        queryFn: () => defaultApiClient.apiNamespaceDocuments.getVersion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listVersions: (input: DocumentsListVersionsInput) => defaultApiClient.apiNamespaceDocuments.listVersions(input),
    useListVersions: (input: DocumentsListVersionsInput) =>
      useQuery<DocumentsListVersionsResult>(() => defaultApiClient.apiNamespaceDocuments.listVersions(input)),
    listVersionsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/documents/list_versions"),
    listVersionsQueryKey: (input: DocumentsListVersionsInput) =>
      buildApiQueryKey(defaultApiClient, "/documents/list_versions", input),
    listVersionsQueryOptions: (input: DocumentsListVersionsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/documents/list_versions", input),
        queryFn: () => defaultApiClient.apiNamespaceDocuments.listVersions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listVersionsQuery: (input: DocumentsListVersionsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/documents/list_versions", input),
        queryFn: () => defaultApiClient.apiNamespaceDocuments.listVersions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    restoreVersion: (input: DocumentsRestoreVersionInput) =>
      defaultApiClient.apiNamespaceDocuments.restoreVersion(input),
    useRestoreVersion: () =>
      useMutation<DocumentsRestoreVersionInput, DocumentsRestoreVersionResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.restoreVersion(input),
      ),
    restoreVersionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: DocumentsRestoreVersionInput) =>
          defaultApiClient.apiNamespaceDocuments.restoreVersion(input),
      }),

    publish: (input: DocumentsPublishInput) => defaultApiClient.apiNamespaceDocuments.publish(input),
    usePublish: () =>
      useMutation<DocumentsPublishInput, DocumentsPublishResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.publish(input),
      ),
    publishMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: DocumentsPublishInput) => defaultApiClient.apiNamespaceDocuments.publish(input),
      }),

    update: (input: DocumentsUpdateInput) => defaultApiClient.apiNamespaceDocuments.update(input),
    useUpdate: () =>
      useMutation<DocumentsUpdateInput, DocumentsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.update(input),
      ),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: DocumentsUpdateInput) => defaultApiClient.apiNamespaceDocuments.update(input),
      }),

    delete: (input: DocumentsDeleteInput) => defaultApiClient.apiNamespaceDocuments.delete(input),
    useDelete: () =>
      useMutation<DocumentsDeleteInput, DocumentsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.delete(input),
      ),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: DocumentsDeleteInput) => defaultApiClient.apiNamespaceDocuments.delete(input),
      }),

    create: (input: DocumentsCreateInput) => defaultApiClient.apiNamespaceDocuments.create(input),
    useCreate: () =>
      useMutation<DocumentsCreateInput, DocumentsCreateResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.create(input),
      ),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: DocumentsCreateInput) => defaultApiClient.apiNamespaceDocuments.create(input),
      }),
  },

  resource_hubs: {
    search: (input: ResourceHubsSearchInput) => defaultApiClient.apiNamespaceResourceHubs.search(input),
    useSearch: (input: ResourceHubsSearchInput) =>
      useQuery<ResourceHubsSearchResult>(() => defaultApiClient.apiNamespaceResourceHubs.search(input)),
    searchQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/resource_hubs/search"),
    searchQueryKey: (input: ResourceHubsSearchInput) =>
      buildApiQueryKey(defaultApiClient, "/resource_hubs/search", input),
    searchQueryOptions: (input: ResourceHubsSearchInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/search", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchQuery: (input: ResourceHubsSearchInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/search", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listNodes: (input: ResourceHubsListNodesInput) => defaultApiClient.apiNamespaceResourceHubs.listNodes(input),
    useListNodes: (input: ResourceHubsListNodesInput) =>
      useQuery<ResourceHubsListNodesResult>(() => defaultApiClient.apiNamespaceResourceHubs.listNodes(input)),
    listNodesQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/resource_hubs/list_nodes"),
    listNodesQueryKey: (input: ResourceHubsListNodesInput) =>
      buildApiQueryKey(defaultApiClient, "/resource_hubs/list_nodes", input),
    listNodesQueryOptions: (input: ResourceHubsListNodesInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/list_nodes", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.listNodes(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listNodesQuery: (input: ResourceHubsListNodesInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/list_nodes", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.listNodes(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: ResourceHubsGetInput) => defaultApiClient.apiNamespaceResourceHubs.get(input),
    useGet: (input: ResourceHubsGetInput) =>
      useQuery<ResourceHubsGetResult>(() => defaultApiClient.apiNamespaceResourceHubs.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/resource_hubs/get"),
    getQueryKey: (input: ResourceHubsGetInput) => buildApiQueryKey(defaultApiClient, "/resource_hubs/get", input),
    getQueryOptions: (input: ResourceHubsGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/get", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: ResourceHubsGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/get", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getFolder: (input: ResourceHubsGetFolderInput) => defaultApiClient.apiNamespaceResourceHubs.getFolder(input),
    useGetFolder: (input: ResourceHubsGetFolderInput) =>
      useQuery<ResourceHubsGetFolderResult>(() => defaultApiClient.apiNamespaceResourceHubs.getFolder(input)),
    getFolderQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/resource_hubs/get_folder"),
    getFolderQueryKey: (input: ResourceHubsGetFolderInput) =>
      buildApiQueryKey(defaultApiClient, "/resource_hubs/get_folder", input),
    getFolderQueryOptions: (input: ResourceHubsGetFolderInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/get_folder", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.getFolder(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getFolderQuery: (input: ResourceHubsGetFolderInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/resource_hubs/get_folder", input),
        queryFn: () => defaultApiClient.apiNamespaceResourceHubs.getFolder(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    deleteFolder: (input: ResourceHubsDeleteFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.deleteFolder(input),
    useDeleteFolder: () =>
      useMutation<ResourceHubsDeleteFolderInput, ResourceHubsDeleteFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.deleteFolder(input),
      ),
    deleteFolderMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ResourceHubsDeleteFolderInput) =>
          defaultApiClient.apiNamespaceResourceHubs.deleteFolder(input),
      }),

    updateParentFolder: (input: ResourceHubsUpdateParentFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.updateParentFolder(input),
    useUpdateParentFolder: () =>
      useMutation<ResourceHubsUpdateParentFolderInput, ResourceHubsUpdateParentFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.updateParentFolder(input),
      ),
    updateParentFolderMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ResourceHubsUpdateParentFolderInput) =>
          defaultApiClient.apiNamespaceResourceHubs.updateParentFolder(input),
      }),

    renameFolder: (input: ResourceHubsRenameFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.renameFolder(input),
    useRenameFolder: () =>
      useMutation<ResourceHubsRenameFolderInput, ResourceHubsRenameFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.renameFolder(input),
      ),
    renameFolderMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ResourceHubsRenameFolderInput) =>
          defaultApiClient.apiNamespaceResourceHubs.renameFolder(input),
      }),

    copyFolder: (input: ResourceHubsCopyFolderInput) => defaultApiClient.apiNamespaceResourceHubs.copyFolder(input),
    useCopyFolder: () =>
      useMutation<ResourceHubsCopyFolderInput, ResourceHubsCopyFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.copyFolder(input),
      ),
    copyFolderMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ResourceHubsCopyFolderInput) => defaultApiClient.apiNamespaceResourceHubs.copyFolder(input),
      }),

    createFolder: (input: ResourceHubsCreateFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.createFolder(input),
    useCreateFolder: () =>
      useMutation<ResourceHubsCreateFolderInput, ResourceHubsCreateFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.createFolder(input),
      ),
    createFolderMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ResourceHubsCreateFolderInput) =>
          defaultApiClient.apiNamespaceResourceHubs.createFolder(input),
      }),
  },

  comments: {
    list: (input: CommentsListInput) => defaultApiClient.apiNamespaceComments.list(input),
    useList: (input: CommentsListInput) =>
      useQuery<CommentsListResult>(() => defaultApiClient.apiNamespaceComments.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/comments/list"),
    listQueryKey: (input: CommentsListInput) => buildApiQueryKey(defaultApiClient, "/comments/list", input),
    listQueryOptions: (input: CommentsListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/comments/list", input),
        queryFn: () => defaultApiClient.apiNamespaceComments.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: CommentsListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/comments/list", input),
        queryFn: () => defaultApiClient.apiNamespaceComments.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    delete: (input: CommentsDeleteInput) => defaultApiClient.apiNamespaceComments.delete(input),
    useDelete: () =>
      useMutation<CommentsDeleteInput, CommentsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceComments.delete(input),
      ),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CommentsDeleteInput) => defaultApiClient.apiNamespaceComments.delete(input),
      }),

    update: (input: CommentsUpdateInput) => defaultApiClient.apiNamespaceComments.update(input),
    useUpdate: () =>
      useMutation<CommentsUpdateInput, CommentsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceComments.update(input),
      ),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CommentsUpdateInput) => defaultApiClient.apiNamespaceComments.update(input),
      }),

    create: (input: CommentsCreateInput) => defaultApiClient.apiNamespaceComments.create(input),
    useCreate: () =>
      useMutation<CommentsCreateInput, CommentsCreateResult>((input) =>
        defaultApiClient.apiNamespaceComments.create(input),
      ),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CommentsCreateInput) => defaultApiClient.apiNamespaceComments.create(input),
      }),
  },

  companies: {
    quickSearch: (input: CompaniesQuickSearchInput) => defaultApiClient.apiNamespaceCompanies.quickSearch(input),
    useQuickSearch: (input: CompaniesQuickSearchInput) =>
      useQuery<CompaniesQuickSearchResult>(() => defaultApiClient.apiNamespaceCompanies.quickSearch(input)),
    quickSearchQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/quick_search"),
    quickSearchQueryKey: (input: CompaniesQuickSearchInput) =>
      buildApiQueryKey(defaultApiClient, "/companies/quick_search", input),
    quickSearchQueryOptions: (input: CompaniesQuickSearchInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/quick_search", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.quickSearch(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    quickSearchQuery: (input: CompaniesQuickSearchInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/quick_search", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.quickSearch(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getActivity: (input: CompaniesGetActivityInput) => defaultApiClient.apiNamespaceCompanies.getActivity(input),
    useGetActivity: (input: CompaniesGetActivityInput) =>
      useQuery<CompaniesGetActivityResult>(() => defaultApiClient.apiNamespaceCompanies.getActivity(input)),
    getActivityQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/get_activity"),
    getActivityQueryKey: (input: CompaniesGetActivityInput) =>
      buildApiQueryKey(defaultApiClient, "/companies/get_activity", input),
    getActivityQueryOptions: (input: CompaniesGetActivityInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get_activity", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.getActivity(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getActivityQuery: (input: CompaniesGetActivityInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get_activity", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.getActivity(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getFlatWorkMap: (input: CompaniesGetFlatWorkMapInput) =>
      defaultApiClient.apiNamespaceCompanies.getFlatWorkMap(input),
    useGetFlatWorkMap: (input: CompaniesGetFlatWorkMapInput) =>
      useQuery<CompaniesGetFlatWorkMapResult>(() => defaultApiClient.apiNamespaceCompanies.getFlatWorkMap(input)),
    getFlatWorkMapQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/get_flat_work_map"),
    getFlatWorkMapQueryKey: (input: CompaniesGetFlatWorkMapInput) =>
      buildApiQueryKey(defaultApiClient, "/companies/get_flat_work_map", input),
    getFlatWorkMapQueryOptions: (input: CompaniesGetFlatWorkMapInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get_flat_work_map", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.getFlatWorkMap(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getFlatWorkMapQuery: (input: CompaniesGetFlatWorkMapInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get_flat_work_map", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.getFlatWorkMap(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: CompaniesListInput) => defaultApiClient.apiNamespaceCompanies.list(input),
    useList: (input: CompaniesListInput) =>
      useQuery<CompaniesListResult>(() => defaultApiClient.apiNamespaceCompanies.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/list"),
    listQueryKey: (input: CompaniesListInput) => buildApiQueryKey(defaultApiClient, "/companies/list", input),
    listQueryOptions: (input: CompaniesListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/list", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: CompaniesListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/list", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    search: (input: CompaniesSearchInput) => defaultApiClient.apiNamespaceCompanies.search(input),
    useSearch: (input: CompaniesSearchInput) =>
      useQuery<CompaniesSearchResult>(() => defaultApiClient.apiNamespaceCompanies.search(input)),
    searchQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/search"),
    searchQueryKey: (input: CompaniesSearchInput) => buildApiQueryKey(defaultApiClient, "/companies/search", input),
    searchQueryOptions: (input: CompaniesSearchInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/search", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchQuery: (input: CompaniesSearchInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/search", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getWorkMap: (input: CompaniesGetWorkMapInput) => defaultApiClient.apiNamespaceCompanies.getWorkMap(input),
    useGetWorkMap: (input: CompaniesGetWorkMapInput) =>
      useQuery<CompaniesGetWorkMapResult>(() => defaultApiClient.apiNamespaceCompanies.getWorkMap(input)),
    getWorkMapQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/get_work_map"),
    getWorkMapQueryKey: (input: CompaniesGetWorkMapInput) =>
      buildApiQueryKey(defaultApiClient, "/companies/get_work_map", input),
    getWorkMapQueryOptions: (input: CompaniesGetWorkMapInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get_work_map", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.getWorkMap(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getWorkMapQuery: (input: CompaniesGetWorkMapInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get_work_map", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.getWorkMap(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: CompaniesGetInput) => defaultApiClient.apiNamespaceCompanies.get(input),
    useGet: (input: CompaniesGetInput) =>
      useQuery<CompaniesGetResult>(() => defaultApiClient.apiNamespaceCompanies.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/get"),
    getQueryKey: (input: CompaniesGetInput) => buildApiQueryKey(defaultApiClient, "/companies/get", input),
    getQueryOptions: (input: CompaniesGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: CompaniesGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/get", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listActivities: (input: CompaniesListActivitiesInput) =>
      defaultApiClient.apiNamespaceCompanies.listActivities(input),
    useListActivities: (input: CompaniesListActivitiesInput) =>
      useQuery<CompaniesListActivitiesResult>(() => defaultApiClient.apiNamespaceCompanies.listActivities(input)),
    listActivitiesQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/companies/list_activities"),
    listActivitiesQueryKey: (input: CompaniesListActivitiesInput) =>
      buildApiQueryKey(defaultApiClient, "/companies/list_activities", input),
    listActivitiesQueryOptions: (input: CompaniesListActivitiesInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/list_activities", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.listActivities(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listActivitiesQuery: (input: CompaniesListActivitiesInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/companies/list_activities", input),
        queryFn: () => defaultApiClient.apiNamespaceCompanies.listActivities(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    deleteOwner: (input: CompaniesDeleteOwnerInput) => defaultApiClient.apiNamespaceCompanies.deleteOwner(input),
    useDeleteOwner: () =>
      useMutation<CompaniesDeleteOwnerInput, CompaniesDeleteOwnerResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteOwner(input),
      ),
    deleteOwnerMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesDeleteOwnerInput) => defaultApiClient.apiNamespaceCompanies.deleteOwner(input),
      }),

    createAdmins: (input: CompaniesCreateAdminsInput) => defaultApiClient.apiNamespaceCompanies.createAdmins(input),
    useCreateAdmins: () =>
      useMutation<CompaniesCreateAdminsInput, CompaniesCreateAdminsResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.createAdmins(input),
      ),
    createAdminsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesCreateAdminsInput) => defaultApiClient.apiNamespaceCompanies.createAdmins(input),
      }),

    deleteMember: (input: CompaniesDeleteMemberInput) => defaultApiClient.apiNamespaceCompanies.deleteMember(input),
    useDeleteMember: () =>
      useMutation<CompaniesDeleteMemberInput, CompaniesDeleteMemberResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteMember(input),
      ),
    deleteMemberMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesDeleteMemberInput) => defaultApiClient.apiNamespaceCompanies.deleteMember(input),
      }),

    createMember: (input: CompaniesCreateMemberInput) => defaultApiClient.apiNamespaceCompanies.createMember(input),
    useCreateMember: () =>
      useMutation<CompaniesCreateMemberInput, CompaniesCreateMemberResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.createMember(input),
      ),
    createMemberMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesCreateMemberInput) => defaultApiClient.apiNamespaceCompanies.createMember(input),
      }),

    create: (input: CompaniesCreateInput) => defaultApiClient.apiNamespaceCompanies.create(input),
    useCreate: () =>
      useMutation<CompaniesCreateInput, CompaniesCreateResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.create(input),
      ),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesCreateInput) => defaultApiClient.apiNamespaceCompanies.create(input),
      }),

    deleteActivity: (input: CompaniesDeleteActivityInput) =>
      defaultApiClient.apiNamespaceCompanies.deleteActivity(input),
    useDeleteActivity: () =>
      useMutation<CompaniesDeleteActivityInput, CompaniesDeleteActivityResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteActivity(input),
      ),
    deleteActivityMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesDeleteActivityInput) =>
          defaultApiClient.apiNamespaceCompanies.deleteActivity(input),
      }),

    inviteGuest: (input: CompaniesInviteGuestInput) => defaultApiClient.apiNamespaceCompanies.inviteGuest(input),
    useInviteGuest: () =>
      useMutation<CompaniesInviteGuestInput, CompaniesInviteGuestResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.inviteGuest(input),
      ),
    inviteGuestMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesInviteGuestInput) => defaultApiClient.apiNamespaceCompanies.inviteGuest(input),
      }),

    updateMembersPermissions: (input: CompaniesUpdateMembersPermissionsInput) =>
      defaultApiClient.apiNamespaceCompanies.updateMembersPermissions(input),
    useUpdateMembersPermissions: () =>
      useMutation<CompaniesUpdateMembersPermissionsInput, CompaniesUpdateMembersPermissionsResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.updateMembersPermissions(input),
      ),
    updateMembersPermissionsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesUpdateMembersPermissionsInput) =>
          defaultApiClient.apiNamespaceCompanies.updateMembersPermissions(input),
      }),

    convertMemberToGuest: (input: CompaniesConvertMemberToGuestInput) =>
      defaultApiClient.apiNamespaceCompanies.convertMemberToGuest(input),
    useConvertMemberToGuest: () =>
      useMutation<CompaniesConvertMemberToGuestInput, CompaniesConvertMemberToGuestResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.convertMemberToGuest(input),
      ),
    convertMemberToGuestMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesConvertMemberToGuestInput) =>
          defaultApiClient.apiNamespaceCompanies.convertMemberToGuest(input),
      }),

    deleteAdmin: (input: CompaniesDeleteAdminInput) => defaultApiClient.apiNamespaceCompanies.deleteAdmin(input),
    useDeleteAdmin: () =>
      useMutation<CompaniesDeleteAdminInput, CompaniesDeleteAdminResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteAdmin(input),
      ),
    deleteAdminMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesDeleteAdminInput) => defaultApiClient.apiNamespaceCompanies.deleteAdmin(input),
      }),

    deleteTrustedEmailDomain: (input: CompaniesDeleteTrustedEmailDomainInput) =>
      defaultApiClient.apiNamespaceCompanies.deleteTrustedEmailDomain(input),
    useDeleteTrustedEmailDomain: () =>
      useMutation<CompaniesDeleteTrustedEmailDomainInput, CompaniesDeleteTrustedEmailDomainResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteTrustedEmailDomain(input),
      ),
    deleteTrustedEmailDomainMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesDeleteTrustedEmailDomainInput) =>
          defaultApiClient.apiNamespaceCompanies.deleteTrustedEmailDomain(input),
      }),

    update: (input: CompaniesUpdateInput) => defaultApiClient.apiNamespaceCompanies.update(input),
    useUpdate: () =>
      useMutation<CompaniesUpdateInput, CompaniesUpdateResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.update(input),
      ),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesUpdateInput) => defaultApiClient.apiNamespaceCompanies.update(input),
      }),

    restoreMember: (input: CompaniesRestoreMemberInput) => defaultApiClient.apiNamespaceCompanies.restoreMember(input),
    useRestoreMember: () =>
      useMutation<CompaniesRestoreMemberInput, CompaniesRestoreMemberResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.restoreMember(input),
      ),
    restoreMemberMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesRestoreMemberInput) => defaultApiClient.apiNamespaceCompanies.restoreMember(input),
      }),

    grantResourceAccess: (input: CompaniesGrantResourceAccessInput) =>
      defaultApiClient.apiNamespaceCompanies.grantResourceAccess(input),
    useGrantResourceAccess: () =>
      useMutation<CompaniesGrantResourceAccessInput, CompaniesGrantResourceAccessResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.grantResourceAccess(input),
      ),
    grantResourceAccessMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: CompaniesGrantResourceAccessInput) =>
          defaultApiClient.apiNamespaceCompanies.grantResourceAccess(input),
      }),
  },

  people: {
    search: (input: PeopleSearchInput) => defaultApiClient.apiNamespacePeople.search(input),
    useSearch: (input: PeopleSearchInput) =>
      useQuery<PeopleSearchResult>(() => defaultApiClient.apiNamespacePeople.search(input)),
    searchQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/search"),
    searchQueryKey: (input: PeopleSearchInput) => buildApiQueryKey(defaultApiClient, "/people/search", input),
    searchQueryOptions: (input: PeopleSearchInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/search", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchQuery: (input: PeopleSearchInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/search", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: PeopleListInput) => defaultApiClient.apiNamespacePeople.list(input),
    useList: (input: PeopleListInput) =>
      useQuery<PeopleListResult>(() => defaultApiClient.apiNamespacePeople.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/list"),
    listQueryKey: (input: PeopleListInput) => buildApiQueryKey(defaultApiClient, "/people/list", input),
    listQueryOptions: (input: PeopleListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/list", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: PeopleListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/list", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getAccount: (input: PeopleGetAccountInput) => defaultApiClient.apiNamespacePeople.getAccount(input),
    useGetAccount: (input: PeopleGetAccountInput) =>
      useQuery<PeopleGetAccountResult>(() => defaultApiClient.apiNamespacePeople.getAccount(input)),
    getAccountQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/get_account"),
    getAccountQueryKey: (input: PeopleGetAccountInput) =>
      buildApiQueryKey(defaultApiClient, "/people/get_account", input),
    getAccountQueryOptions: (input: PeopleGetAccountInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_account", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getAccount(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getAccountQuery: (input: PeopleGetAccountInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_account", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getAccount(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: PeopleGetInput) => defaultApiClient.apiNamespacePeople.get(input),
    useGet: (input: PeopleGetInput) => useQuery<PeopleGetResult>(() => defaultApiClient.apiNamespacePeople.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/get"),
    getQueryKey: (input: PeopleGetInput) => buildApiQueryKey(defaultApiClient, "/people/get", input),
    getQueryOptions: (input: PeopleGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: PeopleGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getBinded: (input: PeopleGetBindedInput) => defaultApiClient.apiNamespacePeople.getBinded(input),
    useGetBinded: (input: PeopleGetBindedInput) =>
      useQuery<PeopleGetBindedResult>(() => defaultApiClient.apiNamespacePeople.getBinded(input)),
    getBindedQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/get_binded"),
    getBindedQueryKey: (input: PeopleGetBindedInput) => buildApiQueryKey(defaultApiClient, "/people/get_binded", input),
    getBindedQueryOptions: (input: PeopleGetBindedInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_binded", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getBinded(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getBindedQuery: (input: PeopleGetBindedInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_binded", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getBinded(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listAssignments: (input: PeopleListAssignmentsInput) => defaultApiClient.apiNamespacePeople.listAssignments(input),
    useListAssignments: (input: PeopleListAssignmentsInput) =>
      useQuery<PeopleListAssignmentsResult>(() => defaultApiClient.apiNamespacePeople.listAssignments(input)),
    listAssignmentsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/list_assignments"),
    listAssignmentsQueryKey: (input: PeopleListAssignmentsInput) =>
      buildApiQueryKey(defaultApiClient, "/people/list_assignments", input),
    listAssignmentsQueryOptions: (input: PeopleListAssignmentsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/list_assignments", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.listAssignments(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listAssignmentsQuery: (input: PeopleListAssignmentsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/list_assignments", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.listAssignments(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listPossibleManagers: (input: PeopleListPossibleManagersInput) =>
      defaultApiClient.apiNamespacePeople.listPossibleManagers(input),
    useListPossibleManagers: (input: PeopleListPossibleManagersInput) =>
      useQuery<PeopleListPossibleManagersResult>(() => defaultApiClient.apiNamespacePeople.listPossibleManagers(input)),
    listPossibleManagersQueryKeyPrefix: () =>
      buildApiQueryKeyPrefix(defaultApiClient, "/people/list_possible_managers"),
    listPossibleManagersQueryKey: (input: PeopleListPossibleManagersInput) =>
      buildApiQueryKey(defaultApiClient, "/people/list_possible_managers", input),
    listPossibleManagersQueryOptions: (input: PeopleListPossibleManagersInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/list_possible_managers", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.listPossibleManagers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listPossibleManagersQuery: (input: PeopleListPossibleManagersInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/list_possible_managers", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.listPossibleManagers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getAssignmentsCount: (input: PeopleGetAssignmentsCountInput) =>
      defaultApiClient.apiNamespacePeople.getAssignmentsCount(input),
    useGetAssignmentsCount: (input: PeopleGetAssignmentsCountInput) =>
      useQuery<PeopleGetAssignmentsCountResult>(() => defaultApiClient.apiNamespacePeople.getAssignmentsCount(input)),
    getAssignmentsCountQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/get_assignments_count"),
    getAssignmentsCountQueryKey: (input: PeopleGetAssignmentsCountInput) =>
      buildApiQueryKey(defaultApiClient, "/people/get_assignments_count", input),
    getAssignmentsCountQueryOptions: (input: PeopleGetAssignmentsCountInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_assignments_count", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getAssignmentsCount(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getAssignmentsCountQuery: (input: PeopleGetAssignmentsCountInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_assignments_count", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getAssignmentsCount(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getMe: (input: PeopleGetMeInput) => defaultApiClient.apiNamespacePeople.getMe(input),
    useGetMe: (input: PeopleGetMeInput) =>
      useQuery<PeopleGetMeResult>(() => defaultApiClient.apiNamespacePeople.getMe(input)),
    getMeQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/people/get_me"),
    getMeQueryKey: (input: PeopleGetMeInput) => buildApiQueryKey(defaultApiClient, "/people/get_me", input),
    getMeQueryOptions: (input: PeopleGetMeInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_me", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getMe(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getMeQuery: (input: PeopleGetMeInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/people/get_me", input),
        queryFn: () => defaultApiClient.apiNamespacePeople.getMe(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    update: (input: PeopleUpdateInput) => defaultApiClient.apiNamespacePeople.update(input),
    useUpdate: () =>
      useMutation<PeopleUpdateInput, PeopleUpdateResult>((input) => defaultApiClient.apiNamespacePeople.update(input)),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: PeopleUpdateInput) => defaultApiClient.apiNamespacePeople.update(input),
      }),

    updatePicture: (input: PeopleUpdatePictureInput) => defaultApiClient.apiNamespacePeople.updatePicture(input),
    useUpdatePicture: () =>
      useMutation<PeopleUpdatePictureInput, PeopleUpdatePictureResult>((input) =>
        defaultApiClient.apiNamespacePeople.updatePicture(input),
      ),
    updatePictureMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: PeopleUpdatePictureInput) => defaultApiClient.apiNamespacePeople.updatePicture(input),
      }),

    updateTheme: (input: PeopleUpdateThemeInput) => defaultApiClient.apiNamespacePeople.updateTheme(input),
    useUpdateTheme: () =>
      useMutation<PeopleUpdateThemeInput, PeopleUpdateThemeResult>((input) =>
        defaultApiClient.apiNamespacePeople.updateTheme(input),
      ),
    updateThemeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: PeopleUpdateThemeInput) => defaultApiClient.apiNamespacePeople.updateTheme(input),
      }),
  },

  kpis: {
    getKpi: (input: KpisGetKpiInput) => defaultApiClient.apiNamespaceKpis.getKpi(input),
    useGetKpi: (input: KpisGetKpiInput) =>
      useQuery<KpisGetKpiResult>(() => defaultApiClient.apiNamespaceKpis.getKpi(input)),
    getKpiQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/kpis/get_kpi"),
    getKpiQueryKey: (input: KpisGetKpiInput) => buildApiQueryKey(defaultApiClient, "/kpis/get_kpi", input),
    getKpiQueryOptions: (input: KpisGetKpiInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/kpis/get_kpi", input),
        queryFn: () => defaultApiClient.apiNamespaceKpis.getKpi(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getKpiQuery: (input: KpisGetKpiInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/kpis/get_kpi", input),
        queryFn: () => defaultApiClient.apiNamespaceKpis.getKpi(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listKpis: (input: KpisListKpisInput) => defaultApiClient.apiNamespaceKpis.listKpis(input),
    useListKpis: (input: KpisListKpisInput) =>
      useQuery<KpisListKpisResult>(() => defaultApiClient.apiNamespaceKpis.listKpis(input)),
    listKpisQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/kpis/list_kpis"),
    listKpisQueryKey: (input: KpisListKpisInput) => buildApiQueryKey(defaultApiClient, "/kpis/list_kpis", input),
    listKpisQueryOptions: (input: KpisListKpisInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/kpis/list_kpis", input),
        queryFn: () => defaultApiClient.apiNamespaceKpis.listKpis(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listKpisQuery: (input: KpisListKpisInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/kpis/list_kpis", input),
        queryFn: () => defaultApiClient.apiNamespaceKpis.listKpis(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    addKpiAnnotation: (input: KpisAddKpiAnnotationInput) => defaultApiClient.apiNamespaceKpis.addKpiAnnotation(input),
    useAddKpiAnnotation: () =>
      useMutation<KpisAddKpiAnnotationInput, KpisAddKpiAnnotationResult>((input) =>
        defaultApiClient.apiNamespaceKpis.addKpiAnnotation(input),
      ),
    addKpiAnnotationMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: KpisAddKpiAnnotationInput) => defaultApiClient.apiNamespaceKpis.addKpiAnnotation(input),
      }),

    createKpi: (input: KpisCreateKpiInput) => defaultApiClient.apiNamespaceKpis.createKpi(input),
    useCreateKpi: () =>
      useMutation<KpisCreateKpiInput, KpisCreateKpiResult>((input) =>
        defaultApiClient.apiNamespaceKpis.createKpi(input),
      ),
    createKpiMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: KpisCreateKpiInput) => defaultApiClient.apiNamespaceKpis.createKpi(input),
      }),

    deleteKpiAnnotation: (input: KpisDeleteKpiAnnotationInput) =>
      defaultApiClient.apiNamespaceKpis.deleteKpiAnnotation(input),
    useDeleteKpiAnnotation: () =>
      useMutation<KpisDeleteKpiAnnotationInput, KpisDeleteKpiAnnotationResult>((input) =>
        defaultApiClient.apiNamespaceKpis.deleteKpiAnnotation(input),
      ),
    deleteKpiAnnotationMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: KpisDeleteKpiAnnotationInput) =>
          defaultApiClient.apiNamespaceKpis.deleteKpiAnnotation(input),
      }),

    deleteKpi: (input: KpisDeleteKpiInput) => defaultApiClient.apiNamespaceKpis.deleteKpi(input),
    useDeleteKpi: () =>
      useMutation<KpisDeleteKpiInput, KpisDeleteKpiResult>((input) =>
        defaultApiClient.apiNamespaceKpis.deleteKpi(input),
      ),
    deleteKpiMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: KpisDeleteKpiInput) => defaultApiClient.apiNamespaceKpis.deleteKpi(input),
      }),

    editKpi: (input: KpisEditKpiInput) => defaultApiClient.apiNamespaceKpis.editKpi(input),
    useEditKpi: () =>
      useMutation<KpisEditKpiInput, KpisEditKpiResult>((input) => defaultApiClient.apiNamespaceKpis.editKpi(input)),
    editKpiMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: KpisEditKpiInput) => defaultApiClient.apiNamespaceKpis.editKpi(input),
      }),

    editKpiAnnotation: (input: KpisEditKpiAnnotationInput) =>
      defaultApiClient.apiNamespaceKpis.editKpiAnnotation(input),
    useEditKpiAnnotation: () =>
      useMutation<KpisEditKpiAnnotationInput, KpisEditKpiAnnotationResult>((input) =>
        defaultApiClient.apiNamespaceKpis.editKpiAnnotation(input),
      ),
    editKpiAnnotationMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: KpisEditKpiAnnotationInput) => defaultApiClient.apiNamespaceKpis.editKpiAnnotation(input),
      }),

    logKpiEntry: (input: KpisLogKpiEntryInput) => defaultApiClient.apiNamespaceKpis.logKpiEntry(input),
    useLogKpiEntry: () =>
      useMutation<KpisLogKpiEntryInput, KpisLogKpiEntryResult>((input) =>
        defaultApiClient.apiNamespaceKpis.logKpiEntry(input),
      ),
    logKpiEntryMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: KpisLogKpiEntryInput) => defaultApiClient.apiNamespaceKpis.logKpiEntry(input),
      }),
  },

  spaces: {
    countByAccessLevel: (input: SpacesCountByAccessLevelInput) =>
      defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input),
    useCountByAccessLevel: (input: SpacesCountByAccessLevelInput) =>
      useQuery<SpacesCountByAccessLevelResult>(() => defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input)),
    countByAccessLevelQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/count_by_access_level"),
    countByAccessLevelQueryKey: (input: SpacesCountByAccessLevelInput) =>
      buildApiQueryKey(defaultApiClient, "/spaces/count_by_access_level", input),
    countByAccessLevelQueryOptions: (input: SpacesCountByAccessLevelInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/count_by_access_level", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    countByAccessLevelQuery: (input: SpacesCountByAccessLevelInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/count_by_access_level", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: SpacesGetInput) => defaultApiClient.apiNamespaceSpaces.get(input),
    useGet: (input: SpacesGetInput) => useQuery<SpacesGetResult>(() => defaultApiClient.apiNamespaceSpaces.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/get"),
    getQueryKey: (input: SpacesGetInput) => buildApiQueryKey(defaultApiClient, "/spaces/get", input),
    getQueryOptions: (input: SpacesGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/get", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: SpacesGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/get", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listDiscussions: (input: SpacesListDiscussionsInput) => defaultApiClient.apiNamespaceSpaces.listDiscussions(input),
    useListDiscussions: (input: SpacesListDiscussionsInput) =>
      useQuery<SpacesListDiscussionsResult>(() => defaultApiClient.apiNamespaceSpaces.listDiscussions(input)),
    listDiscussionsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/list_discussions"),
    listDiscussionsQueryKey: (input: SpacesListDiscussionsInput) =>
      buildApiQueryKey(defaultApiClient, "/spaces/list_discussions", input),
    listDiscussionsQueryOptions: (input: SpacesListDiscussionsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_discussions", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listDiscussions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listDiscussionsQuery: (input: SpacesListDiscussionsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_discussions", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listDiscussions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    search: (input: SpacesSearchInput) => defaultApiClient.apiNamespaceSpaces.search(input),
    useSearch: (input: SpacesSearchInput) =>
      useQuery<SpacesSearchResult>(() => defaultApiClient.apiNamespaceSpaces.search(input)),
    searchQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/search"),
    searchQueryKey: (input: SpacesSearchInput) => buildApiQueryKey(defaultApiClient, "/spaces/search", input),
    searchQueryOptions: (input: SpacesSearchInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/search", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchQuery: (input: SpacesSearchInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/search", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: SpacesListInput) => defaultApiClient.apiNamespaceSpaces.list(input),
    useList: (input: SpacesListInput) =>
      useQuery<SpacesListResult>(() => defaultApiClient.apiNamespaceSpaces.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/list"),
    listQueryKey: (input: SpacesListInput) => buildApiQueryKey(defaultApiClient, "/spaces/list", input),
    listQueryOptions: (input: SpacesListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: SpacesListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listTools: (input: SpacesListToolsInput) => defaultApiClient.apiNamespaceSpaces.listTools(input),
    useListTools: (input: SpacesListToolsInput) =>
      useQuery<SpacesListToolsResult>(() => defaultApiClient.apiNamespaceSpaces.listTools(input)),
    listToolsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/list_tools"),
    listToolsQueryKey: (input: SpacesListToolsInput) => buildApiQueryKey(defaultApiClient, "/spaces/list_tools", input),
    listToolsQueryOptions: (input: SpacesListToolsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_tools", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listTools(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listToolsQuery: (input: SpacesListToolsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_tools", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listTools(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listMembers: (input: SpacesListMembersInput) => defaultApiClient.apiNamespaceSpaces.listMembers(input),
    useListMembers: (input: SpacesListMembersInput) =>
      useQuery<SpacesListMembersResult>(() => defaultApiClient.apiNamespaceSpaces.listMembers(input)),
    listMembersQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/list_members"),
    listMembersQueryKey: (input: SpacesListMembersInput) =>
      buildApiQueryKey(defaultApiClient, "/spaces/list_members", input),
    listMembersQueryOptions: (input: SpacesListMembersInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_members", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listMembers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listMembersQuery: (input: SpacesListMembersInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_members", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listMembers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getDiscussion: (input: SpacesGetDiscussionInput) => defaultApiClient.apiNamespaceSpaces.getDiscussion(input),
    useGetDiscussion: (input: SpacesGetDiscussionInput) =>
      useQuery<SpacesGetDiscussionResult>(() => defaultApiClient.apiNamespaceSpaces.getDiscussion(input)),
    getDiscussionQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/get_discussion"),
    getDiscussionQueryKey: (input: SpacesGetDiscussionInput) =>
      buildApiQueryKey(defaultApiClient, "/spaces/get_discussion", input),
    getDiscussionQueryOptions: (input: SpacesGetDiscussionInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/get_discussion", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.getDiscussion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getDiscussionQuery: (input: SpacesGetDiscussionInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/get_discussion", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.getDiscussion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    searchPotentialMembers: (input: SpacesSearchPotentialMembersInput) =>
      defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
    useSearchPotentialMembers: (input: SpacesSearchPotentialMembersInput) =>
      useQuery<SpacesSearchPotentialMembersResult>(() =>
        defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
      ),
    searchPotentialMembersQueryKeyPrefix: () =>
      buildApiQueryKeyPrefix(defaultApiClient, "/spaces/search_potential_members"),
    searchPotentialMembersQueryKey: (input: SpacesSearchPotentialMembersInput) =>
      buildApiQueryKey(defaultApiClient, "/spaces/search_potential_members", input),
    searchPotentialMembersQueryOptions: (input: SpacesSearchPotentialMembersInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/search_potential_members", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchPotentialMembersQuery: (input: SpacesSearchPotentialMembersInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/search_potential_members", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listTasks: (input: SpacesListTasksInput) => defaultApiClient.apiNamespaceSpaces.listTasks(input),
    useListTasks: (input: SpacesListTasksInput) =>
      useQuery<SpacesListTasksResult>(() => defaultApiClient.apiNamespaceSpaces.listTasks(input)),
    listTasksQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/spaces/list_tasks"),
    listTasksQueryKey: (input: SpacesListTasksInput) => buildApiQueryKey(defaultApiClient, "/spaces/list_tasks", input),
    listTasksQueryOptions: (input: SpacesListTasksInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_tasks", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listTasks(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listTasksQuery: (input: SpacesListTasksInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/spaces/list_tasks", input),
        queryFn: () => defaultApiClient.apiNamespaceSpaces.listTasks(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    publishDiscussion: (input: SpacesPublishDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.publishDiscussion(input),
    usePublishDiscussion: () =>
      useMutation<SpacesPublishDiscussionInput, SpacesPublishDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.publishDiscussion(input),
      ),
    publishDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesPublishDiscussionInput) =>
          defaultApiClient.apiNamespaceSpaces.publishDiscussion(input),
      }),

    updateMembersPermissions: (input: SpacesUpdateMembersPermissionsInput) =>
      defaultApiClient.apiNamespaceSpaces.updateMembersPermissions(input),
    useUpdateMembersPermissions: () =>
      useMutation<SpacesUpdateMembersPermissionsInput, SpacesUpdateMembersPermissionsResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateMembersPermissions(input),
      ),
    updateMembersPermissionsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesUpdateMembersPermissionsInput) =>
          defaultApiClient.apiNamespaceSpaces.updateMembersPermissions(input),
      }),

    updatePermissions: (input: SpacesUpdatePermissionsInput) =>
      defaultApiClient.apiNamespaceSpaces.updatePermissions(input),
    useUpdatePermissions: () =>
      useMutation<SpacesUpdatePermissionsInput, SpacesUpdatePermissionsResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updatePermissions(input),
      ),
    updatePermissionsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesUpdatePermissionsInput) =>
          defaultApiClient.apiNamespaceSpaces.updatePermissions(input),
      }),

    updateTools: (input: SpacesUpdateToolsInput) => defaultApiClient.apiNamespaceSpaces.updateTools(input),
    useUpdateTools: () =>
      useMutation<SpacesUpdateToolsInput, SpacesUpdateToolsResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateTools(input),
      ),
    updateToolsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesUpdateToolsInput) => defaultApiClient.apiNamespaceSpaces.updateTools(input),
      }),

    archiveDiscussion: (input: SpacesArchiveDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.archiveDiscussion(input),
    useArchiveDiscussion: () =>
      useMutation<SpacesArchiveDiscussionInput, SpacesArchiveDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.archiveDiscussion(input),
      ),
    archiveDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesArchiveDiscussionInput) =>
          defaultApiClient.apiNamespaceSpaces.archiveDiscussion(input),
      }),

    update: (input: SpacesUpdateInput) => defaultApiClient.apiNamespaceSpaces.update(input),
    useUpdate: () =>
      useMutation<SpacesUpdateInput, SpacesUpdateResult>((input) => defaultApiClient.apiNamespaceSpaces.update(input)),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesUpdateInput) => defaultApiClient.apiNamespaceSpaces.update(input),
      }),

    create: (input: SpacesCreateInput) => defaultApiClient.apiNamespaceSpaces.create(input),
    useCreate: () =>
      useMutation<SpacesCreateInput, SpacesCreateResult>((input) => defaultApiClient.apiNamespaceSpaces.create(input)),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesCreateInput) => defaultApiClient.apiNamespaceSpaces.create(input),
      }),

    delete: (input: SpacesDeleteInput) => defaultApiClient.apiNamespaceSpaces.delete(input),
    useDelete: () =>
      useMutation<SpacesDeleteInput, SpacesDeleteResult>((input) => defaultApiClient.apiNamespaceSpaces.delete(input)),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesDeleteInput) => defaultApiClient.apiNamespaceSpaces.delete(input),
      }),

    updateKanban: (input: SpacesUpdateKanbanInput) => defaultApiClient.apiNamespaceSpaces.updateKanban(input),
    useUpdateKanban: () =>
      useMutation<SpacesUpdateKanbanInput, SpacesUpdateKanbanResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateKanban(input),
      ),
    updateKanbanMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesUpdateKanbanInput) => defaultApiClient.apiNamespaceSpaces.updateKanban(input),
      }),

    addMembers: (input: SpacesAddMembersInput) => defaultApiClient.apiNamespaceSpaces.addMembers(input),
    useAddMembers: () =>
      useMutation<SpacesAddMembersInput, SpacesAddMembersResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.addMembers(input),
      ),
    addMembersMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesAddMembersInput) => defaultApiClient.apiNamespaceSpaces.addMembers(input),
      }),

    join: (input: SpacesJoinInput) => defaultApiClient.apiNamespaceSpaces.join(input),
    useJoin: () =>
      useMutation<SpacesJoinInput, SpacesJoinResult>((input) => defaultApiClient.apiNamespaceSpaces.join(input)),
    joinMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesJoinInput) => defaultApiClient.apiNamespaceSpaces.join(input),
      }),

    deleteMember: (input: SpacesDeleteMemberInput) => defaultApiClient.apiNamespaceSpaces.deleteMember(input),
    useDeleteMember: () =>
      useMutation<SpacesDeleteMemberInput, SpacesDeleteMemberResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.deleteMember(input),
      ),
    deleteMemberMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesDeleteMemberInput) => defaultApiClient.apiNamespaceSpaces.deleteMember(input),
      }),

    createDiscussion: (input: SpacesCreateDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.createDiscussion(input),
    useCreateDiscussion: () =>
      useMutation<SpacesCreateDiscussionInput, SpacesCreateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.createDiscussion(input),
      ),
    createDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesCreateDiscussionInput) => defaultApiClient.apiNamespaceSpaces.createDiscussion(input),
      }),

    updateTaskStatuses: (input: SpacesUpdateTaskStatusesInput) =>
      defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
    useUpdateTaskStatuses: () =>
      useMutation<SpacesUpdateTaskStatusesInput, SpacesUpdateTaskStatusesResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
      ),
    updateTaskStatusesMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesUpdateTaskStatusesInput) =>
          defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
      }),

    updateDiscussion: (input: SpacesUpdateDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.updateDiscussion(input),
    useUpdateDiscussion: () =>
      useMutation<SpacesUpdateDiscussionInput, SpacesUpdateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateDiscussion(input),
      ),
    updateDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: SpacesUpdateDiscussionInput) => defaultApiClient.apiNamespaceSpaces.updateDiscussion(input),
      }),
  },

  tasks: {
    listTaskStatuses: (input: TasksListTaskStatusesInput) => defaultApiClient.apiNamespaceTasks.listTaskStatuses(input),
    useListTaskStatuses: (input: TasksListTaskStatusesInput) =>
      useQuery<TasksListTaskStatusesResult>(() => defaultApiClient.apiNamespaceTasks.listTaskStatuses(input)),
    listTaskStatusesQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/tasks/list_task_statuses"),
    listTaskStatusesQueryKey: (input: TasksListTaskStatusesInput) =>
      buildApiQueryKey(defaultApiClient, "/tasks/list_task_statuses", input),
    listTaskStatusesQueryOptions: (input: TasksListTaskStatusesInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/list_task_statuses", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.listTaskStatuses(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listTaskStatusesQuery: (input: TasksListTaskStatusesInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/list_task_statuses", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.listTaskStatuses(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listPotentialAssignees: (input: TasksListPotentialAssigneesInput) =>
      defaultApiClient.apiNamespaceTasks.listPotentialAssignees(input),
    useListPotentialAssignees: (input: TasksListPotentialAssigneesInput) =>
      useQuery<TasksListPotentialAssigneesResult>(() =>
        defaultApiClient.apiNamespaceTasks.listPotentialAssignees(input),
      ),
    listPotentialAssigneesQueryKeyPrefix: () =>
      buildApiQueryKeyPrefix(defaultApiClient, "/tasks/list_potential_assignees"),
    listPotentialAssigneesQueryKey: (input: TasksListPotentialAssigneesInput) =>
      buildApiQueryKey(defaultApiClient, "/tasks/list_potential_assignees", input),
    listPotentialAssigneesQueryOptions: (input: TasksListPotentialAssigneesInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/list_potential_assignees", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.listPotentialAssignees(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listPotentialAssigneesQuery: (input: TasksListPotentialAssigneesInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/list_potential_assignees", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.listPotentialAssignees(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: TasksGetInput) => defaultApiClient.apiNamespaceTasks.get(input),
    useGet: (input: TasksGetInput) => useQuery<TasksGetResult>(() => defaultApiClient.apiNamespaceTasks.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/tasks/get"),
    getQueryKey: (input: TasksGetInput) => buildApiQueryKey(defaultApiClient, "/tasks/get", input),
    getQueryOptions: (input: TasksGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/get", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: TasksGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/get", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: TasksListInput) => defaultApiClient.apiNamespaceTasks.list(input),
    useList: (input: TasksListInput) => useQuery<TasksListResult>(() => defaultApiClient.apiNamespaceTasks.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/tasks/list"),
    listQueryKey: (input: TasksListInput) => buildApiQueryKey(defaultApiClient, "/tasks/list", input),
    listQueryOptions: (input: TasksListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/list", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: TasksListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/tasks/list", input),
        queryFn: () => defaultApiClient.apiNamespaceTasks.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    updateReminders: (input: TasksUpdateRemindersInput) => defaultApiClient.apiNamespaceTasks.updateReminders(input),
    useUpdateReminders: () =>
      useMutation<TasksUpdateRemindersInput, TasksUpdateRemindersResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateReminders(input),
      ),
    updateRemindersMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateRemindersInput) => defaultApiClient.apiNamespaceTasks.updateReminders(input),
      }),

    updateAssignee: (input: TasksUpdateAssigneeInput) => defaultApiClient.apiNamespaceTasks.updateAssignee(input),
    useUpdateAssignee: () =>
      useMutation<TasksUpdateAssigneeInput, TasksUpdateAssigneeResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateAssignee(input),
      ),
    updateAssigneeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateAssigneeInput) => defaultApiClient.apiNamespaceTasks.updateAssignee(input),
      }),

    create: (input: TasksCreateInput) => defaultApiClient.apiNamespaceTasks.create(input),
    useCreate: () =>
      useMutation<TasksCreateInput, TasksCreateResult>((input) => defaultApiClient.apiNamespaceTasks.create(input)),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksCreateInput) => defaultApiClient.apiNamespaceTasks.create(input),
      }),

    updateMilestoneAndOrdering: (input: TasksUpdateMilestoneAndOrderingInput) =>
      defaultApiClient.apiNamespaceTasks.updateMilestoneAndOrdering(input),
    useUpdateMilestoneAndOrdering: () =>
      useMutation<TasksUpdateMilestoneAndOrderingInput, TasksUpdateMilestoneAndOrderingResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateMilestoneAndOrdering(input),
      ),
    updateMilestoneAndOrderingMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateMilestoneAndOrderingInput) =>
          defaultApiClient.apiNamespaceTasks.updateMilestoneAndOrdering(input),
      }),

    updateMilestone: (input: TasksUpdateMilestoneInput) => defaultApiClient.apiNamespaceTasks.updateMilestone(input),
    useUpdateMilestone: () =>
      useMutation<TasksUpdateMilestoneInput, TasksUpdateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateMilestone(input),
      ),
    updateMilestoneMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateMilestoneInput) => defaultApiClient.apiNamespaceTasks.updateMilestone(input),
      }),

    updateDescription: (input: TasksUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceTasks.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<TasksUpdateDescriptionInput, TasksUpdateDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateDescription(input),
      ),
    updateDescriptionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateDescriptionInput) => defaultApiClient.apiNamespaceTasks.updateDescription(input),
      }),

    delete: (input: TasksDeleteInput) => defaultApiClient.apiNamespaceTasks.delete(input),
    useDelete: () =>
      useMutation<TasksDeleteInput, TasksDeleteResult>((input) => defaultApiClient.apiNamespaceTasks.delete(input)),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksDeleteInput) => defaultApiClient.apiNamespaceTasks.delete(input),
      }),

    updateStatus: (input: TasksUpdateStatusInput) => defaultApiClient.apiNamespaceTasks.updateStatus(input),
    useUpdateStatus: () =>
      useMutation<TasksUpdateStatusInput, TasksUpdateStatusResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateStatus(input),
      ),
    updateStatusMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateStatusInput) => defaultApiClient.apiNamespaceTasks.updateStatus(input),
      }),

    move: (input: TasksMoveInput) => defaultApiClient.apiNamespaceTasks.move(input),
    useMove: () =>
      useMutation<TasksMoveInput, TasksMoveResult>((input) => defaultApiClient.apiNamespaceTasks.move(input)),
    moveMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksMoveInput) => defaultApiClient.apiNamespaceTasks.move(input),
      }),

    updateDueDate: (input: TasksUpdateDueDateInput) => defaultApiClient.apiNamespaceTasks.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<TasksUpdateDueDateInput, TasksUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateDueDate(input),
      ),
    updateDueDateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateDueDateInput) => defaultApiClient.apiNamespaceTasks.updateDueDate(input),
      }),

    updateName: (input: TasksUpdateNameInput) => defaultApiClient.apiNamespaceTasks.updateName(input),
    useUpdateName: () =>
      useMutation<TasksUpdateNameInput, TasksUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateName(input),
      ),
    updateNameMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: TasksUpdateNameInput) => defaultApiClient.apiNamespaceTasks.updateName(input),
      }),
  },

  project_templates: {
    getDiscussion: (input: ProjectTemplatesGetDiscussionInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.getDiscussion(input),
    useGetDiscussion: (input: ProjectTemplatesGetDiscussionInput) =>
      useQuery<ProjectTemplatesGetDiscussionResult>(() =>
        defaultApiClient.apiNamespaceProjectTemplates.getDiscussion(input),
      ),
    getDiscussionQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/project_templates/get_discussion"),
    getDiscussionQueryKey: (input: ProjectTemplatesGetDiscussionInput) =>
      buildApiQueryKey(defaultApiClient, "/project_templates/get_discussion", input),
    getDiscussionQueryOptions: (input: ProjectTemplatesGetDiscussionInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/get_discussion", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.getDiscussion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getDiscussionQuery: (input: ProjectTemplatesGetDiscussionInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/get_discussion", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.getDiscussion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: ProjectTemplatesListInput) => defaultApiClient.apiNamespaceProjectTemplates.list(input),
    useList: (input: ProjectTemplatesListInput) =>
      useQuery<ProjectTemplatesListResult>(() => defaultApiClient.apiNamespaceProjectTemplates.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/project_templates/list"),
    listQueryKey: (input: ProjectTemplatesListInput) =>
      buildApiQueryKey(defaultApiClient, "/project_templates/list", input),
    listQueryOptions: (input: ProjectTemplatesListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/list", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: ProjectTemplatesListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/list", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listComments: (input: ProjectTemplatesListCommentsInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.listComments(input),
    useListComments: (input: ProjectTemplatesListCommentsInput) =>
      useQuery<ProjectTemplatesListCommentsResult>(() =>
        defaultApiClient.apiNamespaceProjectTemplates.listComments(input),
      ),
    listCommentsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/project_templates/list_comments"),
    listCommentsQueryKey: (input: ProjectTemplatesListCommentsInput) =>
      buildApiQueryKey(defaultApiClient, "/project_templates/list_comments", input),
    listCommentsQueryOptions: (input: ProjectTemplatesListCommentsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/list_comments", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.listComments(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listCommentsQuery: (input: ProjectTemplatesListCommentsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/list_comments", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.listComments(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: ProjectTemplatesGetInput) => defaultApiClient.apiNamespaceProjectTemplates.get(input),
    useGet: (input: ProjectTemplatesGetInput) =>
      useQuery<ProjectTemplatesGetResult>(() => defaultApiClient.apiNamespaceProjectTemplates.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/project_templates/get"),
    getQueryKey: (input: ProjectTemplatesGetInput) =>
      buildApiQueryKey(defaultApiClient, "/project_templates/get", input),
    getQueryOptions: (input: ProjectTemplatesGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/get", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: ProjectTemplatesGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/project_templates/get", input),
        queryFn: () => defaultApiClient.apiNamespaceProjectTemplates.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    createLink: (input: ProjectTemplatesCreateLinkInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createLink(input),
    useCreateLink: () =>
      useMutation<ProjectTemplatesCreateLinkInput, ProjectTemplatesCreateLinkResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createLink(input),
      ),
    createLinkMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateLinkInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createLink(input),
      }),

    updateComment: (input: ProjectTemplatesUpdateCommentInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateComment(input),
    useUpdateComment: () =>
      useMutation<ProjectTemplatesUpdateCommentInput, ProjectTemplatesUpdateCommentResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateComment(input),
      ),
    updateCommentMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateCommentInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateComment(input),
      }),

    updatePerson: (input: ProjectTemplatesUpdatePersonInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updatePerson(input),
    useUpdatePerson: () =>
      useMutation<ProjectTemplatesUpdatePersonInput, ProjectTemplatesUpdatePersonResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updatePerson(input),
      ),
    updatePersonMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdatePersonInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updatePerson(input),
      }),

    updateDiscussion: (input: ProjectTemplatesUpdateDiscussionInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateDiscussion(input),
    useUpdateDiscussion: () =>
      useMutation<ProjectTemplatesUpdateDiscussionInput, ProjectTemplatesUpdateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateDiscussion(input),
      ),
    updateDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateDiscussionInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateDiscussion(input),
      }),

    create: (input: ProjectTemplatesCreateInput) => defaultApiClient.apiNamespaceProjectTemplates.create(input),
    useCreate: () =>
      useMutation<ProjectTemplatesCreateInput, ProjectTemplatesCreateResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.create(input),
      ),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateInput) => defaultApiClient.apiNamespaceProjectTemplates.create(input),
      }),

    createProject: (input: ProjectTemplatesCreateProjectInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createProject(input),
    useCreateProject: () =>
      useMutation<ProjectTemplatesCreateProjectInput, ProjectTemplatesCreateProjectResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createProject(input),
      ),
    createProjectMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateProjectInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createProject(input),
      }),

    createFolder: (input: ProjectTemplatesCreateFolderInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createFolder(input),
    useCreateFolder: () =>
      useMutation<ProjectTemplatesCreateFolderInput, ProjectTemplatesCreateFolderResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createFolder(input),
      ),
    createFolderMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateFolderInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createFolder(input),
      }),

    createTask: (input: ProjectTemplatesCreateTaskInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createTask(input),
    useCreateTask: () =>
      useMutation<ProjectTemplatesCreateTaskInput, ProjectTemplatesCreateTaskResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createTask(input),
      ),
    createTaskMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateTaskInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createTask(input),
      }),

    createFiles: (input: ProjectTemplatesCreateFilesInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createFiles(input),
    useCreateFiles: () =>
      useMutation<ProjectTemplatesCreateFilesInput, ProjectTemplatesCreateFilesResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createFiles(input),
      ),
    createFilesMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateFilesInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createFiles(input),
      }),

    archive: (input: ProjectTemplatesArchiveInput) => defaultApiClient.apiNamespaceProjectTemplates.archive(input),
    useArchive: () =>
      useMutation<ProjectTemplatesArchiveInput, ProjectTemplatesArchiveResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.archive(input),
      ),
    archiveMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesArchiveInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.archive(input),
      }),

    deleteMilestone: (input: ProjectTemplatesDeleteMilestoneInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.deleteMilestone(input),
    useDeleteMilestone: () =>
      useMutation<ProjectTemplatesDeleteMilestoneInput, ProjectTemplatesDeleteMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.deleteMilestone(input),
      ),
    deleteMilestoneMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesDeleteMilestoneInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.deleteMilestone(input),
      }),

    delete: (input: ProjectTemplatesDeleteInput) => defaultApiClient.apiNamespaceProjectTemplates.delete(input),
    useDelete: () =>
      useMutation<ProjectTemplatesDeleteInput, ProjectTemplatesDeleteResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.delete(input),
      ),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesDeleteInput) => defaultApiClient.apiNamespaceProjectTemplates.delete(input),
      }),

    moveResource: (input: ProjectTemplatesMoveResourceInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.moveResource(input),
    useMoveResource: () =>
      useMutation<ProjectTemplatesMoveResourceInput, ProjectTemplatesMoveResourceResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.moveResource(input),
      ),
    moveResourceMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesMoveResourceInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.moveResource(input),
      }),

    updateFile: (input: ProjectTemplatesUpdateFileInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateFile(input),
    useUpdateFile: () =>
      useMutation<ProjectTemplatesUpdateFileInput, ProjectTemplatesUpdateFileResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateFile(input),
      ),
    updateFileMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateFileInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateFile(input),
      }),

    createMilestone: (input: ProjectTemplatesCreateMilestoneInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createMilestone(input),
    useCreateMilestone: () =>
      useMutation<ProjectTemplatesCreateMilestoneInput, ProjectTemplatesCreateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createMilestone(input),
      ),
    createMilestoneMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateMilestoneInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createMilestone(input),
      }),

    duplicate: (input: ProjectTemplatesDuplicateInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.duplicate(input),
    useDuplicate: () =>
      useMutation<ProjectTemplatesDuplicateInput, ProjectTemplatesDuplicateResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.duplicate(input),
      ),
    duplicateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesDuplicateInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.duplicate(input),
      }),

    deleteResource: (input: ProjectTemplatesDeleteResourceInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.deleteResource(input),
    useDeleteResource: () =>
      useMutation<ProjectTemplatesDeleteResourceInput, ProjectTemplatesDeleteResourceResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.deleteResource(input),
      ),
    deleteResourceMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesDeleteResourceInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.deleteResource(input),
      }),

    updateFolder: (input: ProjectTemplatesUpdateFolderInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateFolder(input),
    useUpdateFolder: () =>
      useMutation<ProjectTemplatesUpdateFolderInput, ProjectTemplatesUpdateFolderResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateFolder(input),
      ),
    updateFolderMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateFolderInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateFolder(input),
      }),

    createDiscussion: (input: ProjectTemplatesCreateDiscussionInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createDiscussion(input),
    useCreateDiscussion: () =>
      useMutation<ProjectTemplatesCreateDiscussionInput, ProjectTemplatesCreateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createDiscussion(input),
      ),
    createDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateDiscussionInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createDiscussion(input),
      }),

    updateMilestone: (input: ProjectTemplatesUpdateMilestoneInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateMilestone(input),
    useUpdateMilestone: () =>
      useMutation<ProjectTemplatesUpdateMilestoneInput, ProjectTemplatesUpdateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateMilestone(input),
      ),
    updateMilestoneMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateMilestoneInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateMilestone(input),
      }),

    restore: (input: ProjectTemplatesRestoreInput) => defaultApiClient.apiNamespaceProjectTemplates.restore(input),
    useRestore: () =>
      useMutation<ProjectTemplatesRestoreInput, ProjectTemplatesRestoreResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.restore(input),
      ),
    restoreMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesRestoreInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.restore(input),
      }),

    createComment: (input: ProjectTemplatesCreateCommentInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createComment(input),
    useCreateComment: () =>
      useMutation<ProjectTemplatesCreateCommentInput, ProjectTemplatesCreateCommentResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createComment(input),
      ),
    createCommentMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateCommentInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createComment(input),
      }),

    createPerson: (input: ProjectTemplatesCreatePersonInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createPerson(input),
    useCreatePerson: () =>
      useMutation<ProjectTemplatesCreatePersonInput, ProjectTemplatesCreatePersonResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createPerson(input),
      ),
    createPersonMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreatePersonInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createPerson(input),
      }),

    update: (input: ProjectTemplatesUpdateInput) => defaultApiClient.apiNamespaceProjectTemplates.update(input),
    useUpdate: () =>
      useMutation<ProjectTemplatesUpdateInput, ProjectTemplatesUpdateResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.update(input),
      ),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateInput) => defaultApiClient.apiNamespaceProjectTemplates.update(input),
      }),

    updateDocument: (input: ProjectTemplatesUpdateDocumentInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateDocument(input),
    useUpdateDocument: () =>
      useMutation<ProjectTemplatesUpdateDocumentInput, ProjectTemplatesUpdateDocumentResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateDocument(input),
      ),
    updateDocumentMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateDocumentInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateDocument(input),
      }),

    createFromProject: (input: ProjectTemplatesCreateFromProjectInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createFromProject(input),
    useCreateFromProject: () =>
      useMutation<ProjectTemplatesCreateFromProjectInput, ProjectTemplatesCreateFromProjectResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createFromProject(input),
      ),
    createFromProjectMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateFromProjectInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createFromProject(input),
      }),

    deletePerson: (input: ProjectTemplatesDeletePersonInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.deletePerson(input),
    useDeletePerson: () =>
      useMutation<ProjectTemplatesDeletePersonInput, ProjectTemplatesDeletePersonResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.deletePerson(input),
      ),
    deletePersonMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesDeletePersonInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.deletePerson(input),
      }),

    updateTask: (input: ProjectTemplatesUpdateTaskInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateTask(input),
    useUpdateTask: () =>
      useMutation<ProjectTemplatesUpdateTaskInput, ProjectTemplatesUpdateTaskResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateTask(input),
      ),
    updateTaskMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateTaskInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateTask(input),
      }),

    deleteTask: (input: ProjectTemplatesDeleteTaskInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.deleteTask(input),
    useDeleteTask: () =>
      useMutation<ProjectTemplatesDeleteTaskInput, ProjectTemplatesDeleteTaskResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.deleteTask(input),
      ),
    deleteTaskMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesDeleteTaskInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.deleteTask(input),
      }),

    createDocument: (input: ProjectTemplatesCreateDocumentInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.createDocument(input),
    useCreateDocument: () =>
      useMutation<ProjectTemplatesCreateDocumentInput, ProjectTemplatesCreateDocumentResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.createDocument(input),
      ),
    createDocumentMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesCreateDocumentInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.createDocument(input),
      }),

    deleteComment: (input: ProjectTemplatesDeleteCommentInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.deleteComment(input),
    useDeleteComment: () =>
      useMutation<ProjectTemplatesDeleteCommentInput, ProjectTemplatesDeleteCommentResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.deleteComment(input),
      ),
    deleteCommentMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesDeleteCommentInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.deleteComment(input),
      }),

    updateTaskAssignees: (input: ProjectTemplatesUpdateTaskAssigneesInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateTaskAssignees(input),
    useUpdateTaskAssignees: () =>
      useMutation<ProjectTemplatesUpdateTaskAssigneesInput, ProjectTemplatesUpdateTaskAssigneesResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateTaskAssignees(input),
      ),
    updateTaskAssigneesMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateTaskAssigneesInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateTaskAssignees(input),
      }),

    updateLink: (input: ProjectTemplatesUpdateLinkInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateLink(input),
    useUpdateLink: () =>
      useMutation<ProjectTemplatesUpdateLinkInput, ProjectTemplatesUpdateLinkResult>((input) =>
        defaultApiClient.apiNamespaceProjectTemplates.updateLink(input),
      ),
    updateLinkMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateLinkInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateLink(input),
      }),

    updateMilestoneAndOrdering: (input: ProjectTemplatesUpdateMilestoneAndOrderingInput) =>
      defaultApiClient.apiNamespaceProjectTemplates.updateMilestoneAndOrdering(input),
    useUpdateMilestoneAndOrdering: () =>
      useMutation<ProjectTemplatesUpdateMilestoneAndOrderingInput, ProjectTemplatesUpdateMilestoneAndOrderingResult>(
        (input) => defaultApiClient.apiNamespaceProjectTemplates.updateMilestoneAndOrdering(input),
      ),
    updateMilestoneAndOrderingMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectTemplatesUpdateMilestoneAndOrderingInput) =>
          defaultApiClient.apiNamespaceProjectTemplates.updateMilestoneAndOrdering(input),
      }),
  },

  projects: {
    searchPotentialContributors: (input: ProjectsSearchPotentialContributorsInput) =>
      defaultApiClient.apiNamespaceProjects.searchPotentialContributors(input),
    useSearchPotentialContributors: (input: ProjectsSearchPotentialContributorsInput) =>
      useQuery<ProjectsSearchPotentialContributorsResult>(() =>
        defaultApiClient.apiNamespaceProjects.searchPotentialContributors(input),
      ),
    searchPotentialContributorsQueryKeyPrefix: () =>
      buildApiQueryKeyPrefix(defaultApiClient, "/projects/search_potential_contributors"),
    searchPotentialContributorsQueryKey: (input: ProjectsSearchPotentialContributorsInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/search_potential_contributors", input),
    searchPotentialContributorsQueryOptions: (input: ProjectsSearchPotentialContributorsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/search_potential_contributors", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.searchPotentialContributors(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchPotentialContributorsQuery: (input: ProjectsSearchPotentialContributorsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/search_potential_contributors", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.searchPotentialContributors(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    countChildren: (input: ProjectsCountChildrenInput) => defaultApiClient.apiNamespaceProjects.countChildren(input),
    useCountChildren: (input: ProjectsCountChildrenInput) =>
      useQuery<ProjectsCountChildrenResult>(() => defaultApiClient.apiNamespaceProjects.countChildren(input)),
    countChildrenQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/count_children"),
    countChildrenQueryKey: (input: ProjectsCountChildrenInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/count_children", input),
    countChildrenQueryOptions: (input: ProjectsCountChildrenInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/count_children", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.countChildren(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    countChildrenQuery: (input: ProjectsCountChildrenInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/count_children", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.countChildren(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: ProjectsListInput) => defaultApiClient.apiNamespaceProjects.list(input),
    useList: (input: ProjectsListInput) =>
      useQuery<ProjectsListResult>(() => defaultApiClient.apiNamespaceProjects.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/list"),
    listQueryKey: (input: ProjectsListInput) => buildApiQueryKey(defaultApiClient, "/projects/list", input),
    listQueryOptions: (input: ProjectsListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: ProjectsListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listMilestoneTasks: (input: ProjectsListMilestoneTasksInput) =>
      defaultApiClient.apiNamespaceProjects.listMilestoneTasks(input),
    useListMilestoneTasks: (input: ProjectsListMilestoneTasksInput) =>
      useQuery<ProjectsListMilestoneTasksResult>(() => defaultApiClient.apiNamespaceProjects.listMilestoneTasks(input)),
    listMilestoneTasksQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/list_milestone_tasks"),
    listMilestoneTasksQueryKey: (input: ProjectsListMilestoneTasksInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/list_milestone_tasks", input),
    listMilestoneTasksQueryOptions: (input: ProjectsListMilestoneTasksInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_milestone_tasks", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listMilestoneTasks(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listMilestoneTasksQuery: (input: ProjectsListMilestoneTasksInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_milestone_tasks", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listMilestoneTasks(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getMilestone: (input: ProjectsGetMilestoneInput) => defaultApiClient.apiNamespaceProjects.getMilestone(input),
    useGetMilestone: (input: ProjectsGetMilestoneInput) =>
      useQuery<ProjectsGetMilestoneResult>(() => defaultApiClient.apiNamespaceProjects.getMilestone(input)),
    getMilestoneQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/get_milestone"),
    getMilestoneQueryKey: (input: ProjectsGetMilestoneInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/get_milestone", input),
    getMilestoneQueryOptions: (input: ProjectsGetMilestoneInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_milestone", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getMilestone(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getMilestoneQuery: (input: ProjectsGetMilestoneInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_milestone", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getMilestone(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    searchParentGoal: (input: ProjectsSearchParentGoalInput) =>
      defaultApiClient.apiNamespaceProjects.searchParentGoal(input),
    useSearchParentGoal: (input: ProjectsSearchParentGoalInput) =>
      useQuery<ProjectsSearchParentGoalResult>(() => defaultApiClient.apiNamespaceProjects.searchParentGoal(input)),
    searchParentGoalQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/search_parent_goal"),
    searchParentGoalQueryKey: (input: ProjectsSearchParentGoalInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/search_parent_goal", input),
    searchParentGoalQueryOptions: (input: ProjectsSearchParentGoalInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/search_parent_goal", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.searchParentGoal(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchParentGoalQuery: (input: ProjectsSearchParentGoalInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/search_parent_goal", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.searchParentGoal(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listContributors: (input: ProjectsListContributorsInput) =>
      defaultApiClient.apiNamespaceProjects.listContributors(input),
    useListContributors: (input: ProjectsListContributorsInput) =>
      useQuery<ProjectsListContributorsResult>(() => defaultApiClient.apiNamespaceProjects.listContributors(input)),
    listContributorsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/list_contributors"),
    listContributorsQueryKey: (input: ProjectsListContributorsInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/list_contributors", input),
    listContributorsQueryOptions: (input: ProjectsListContributorsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_contributors", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listContributors(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listContributorsQuery: (input: ProjectsListContributorsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_contributors", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listContributors(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: ProjectsGetInput) => defaultApiClient.apiNamespaceProjects.get(input),
    useGet: (input: ProjectsGetInput) =>
      useQuery<ProjectsGetResult>(() => defaultApiClient.apiNamespaceProjects.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/get"),
    getQueryKey: (input: ProjectsGetInput) => buildApiQueryKey(defaultApiClient, "/projects/get", input),
    getQueryOptions: (input: ProjectsGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: ProjectsGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getContributor: (input: ProjectsGetContributorInput) => defaultApiClient.apiNamespaceProjects.getContributor(input),
    useGetContributor: (input: ProjectsGetContributorInput) =>
      useQuery<ProjectsGetContributorResult>(() => defaultApiClient.apiNamespaceProjects.getContributor(input)),
    getContributorQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/get_contributor"),
    getContributorQueryKey: (input: ProjectsGetContributorInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/get_contributor", input),
    getContributorQueryOptions: (input: ProjectsGetContributorInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_contributor", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getContributor(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getContributorQuery: (input: ProjectsGetContributorInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_contributor", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getContributor(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getDiscussion: (input: ProjectsGetDiscussionInput) => defaultApiClient.apiNamespaceProjects.getDiscussion(input),
    useGetDiscussion: (input: ProjectsGetDiscussionInput) =>
      useQuery<ProjectsGetDiscussionResult>(() => defaultApiClient.apiNamespaceProjects.getDiscussion(input)),
    getDiscussionQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/get_discussion"),
    getDiscussionQueryKey: (input: ProjectsGetDiscussionInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/get_discussion", input),
    getDiscussionQueryOptions: (input: ProjectsGetDiscussionInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_discussion", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getDiscussion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getDiscussionQuery: (input: ProjectsGetDiscussionInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_discussion", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getDiscussion(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listCheckIns: (input: ProjectsListCheckInsInput) => defaultApiClient.apiNamespaceProjects.listCheckIns(input),
    useListCheckIns: (input: ProjectsListCheckInsInput) =>
      useQuery<ProjectsListCheckInsResult>(() => defaultApiClient.apiNamespaceProjects.listCheckIns(input)),
    listCheckInsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/list_check_ins"),
    listCheckInsQueryKey: (input: ProjectsListCheckInsInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/list_check_ins", input),
    listCheckInsQueryOptions: (input: ProjectsListCheckInsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_check_ins", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listCheckIns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listCheckInsQuery: (input: ProjectsListCheckInsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_check_ins", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listCheckIns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listMilestones: (input: ProjectsListMilestonesInput) => defaultApiClient.apiNamespaceProjects.listMilestones(input),
    useListMilestones: (input: ProjectsListMilestonesInput) =>
      useQuery<ProjectsListMilestonesResult>(() => defaultApiClient.apiNamespaceProjects.listMilestones(input)),
    listMilestonesQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/list_milestones"),
    listMilestonesQueryKey: (input: ProjectsListMilestonesInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/list_milestones", input),
    listMilestonesQueryOptions: (input: ProjectsListMilestonesInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_milestones", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listMilestones(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listMilestonesQuery: (input: ProjectsListMilestonesInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_milestones", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listMilestones(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getRetrospective: (input: ProjectsGetRetrospectiveInput) =>
      defaultApiClient.apiNamespaceProjects.getRetrospective(input),
    useGetRetrospective: (input: ProjectsGetRetrospectiveInput) =>
      useQuery<ProjectsGetRetrospectiveResult>(() => defaultApiClient.apiNamespaceProjects.getRetrospective(input)),
    getRetrospectiveQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/get_retrospective"),
    getRetrospectiveQueryKey: (input: ProjectsGetRetrospectiveInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/get_retrospective", input),
    getRetrospectiveQueryOptions: (input: ProjectsGetRetrospectiveInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_retrospective", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getRetrospective(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getRetrospectiveQuery: (input: ProjectsGetRetrospectiveInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_retrospective", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getRetrospective(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listDiscussions: (input: ProjectsListDiscussionsInput) =>
      defaultApiClient.apiNamespaceProjects.listDiscussions(input),
    useListDiscussions: (input: ProjectsListDiscussionsInput) =>
      useQuery<ProjectsListDiscussionsResult>(() => defaultApiClient.apiNamespaceProjects.listDiscussions(input)),
    listDiscussionsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/list_discussions"),
    listDiscussionsQueryKey: (input: ProjectsListDiscussionsInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/list_discussions", input),
    listDiscussionsQueryOptions: (input: ProjectsListDiscussionsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_discussions", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listDiscussions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listDiscussionsQuery: (input: ProjectsListDiscussionsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/list_discussions", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.listDiscussions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    search: (input: ProjectsSearchInput) => defaultApiClient.apiNamespaceProjects.search(input),
    useSearch: (input: ProjectsSearchInput) =>
      useQuery<ProjectsSearchResult>(() => defaultApiClient.apiNamespaceProjects.search(input)),
    searchQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/search"),
    searchQueryKey: (input: ProjectsSearchInput) => buildApiQueryKey(defaultApiClient, "/projects/search", input),
    searchQueryOptions: (input: ProjectsSearchInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/search", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchQuery: (input: ProjectsSearchInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/search", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.search(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getCheckIn: (input: ProjectsGetCheckInInput) => defaultApiClient.apiNamespaceProjects.getCheckIn(input),
    useGetCheckIn: (input: ProjectsGetCheckInInput) =>
      useQuery<ProjectsGetCheckInResult>(() => defaultApiClient.apiNamespaceProjects.getCheckIn(input)),
    getCheckInQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/projects/get_check_in"),
    getCheckInQueryKey: (input: ProjectsGetCheckInInput) =>
      buildApiQueryKey(defaultApiClient, "/projects/get_check_in", input),
    getCheckInQueryOptions: (input: ProjectsGetCheckInInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_check_in", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getCheckIn(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getCheckInQuery: (input: ProjectsGetCheckInInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/projects/get_check_in", input),
        queryFn: () => defaultApiClient.apiNamespaceProjects.getCheckIn(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    updateParentGoal: (input: ProjectsUpdateParentGoalInput) =>
      defaultApiClient.apiNamespaceProjects.updateParentGoal(input),
    useUpdateParentGoal: () =>
      useMutation<ProjectsUpdateParentGoalInput, ProjectsUpdateParentGoalResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateParentGoal(input),
      ),
    updateParentGoalMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateParentGoalInput) =>
          defaultApiClient.apiNamespaceProjects.updateParentGoal(input),
      }),

    updateName: (input: ProjectsUpdateNameInput) => defaultApiClient.apiNamespaceProjects.updateName(input),
    useUpdateName: () =>
      useMutation<ProjectsUpdateNameInput, ProjectsUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateName(input),
      ),
    updateNameMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateNameInput) => defaultApiClient.apiNamespaceProjects.updateName(input),
      }),

    createMilestone: (input: ProjectsCreateMilestoneInput) =>
      defaultApiClient.apiNamespaceProjects.createMilestone(input),
    useCreateMilestone: () =>
      useMutation<ProjectsCreateMilestoneInput, ProjectsCreateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createMilestone(input),
      ),
    createMilestoneMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCreateMilestoneInput) =>
          defaultApiClient.apiNamespaceProjects.createMilestone(input),
      }),

    pause: (input: ProjectsPauseInput) => defaultApiClient.apiNamespaceProjects.pause(input),
    usePause: () =>
      useMutation<ProjectsPauseInput, ProjectsPauseResult>((input) =>
        defaultApiClient.apiNamespaceProjects.pause(input),
      ),
    pauseMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsPauseInput) => defaultApiClient.apiNamespaceProjects.pause(input),
      }),

    updateDescription: (input: ProjectsUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceProjects.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<ProjectsUpdateDescriptionInput, ProjectsUpdateDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateDescription(input),
      ),
    updateDescriptionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateDescriptionInput) =>
          defaultApiClient.apiNamespaceProjects.updateDescription(input),
      }),

    createContributors: (input: ProjectsCreateContributorsInput) =>
      defaultApiClient.apiNamespaceProjects.createContributors(input),
    useCreateContributors: () =>
      useMutation<ProjectsCreateContributorsInput, ProjectsCreateContributorsResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createContributors(input),
      ),
    createContributorsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCreateContributorsInput) =>
          defaultApiClient.apiNamespaceProjects.createContributors(input),
      }),

    deleteContributor: (input: ProjectsDeleteContributorInput) =>
      defaultApiClient.apiNamespaceProjects.deleteContributor(input),
    useDeleteContributor: () =>
      useMutation<ProjectsDeleteContributorInput, ProjectsDeleteContributorResult>((input) =>
        defaultApiClient.apiNamespaceProjects.deleteContributor(input),
      ),
    deleteContributorMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsDeleteContributorInput) =>
          defaultApiClient.apiNamespaceProjects.deleteContributor(input),
      }),

    updateDueDate: (input: ProjectsUpdateDueDateInput) => defaultApiClient.apiNamespaceProjects.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<ProjectsUpdateDueDateInput, ProjectsUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateDueDate(input),
      ),
    updateDueDateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateDueDateInput) => defaultApiClient.apiNamespaceProjects.updateDueDate(input),
      }),

    createCheckIn: (input: ProjectsCreateCheckInInput) => defaultApiClient.apiNamespaceProjects.createCheckIn(input),
    useCreateCheckIn: () =>
      useMutation<ProjectsCreateCheckInInput, ProjectsCreateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createCheckIn(input),
      ),
    createCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCreateCheckInInput) => defaultApiClient.apiNamespaceProjects.createCheckIn(input),
      }),

    createDiscussion: (input: ProjectsCreateDiscussionInput) =>
      defaultApiClient.apiNamespaceProjects.createDiscussion(input),
    useCreateDiscussion: () =>
      useMutation<ProjectsCreateDiscussionInput, ProjectsCreateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createDiscussion(input),
      ),
    createDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCreateDiscussionInput) =>
          defaultApiClient.apiNamespaceProjects.createDiscussion(input),
      }),

    updateRetrospective: (input: ProjectsUpdateRetrospectiveInput) =>
      defaultApiClient.apiNamespaceProjects.updateRetrospective(input),
    useUpdateRetrospective: () =>
      useMutation<ProjectsUpdateRetrospectiveInput, ProjectsUpdateRetrospectiveResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateRetrospective(input),
      ),
    updateRetrospectiveMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateRetrospectiveInput) =>
          defaultApiClient.apiNamespaceProjects.updateRetrospective(input),
      }),

    deleteCheckIn: (input: ProjectsDeleteCheckInInput) => defaultApiClient.apiNamespaceProjects.deleteCheckIn(input),
    useDeleteCheckIn: () =>
      useMutation<ProjectsDeleteCheckInInput, ProjectsDeleteCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.deleteCheckIn(input),
      ),
    deleteCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsDeleteCheckInInput) => defaultApiClient.apiNamespaceProjects.deleteCheckIn(input),
      }),

    moveToSpace: (input: ProjectsMoveToSpaceInput) => defaultApiClient.apiNamespaceProjects.moveToSpace(input),
    useMoveToSpace: () =>
      useMutation<ProjectsMoveToSpaceInput, ProjectsMoveToSpaceResult>((input) =>
        defaultApiClient.apiNamespaceProjects.moveToSpace(input),
      ),
    moveToSpaceMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsMoveToSpaceInput) => defaultApiClient.apiNamespaceProjects.moveToSpace(input),
      }),

    updateMilestoneOrdering: (input: ProjectsUpdateMilestoneOrderingInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneOrdering(input),
    useUpdateMilestoneOrdering: () =>
      useMutation<ProjectsUpdateMilestoneOrderingInput, ProjectsUpdateMilestoneOrderingResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneOrdering(input),
      ),
    updateMilestoneOrderingMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateMilestoneOrderingInput) =>
          defaultApiClient.apiNamespaceProjects.updateMilestoneOrdering(input),
      }),

    close: (input: ProjectsCloseInput) => defaultApiClient.apiNamespaceProjects.close(input),
    useClose: () =>
      useMutation<ProjectsCloseInput, ProjectsCloseResult>((input) =>
        defaultApiClient.apiNamespaceProjects.close(input),
      ),
    closeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCloseInput) => defaultApiClient.apiNamespaceProjects.close(input),
      }),

    acknowledgeRetrospective: (input: ProjectsAcknowledgeRetrospectiveInput) =>
      defaultApiClient.apiNamespaceProjects.acknowledgeRetrospective(input),
    useAcknowledgeRetrospective: () =>
      useMutation<ProjectsAcknowledgeRetrospectiveInput, ProjectsAcknowledgeRetrospectiveResult>((input) =>
        defaultApiClient.apiNamespaceProjects.acknowledgeRetrospective(input),
      ),
    acknowledgeRetrospectiveMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsAcknowledgeRetrospectiveInput) =>
          defaultApiClient.apiNamespaceProjects.acknowledgeRetrospective(input),
      }),

    updateContributor: (input: ProjectsUpdateContributorInput) =>
      defaultApiClient.apiNamespaceProjects.updateContributor(input),
    useUpdateContributor: () =>
      useMutation<ProjectsUpdateContributorInput, ProjectsUpdateContributorResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateContributor(input),
      ),
    updateContributorMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateContributorInput) =>
          defaultApiClient.apiNamespaceProjects.updateContributor(input),
      }),

    updatePermissions: (input: ProjectsUpdatePermissionsInput) =>
      defaultApiClient.apiNamespaceProjects.updatePermissions(input),
    useUpdatePermissions: () =>
      useMutation<ProjectsUpdatePermissionsInput, ProjectsUpdatePermissionsResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updatePermissions(input),
      ),
    updatePermissionsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdatePermissionsInput) =>
          defaultApiClient.apiNamespaceProjects.updatePermissions(input),
      }),

    updateMilestoneDueDate: (input: ProjectsUpdateMilestoneDueDateInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneDueDate(input),
    useUpdateMilestoneDueDate: () =>
      useMutation<ProjectsUpdateMilestoneDueDateInput, ProjectsUpdateMilestoneDueDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneDueDate(input),
      ),
    updateMilestoneDueDateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateMilestoneDueDateInput) =>
          defaultApiClient.apiNamespaceProjects.updateMilestoneDueDate(input),
      }),

    updateStartDate: (input: ProjectsUpdateStartDateInput) =>
      defaultApiClient.apiNamespaceProjects.updateStartDate(input),
    useUpdateStartDate: () =>
      useMutation<ProjectsUpdateStartDateInput, ProjectsUpdateStartDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateStartDate(input),
      ),
    updateStartDateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateStartDateInput) =>
          defaultApiClient.apiNamespaceProjects.updateStartDate(input),
      }),

    updateMilestoneDescription: (input: ProjectsUpdateMilestoneDescriptionInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneDescription(input),
    useUpdateMilestoneDescription: () =>
      useMutation<ProjectsUpdateMilestoneDescriptionInput, ProjectsUpdateMilestoneDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneDescription(input),
      ),
    updateMilestoneDescriptionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateMilestoneDescriptionInput) =>
          defaultApiClient.apiNamespaceProjects.updateMilestoneDescription(input),
      }),

    resume: (input: ProjectsResumeInput) => defaultApiClient.apiNamespaceProjects.resume(input),
    useResume: () =>
      useMutation<ProjectsResumeInput, ProjectsResumeResult>((input) =>
        defaultApiClient.apiNamespaceProjects.resume(input),
      ),
    resumeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsResumeInput) => defaultApiClient.apiNamespaceProjects.resume(input),
      }),

    updateKanban: (input: ProjectsUpdateKanbanInput) => defaultApiClient.apiNamespaceProjects.updateKanban(input),
    useUpdateKanban: () =>
      useMutation<ProjectsUpdateKanbanInput, ProjectsUpdateKanbanResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateKanban(input),
      ),
    updateKanbanMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateKanbanInput) => defaultApiClient.apiNamespaceProjects.updateKanban(input),
      }),

    create: (input: ProjectsCreateInput) => defaultApiClient.apiNamespaceProjects.create(input),
    useCreate: () =>
      useMutation<ProjectsCreateInput, ProjectsCreateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.create(input),
      ),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCreateInput) => defaultApiClient.apiNamespaceProjects.create(input),
      }),

    createMilestoneComment: (input: ProjectsCreateMilestoneCommentInput) =>
      defaultApiClient.apiNamespaceProjects.createMilestoneComment(input),
    useCreateMilestoneComment: () =>
      useMutation<ProjectsCreateMilestoneCommentInput, ProjectsCreateMilestoneCommentResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createMilestoneComment(input),
      ),
    createMilestoneCommentMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCreateMilestoneCommentInput) =>
          defaultApiClient.apiNamespaceProjects.createMilestoneComment(input),
      }),

    updateMilestoneTitle: (input: ProjectsUpdateMilestoneTitleInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneTitle(input),
    useUpdateMilestoneTitle: () =>
      useMutation<ProjectsUpdateMilestoneTitleInput, ProjectsUpdateMilestoneTitleResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneTitle(input),
      ),
    updateMilestoneTitleMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateMilestoneTitleInput) =>
          defaultApiClient.apiNamespaceProjects.updateMilestoneTitle(input),
      }),

    updateReviewer: (input: ProjectsUpdateReviewerInput) => defaultApiClient.apiNamespaceProjects.updateReviewer(input),
    useUpdateReviewer: () =>
      useMutation<ProjectsUpdateReviewerInput, ProjectsUpdateReviewerResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateReviewer(input),
      ),
    updateReviewerMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateReviewerInput) => defaultApiClient.apiNamespaceProjects.updateReviewer(input),
      }),

    updateTaskStatuses: (input: ProjectsUpdateTaskStatusesInput) =>
      defaultApiClient.apiNamespaceProjects.updateTaskStatuses(input),
    useUpdateTaskStatuses: () =>
      useMutation<ProjectsUpdateTaskStatusesInput, ProjectsUpdateTaskStatusesResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateTaskStatuses(input),
      ),
    updateTaskStatusesMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateTaskStatusesInput) =>
          defaultApiClient.apiNamespaceProjects.updateTaskStatuses(input),
      }),

    updateMilestone: (input: ProjectsUpdateMilestoneInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestone(input),
    useUpdateMilestone: () =>
      useMutation<ProjectsUpdateMilestoneInput, ProjectsUpdateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestone(input),
      ),
    updateMilestoneMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateMilestoneInput) =>
          defaultApiClient.apiNamespaceProjects.updateMilestone(input),
      }),

    updateChampion: (input: ProjectsUpdateChampionInput) => defaultApiClient.apiNamespaceProjects.updateChampion(input),
    useUpdateChampion: () =>
      useMutation<ProjectsUpdateChampionInput, ProjectsUpdateChampionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateChampion(input),
      ),
    updateChampionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateChampionInput) => defaultApiClient.apiNamespaceProjects.updateChampion(input),
      }),

    acknowledgeCheckIn: (input: ProjectsAcknowledgeCheckInInput) =>
      defaultApiClient.apiNamespaceProjects.acknowledgeCheckIn(input),
    useAcknowledgeCheckIn: () =>
      useMutation<ProjectsAcknowledgeCheckInInput, ProjectsAcknowledgeCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.acknowledgeCheckIn(input),
      ),
    acknowledgeCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsAcknowledgeCheckInInput) =>
          defaultApiClient.apiNamespaceProjects.acknowledgeCheckIn(input),
      }),

    delete: (input: ProjectsDeleteInput) => defaultApiClient.apiNamespaceProjects.delete(input),
    useDelete: () =>
      useMutation<ProjectsDeleteInput, ProjectsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceProjects.delete(input),
      ),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsDeleteInput) => defaultApiClient.apiNamespaceProjects.delete(input),
      }),

    deleteMilestone: (input: ProjectsDeleteMilestoneInput) =>
      defaultApiClient.apiNamespaceProjects.deleteMilestone(input),
    useDeleteMilestone: () =>
      useMutation<ProjectsDeleteMilestoneInput, ProjectsDeleteMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjects.deleteMilestone(input),
      ),
    deleteMilestoneMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsDeleteMilestoneInput) =>
          defaultApiClient.apiNamespaceProjects.deleteMilestone(input),
      }),

    updateDiscussion: (input: ProjectsUpdateDiscussionInput) =>
      defaultApiClient.apiNamespaceProjects.updateDiscussion(input),
    useUpdateDiscussion: () =>
      useMutation<ProjectsUpdateDiscussionInput, ProjectsUpdateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateDiscussion(input),
      ),
    updateDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateDiscussionInput) =>
          defaultApiClient.apiNamespaceProjects.updateDiscussion(input),
      }),

    updateCheckIn: (input: ProjectsUpdateCheckInInput) => defaultApiClient.apiNamespaceProjects.updateCheckIn(input),
    useUpdateCheckIn: () =>
      useMutation<ProjectsUpdateCheckInInput, ProjectsUpdateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateCheckIn(input),
      ),
    updateCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateCheckInInput) => defaultApiClient.apiNamespaceProjects.updateCheckIn(input),
      }),

    updateMilestoneKanban: (input: ProjectsUpdateMilestoneKanbanInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneKanban(input),
    useUpdateMilestoneKanban: () =>
      useMutation<ProjectsUpdateMilestoneKanbanInput, ProjectsUpdateMilestoneKanbanResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneKanban(input),
      ),
    updateMilestoneKanbanMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateMilestoneKanbanInput) =>
          defaultApiClient.apiNamespaceProjects.updateMilestoneKanban(input),
      }),

    updateTasksView: (input: ProjectsUpdateTasksViewInput) =>
      defaultApiClient.apiNamespaceProjects.updateTasksView(input),
    useUpdateTasksView: () =>
      useMutation<ProjectsUpdateTasksViewInput, ProjectsUpdateTasksViewResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateTasksView(input),
      ),
    updateTasksViewMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsUpdateTasksViewInput) =>
          defaultApiClient.apiNamespaceProjects.updateTasksView(input),
      }),

    createContributor: (input: ProjectsCreateContributorInput) =>
      defaultApiClient.apiNamespaceProjects.createContributor(input),
    useCreateContributor: () =>
      useMutation<ProjectsCreateContributorInput, ProjectsCreateContributorResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createContributor(input),
      ),
    createContributorMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ProjectsCreateContributorInput) =>
          defaultApiClient.apiNamespaceProjects.createContributor(input),
      }),
  },

  goals: {
    listAccessMembers: (input: GoalsListAccessMembersInput) =>
      defaultApiClient.apiNamespaceGoals.listAccessMembers(input),
    useListAccessMembers: (input: GoalsListAccessMembersInput) =>
      useQuery<GoalsListAccessMembersResult>(() => defaultApiClient.apiNamespaceGoals.listAccessMembers(input)),
    listAccessMembersQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/list_access_members"),
    listAccessMembersQueryKey: (input: GoalsListAccessMembersInput) =>
      buildApiQueryKey(defaultApiClient, "/goals/list_access_members", input),
    listAccessMembersQueryOptions: (input: GoalsListAccessMembersInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_access_members", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listAccessMembers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listAccessMembersQuery: (input: GoalsListAccessMembersInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_access_members", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listAccessMembers(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    getCheckIn: (input: GoalsGetCheckInInput) => defaultApiClient.apiNamespaceGoals.getCheckIn(input),
    useGetCheckIn: (input: GoalsGetCheckInInput) =>
      useQuery<GoalsGetCheckInResult>(() => defaultApiClient.apiNamespaceGoals.getCheckIn(input)),
    getCheckInQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/get_check_in"),
    getCheckInQueryKey: (input: GoalsGetCheckInInput) =>
      buildApiQueryKey(defaultApiClient, "/goals/get_check_in", input),
    getCheckInQueryOptions: (input: GoalsGetCheckInInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/get_check_in", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.getCheckIn(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getCheckInQuery: (input: GoalsGetCheckInInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/get_check_in", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.getCheckIn(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    list: (input: GoalsListInput) => defaultApiClient.apiNamespaceGoals.list(input),
    useList: (input: GoalsListInput) => useQuery<GoalsListResult>(() => defaultApiClient.apiNamespaceGoals.list(input)),
    listQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/list"),
    listQueryKey: (input: GoalsListInput) => buildApiQueryKey(defaultApiClient, "/goals/list", input),
    listQueryOptions: (input: GoalsListInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listQuery: (input: GoalsListInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.list(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listContributors: (input: GoalsListContributorsInput) => defaultApiClient.apiNamespaceGoals.listContributors(input),
    useListContributors: (input: GoalsListContributorsInput) =>
      useQuery<GoalsListContributorsResult>(() => defaultApiClient.apiNamespaceGoals.listContributors(input)),
    listContributorsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/list_contributors"),
    listContributorsQueryKey: (input: GoalsListContributorsInput) =>
      buildApiQueryKey(defaultApiClient, "/goals/list_contributors", input),
    listContributorsQueryOptions: (input: GoalsListContributorsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_contributors", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listContributors(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listContributorsQuery: (input: GoalsListContributorsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_contributors", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listContributors(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listCheckIns: (input: GoalsListCheckInsInput) => defaultApiClient.apiNamespaceGoals.listCheckIns(input),
    useListCheckIns: (input: GoalsListCheckInsInput) =>
      useQuery<GoalsListCheckInsResult>(() => defaultApiClient.apiNamespaceGoals.listCheckIns(input)),
    listCheckInsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/list_check_ins"),
    listCheckInsQueryKey: (input: GoalsListCheckInsInput) =>
      buildApiQueryKey(defaultApiClient, "/goals/list_check_ins", input),
    listCheckInsQueryOptions: (input: GoalsListCheckInsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_check_ins", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listCheckIns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listCheckInsQuery: (input: GoalsListCheckInsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_check_ins", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listCheckIns(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    searchParentGoal: (input: GoalsSearchParentGoalInput) => defaultApiClient.apiNamespaceGoals.searchParentGoal(input),
    useSearchParentGoal: (input: GoalsSearchParentGoalInput) =>
      useQuery<GoalsSearchParentGoalResult>(() => defaultApiClient.apiNamespaceGoals.searchParentGoal(input)),
    searchParentGoalQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/search_parent_goal"),
    searchParentGoalQueryKey: (input: GoalsSearchParentGoalInput) =>
      buildApiQueryKey(defaultApiClient, "/goals/search_parent_goal", input),
    searchParentGoalQueryOptions: (input: GoalsSearchParentGoalInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/search_parent_goal", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.searchParentGoal(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    searchParentGoalQuery: (input: GoalsSearchParentGoalInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/search_parent_goal", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.searchParentGoal(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    get: (input: GoalsGetInput) => defaultApiClient.apiNamespaceGoals.get(input),
    useGet: (input: GoalsGetInput) => useQuery<GoalsGetResult>(() => defaultApiClient.apiNamespaceGoals.get(input)),
    getQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/get"),
    getQueryKey: (input: GoalsGetInput) => buildApiQueryKey(defaultApiClient, "/goals/get", input),
    getQueryOptions: (input: GoalsGetInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/get", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    getQuery: (input: GoalsGetInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/get", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.get(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    listDiscussions: (input: GoalsListDiscussionsInput) => defaultApiClient.apiNamespaceGoals.listDiscussions(input),
    useListDiscussions: (input: GoalsListDiscussionsInput) =>
      useQuery<GoalsListDiscussionsResult>(() => defaultApiClient.apiNamespaceGoals.listDiscussions(input)),
    listDiscussionsQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/list_discussions"),
    listDiscussionsQueryKey: (input: GoalsListDiscussionsInput) =>
      buildApiQueryKey(defaultApiClient, "/goals/list_discussions", input),
    listDiscussionsQueryOptions: (input: GoalsListDiscussionsInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_discussions", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listDiscussions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    listDiscussionsQuery: (input: GoalsListDiscussionsInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/list_discussions", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.listDiscussions(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    countChildren: (input: GoalsCountChildrenInput) => defaultApiClient.apiNamespaceGoals.countChildren(input),
    useCountChildren: (input: GoalsCountChildrenInput) =>
      useQuery<GoalsCountChildrenResult>(() => defaultApiClient.apiNamespaceGoals.countChildren(input)),
    countChildrenQueryKeyPrefix: () => buildApiQueryKeyPrefix(defaultApiClient, "/goals/count_children"),
    countChildrenQueryKey: (input: GoalsCountChildrenInput) =>
      buildApiQueryKey(defaultApiClient, "/goals/count_children", input),
    countChildrenQueryOptions: (input: GoalsCountChildrenInput) =>
      queryOptions({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/count_children", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.countChildren(input),
        staleTime: "static",
        refetchOnMount: true,
      }),
    countChildrenQuery: (input: GoalsCountChildrenInput) =>
      queryClient.query({
        queryKey: buildApiQueryKey(defaultApiClient, "/goals/count_children", input),
        queryFn: () => defaultApiClient.apiNamespaceGoals.countChildren(input),
        staleTime: "static",
        refetchOnMount: true,
      }),

    updateName: (input: GoalsUpdateNameInput) => defaultApiClient.apiNamespaceGoals.updateName(input),
    useUpdateName: () =>
      useMutation<GoalsUpdateNameInput, GoalsUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateName(input),
      ),
    updateNameMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateNameInput) => defaultApiClient.apiNamespaceGoals.updateName(input),
      }),

    updateAccessMember: (input: GoalsUpdateAccessMemberInput) =>
      defaultApiClient.apiNamespaceGoals.updateAccessMember(input),
    useUpdateAccessMember: () =>
      useMutation<GoalsUpdateAccessMemberInput, GoalsUpdateAccessMemberResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateAccessMember(input),
      ),
    updateAccessMemberMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateAccessMemberInput) =>
          defaultApiClient.apiNamespaceGoals.updateAccessMember(input),
      }),

    updateTargetIndex: (input: GoalsUpdateTargetIndexInput) =>
      defaultApiClient.apiNamespaceGoals.updateTargetIndex(input),
    useUpdateTargetIndex: () =>
      useMutation<GoalsUpdateTargetIndexInput, GoalsUpdateTargetIndexResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateTargetIndex(input),
      ),
    updateTargetIndexMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateTargetIndexInput) => defaultApiClient.apiNamespaceGoals.updateTargetIndex(input),
      }),

    deleteCheckIn: (input: GoalsDeleteCheckInInput) => defaultApiClient.apiNamespaceGoals.deleteCheckIn(input),
    useDeleteCheckIn: () =>
      useMutation<GoalsDeleteCheckInInput, GoalsDeleteCheckInResult>((input) =>
        defaultApiClient.apiNamespaceGoals.deleteCheckIn(input),
      ),
    deleteCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsDeleteCheckInInput) => defaultApiClient.apiNamespaceGoals.deleteCheckIn(input),
      }),

    updateAccessLevels: (input: GoalsUpdateAccessLevelsInput) =>
      defaultApiClient.apiNamespaceGoals.updateAccessLevels(input),
    useUpdateAccessLevels: () =>
      useMutation<GoalsUpdateAccessLevelsInput, GoalsUpdateAccessLevelsResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateAccessLevels(input),
      ),
    updateAccessLevelsMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateAccessLevelsInput) =>
          defaultApiClient.apiNamespaceGoals.updateAccessLevels(input),
      }),

    acknowledgeRetrospective: (input: GoalsAcknowledgeRetrospectiveInput) =>
      defaultApiClient.apiNamespaceGoals.acknowledgeRetrospective(input),
    useAcknowledgeRetrospective: () =>
      useMutation<GoalsAcknowledgeRetrospectiveInput, GoalsAcknowledgeRetrospectiveResult>((input) =>
        defaultApiClient.apiNamespaceGoals.acknowledgeRetrospective(input),
      ),
    acknowledgeRetrospectiveMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsAcknowledgeRetrospectiveInput) =>
          defaultApiClient.apiNamespaceGoals.acknowledgeRetrospective(input),
      }),

    createDiscussion: (input: GoalsCreateDiscussionInput) => defaultApiClient.apiNamespaceGoals.createDiscussion(input),
    useCreateDiscussion: () =>
      useMutation<GoalsCreateDiscussionInput, GoalsCreateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createDiscussion(input),
      ),
    createDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsCreateDiscussionInput) => defaultApiClient.apiNamespaceGoals.createDiscussion(input),
      }),

    changeParent: (input: GoalsChangeParentInput) => defaultApiClient.apiNamespaceGoals.changeParent(input),
    useChangeParent: () =>
      useMutation<GoalsChangeParentInput, GoalsChangeParentResult>((input) =>
        defaultApiClient.apiNamespaceGoals.changeParent(input),
      ),
    changeParentMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsChangeParentInput) => defaultApiClient.apiNamespaceGoals.changeParent(input),
      }),

    create: (input: GoalsCreateInput) => defaultApiClient.apiNamespaceGoals.create(input),
    useCreate: () =>
      useMutation<GoalsCreateInput, GoalsCreateResult>((input) => defaultApiClient.apiNamespaceGoals.create(input)),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsCreateInput) => defaultApiClient.apiNamespaceGoals.create(input),
      }),

    updateParentGoal: (input: GoalsUpdateParentGoalInput) => defaultApiClient.apiNamespaceGoals.updateParentGoal(input),
    useUpdateParentGoal: () =>
      useMutation<GoalsUpdateParentGoalInput, GoalsUpdateParentGoalResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateParentGoal(input),
      ),
    updateParentGoalMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateParentGoalInput) => defaultApiClient.apiNamespaceGoals.updateParentGoal(input),
      }),

    updateTarget: (input: GoalsUpdateTargetInput) => defaultApiClient.apiNamespaceGoals.updateTarget(input),
    useUpdateTarget: () =>
      useMutation<GoalsUpdateTargetInput, GoalsUpdateTargetResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateTarget(input),
      ),
    updateTargetMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateTargetInput) => defaultApiClient.apiNamespaceGoals.updateTarget(input),
      }),

    close: (input: GoalsCloseInput) => defaultApiClient.apiNamespaceGoals.close(input),
    useClose: () =>
      useMutation<GoalsCloseInput, GoalsCloseResult>((input) => defaultApiClient.apiNamespaceGoals.close(input)),
    closeMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsCloseInput) => defaultApiClient.apiNamespaceGoals.close(input),
      }),

    createTarget: (input: GoalsCreateTargetInput) => defaultApiClient.apiNamespaceGoals.createTarget(input),
    useCreateTarget: () =>
      useMutation<GoalsCreateTargetInput, GoalsCreateTargetResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createTarget(input),
      ),
    createTargetMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsCreateTargetInput) => defaultApiClient.apiNamespaceGoals.createTarget(input),
      }),

    deleteTarget: (input: GoalsDeleteTargetInput) => defaultApiClient.apiNamespaceGoals.deleteTarget(input),
    useDeleteTarget: () =>
      useMutation<GoalsDeleteTargetInput, GoalsDeleteTargetResult>((input) =>
        defaultApiClient.apiNamespaceGoals.deleteTarget(input),
      ),
    deleteTargetMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsDeleteTargetInput) => defaultApiClient.apiNamespaceGoals.deleteTarget(input),
      }),

    updateCheckIndex: (input: GoalsUpdateCheckIndexInput) => defaultApiClient.apiNamespaceGoals.updateCheckIndex(input),
    useUpdateCheckIndex: () =>
      useMutation<GoalsUpdateCheckIndexInput, GoalsUpdateCheckIndexResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateCheckIndex(input),
      ),
    updateCheckIndexMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateCheckIndexInput) => defaultApiClient.apiNamespaceGoals.updateCheckIndex(input),
      }),

    updateDueDate: (input: GoalsUpdateDueDateInput) => defaultApiClient.apiNamespaceGoals.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<GoalsUpdateDueDateInput, GoalsUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateDueDate(input),
      ),
    updateDueDateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateDueDateInput) => defaultApiClient.apiNamespaceGoals.updateDueDate(input),
      }),

    createAccessMembers: (input: GoalsCreateAccessMembersInput) =>
      defaultApiClient.apiNamespaceGoals.createAccessMembers(input),
    useCreateAccessMembers: () =>
      useMutation<GoalsCreateAccessMembersInput, GoalsCreateAccessMembersResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createAccessMembers(input),
      ),
    createAccessMembersMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsCreateAccessMembersInput) =>
          defaultApiClient.apiNamespaceGoals.createAccessMembers(input),
      }),

    createCheck: (input: GoalsCreateCheckInput) => defaultApiClient.apiNamespaceGoals.createCheck(input),
    useCreateCheck: () =>
      useMutation<GoalsCreateCheckInput, GoalsCreateCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createCheck(input),
      ),
    createCheckMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsCreateCheckInput) => defaultApiClient.apiNamespaceGoals.createCheck(input),
      }),

    updateCheck: (input: GoalsUpdateCheckInput) => defaultApiClient.apiNamespaceGoals.updateCheck(input),
    useUpdateCheck: () =>
      useMutation<GoalsUpdateCheckInput, GoalsUpdateCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateCheck(input),
      ),
    updateCheckMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateCheckInput) => defaultApiClient.apiNamespaceGoals.updateCheck(input),
      }),

    createCheckIn: (input: GoalsCreateCheckInInput) => defaultApiClient.apiNamespaceGoals.createCheckIn(input),
    useCreateCheckIn: () =>
      useMutation<GoalsCreateCheckInInput, GoalsCreateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createCheckIn(input),
      ),
    createCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsCreateCheckInInput) => defaultApiClient.apiNamespaceGoals.createCheckIn(input),
      }),

    updateStartDate: (input: GoalsUpdateStartDateInput) => defaultApiClient.apiNamespaceGoals.updateStartDate(input),
    useUpdateStartDate: () =>
      useMutation<GoalsUpdateStartDateInput, GoalsUpdateStartDateResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateStartDate(input),
      ),
    updateStartDateMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateStartDateInput) => defaultApiClient.apiNamespaceGoals.updateStartDate(input),
      }),

    updateDescription: (input: GoalsUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceGoals.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<GoalsUpdateDescriptionInput, GoalsUpdateDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateDescription(input),
      ),
    updateDescriptionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateDescriptionInput) => defaultApiClient.apiNamespaceGoals.updateDescription(input),
      }),

    updateSpace: (input: GoalsUpdateSpaceInput) => defaultApiClient.apiNamespaceGoals.updateSpace(input),
    useUpdateSpace: () =>
      useMutation<GoalsUpdateSpaceInput, GoalsUpdateSpaceResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateSpace(input),
      ),
    updateSpaceMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateSpaceInput) => defaultApiClient.apiNamespaceGoals.updateSpace(input),
      }),

    updateCheckIn: (input: GoalsUpdateCheckInInput) => defaultApiClient.apiNamespaceGoals.updateCheckIn(input),
    useUpdateCheckIn: () =>
      useMutation<GoalsUpdateCheckInInput, GoalsUpdateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateCheckIn(input),
      ),
    updateCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateCheckInInput) => defaultApiClient.apiNamespaceGoals.updateCheckIn(input),
      }),

    toggleCheck: (input: GoalsToggleCheckInput) => defaultApiClient.apiNamespaceGoals.toggleCheck(input),
    useToggleCheck: () =>
      useMutation<GoalsToggleCheckInput, GoalsToggleCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.toggleCheck(input),
      ),
    toggleCheckMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsToggleCheckInput) => defaultApiClient.apiNamespaceGoals.toggleCheck(input),
      }),

    delete: (input: GoalsDeleteInput) => defaultApiClient.apiNamespaceGoals.delete(input),
    useDelete: () =>
      useMutation<GoalsDeleteInput, GoalsDeleteResult>((input) => defaultApiClient.apiNamespaceGoals.delete(input)),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsDeleteInput) => defaultApiClient.apiNamespaceGoals.delete(input),
      }),

    updateTargetValue: (input: GoalsUpdateTargetValueInput) =>
      defaultApiClient.apiNamespaceGoals.updateTargetValue(input),
    useUpdateTargetValue: () =>
      useMutation<GoalsUpdateTargetValueInput, GoalsUpdateTargetValueResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateTargetValue(input),
      ),
    updateTargetValueMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateTargetValueInput) => defaultApiClient.apiNamespaceGoals.updateTargetValue(input),
      }),

    deleteCheck: (input: GoalsDeleteCheckInput) => defaultApiClient.apiNamespaceGoals.deleteCheck(input),
    useDeleteCheck: () =>
      useMutation<GoalsDeleteCheckInput, GoalsDeleteCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.deleteCheck(input),
      ),
    deleteCheckMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsDeleteCheckInput) => defaultApiClient.apiNamespaceGoals.deleteCheck(input),
      }),

    updateDiscussion: (input: GoalsUpdateDiscussionInput) => defaultApiClient.apiNamespaceGoals.updateDiscussion(input),
    useUpdateDiscussion: () =>
      useMutation<GoalsUpdateDiscussionInput, GoalsUpdateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateDiscussion(input),
      ),
    updateDiscussionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateDiscussionInput) => defaultApiClient.apiNamespaceGoals.updateDiscussion(input),
      }),

    updateChampion: (input: GoalsUpdateChampionInput) => defaultApiClient.apiNamespaceGoals.updateChampion(input),
    useUpdateChampion: () =>
      useMutation<GoalsUpdateChampionInput, GoalsUpdateChampionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateChampion(input),
      ),
    updateChampionMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateChampionInput) => defaultApiClient.apiNamespaceGoals.updateChampion(input),
      }),

    acknowledgeCheckIn: (input: GoalsAcknowledgeCheckInInput) =>
      defaultApiClient.apiNamespaceGoals.acknowledgeCheckIn(input),
    useAcknowledgeCheckIn: () =>
      useMutation<GoalsAcknowledgeCheckInInput, GoalsAcknowledgeCheckInResult>((input) =>
        defaultApiClient.apiNamespaceGoals.acknowledgeCheckIn(input),
      ),
    acknowledgeCheckInMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsAcknowledgeCheckInInput) =>
          defaultApiClient.apiNamespaceGoals.acknowledgeCheckIn(input),
      }),

    deleteAccessMember: (input: GoalsDeleteAccessMemberInput) =>
      defaultApiClient.apiNamespaceGoals.deleteAccessMember(input),
    useDeleteAccessMember: () =>
      useMutation<GoalsDeleteAccessMemberInput, GoalsDeleteAccessMemberResult>((input) =>
        defaultApiClient.apiNamespaceGoals.deleteAccessMember(input),
      ),
    deleteAccessMemberMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsDeleteAccessMemberInput) =>
          defaultApiClient.apiNamespaceGoals.deleteAccessMember(input),
      }),

    reopen: (input: GoalsReopenInput) => defaultApiClient.apiNamespaceGoals.reopen(input),
    useReopen: () =>
      useMutation<GoalsReopenInput, GoalsReopenResult>((input) => defaultApiClient.apiNamespaceGoals.reopen(input)),
    reopenMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsReopenInput) => defaultApiClient.apiNamespaceGoals.reopen(input),
      }),

    updateReviewer: (input: GoalsUpdateReviewerInput) => defaultApiClient.apiNamespaceGoals.updateReviewer(input),
    useUpdateReviewer: () =>
      useMutation<GoalsUpdateReviewerInput, GoalsUpdateReviewerResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateReviewer(input),
      ),
    updateReviewerMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: GoalsUpdateReviewerInput) => defaultApiClient.apiNamespaceGoals.updateReviewer(input),
      }),
  },

  reactions: {
    delete: (input: ReactionsDeleteInput) => defaultApiClient.apiNamespaceReactions.delete(input),
    useDelete: () =>
      useMutation<ReactionsDeleteInput, ReactionsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceReactions.delete(input),
      ),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ReactionsDeleteInput) => defaultApiClient.apiNamespaceReactions.delete(input),
      }),

    create: (input: ReactionsCreateInput) => defaultApiClient.apiNamespaceReactions.create(input),
    useCreate: () =>
      useMutation<ReactionsCreateInput, ReactionsCreateResult>((input) =>
        defaultApiClient.apiNamespaceReactions.create(input),
      ),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: (input: ReactionsCreateInput) => defaultApiClient.apiNamespaceReactions.create(input),
      }),
  },
};
