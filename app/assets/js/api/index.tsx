import React from "react";
import axios from "axios";

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
        newKey = origKey.replace(/_([a-z])/g, function (_a: string, b: string) {
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
        newKey = origKey.replace(/([A-Z])/g, function (a: string) {
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
  public?: number | null;
  company?: number | null;
  space?: number | null;
}

export interface Account {
  fullName?: string | null;
  siteAdmin?: boolean | null;
}

export interface Activity {
  id?: string | null;
  scopeType?: string | null;
  scopeId?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  action?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  commentThread?: CommentThread | null;
  author?: Person | null;
  resource?: ActivityResourceUnion | null;
  person?: Person | null;
  eventData?: ActivityDataUnion | null;
  content?: ActivityContent | null;
  notifications?: Notification[] | null;
  permissions?: ActivityPermissions | null;
}

export interface ActivityContentCommentAdded {
  comment?: Comment | null;
  activity?: Activity | null;
}

export interface ActivityContentCompanyAdding {
  company?: Company | null;
  creator?: Person | null;
}

export interface ActivityContentCompanyAdminAdded {
  company?: Company | null;
  people?: Person[] | null;
}

export interface ActivityContentCompanyAdminRemoved {
  company?: Company | null;
  person?: Person | null;
}

export interface ActivityContentCompanyEditing {
  companyId?: string | null;
  company?: Company | null;
  newName?: string | null;
  oldName?: string | null;
}

export interface ActivityContentCompanyMemberRestoring {
  person?: Person | null;
}

export interface ActivityContentCompanyOwnerRemoving {
  companyId?: string | null;
  personId?: string | null;
  person?: Person | null;
}

export interface ActivityContentCompanyOwnersAdding {
  company?: Company | null;
  people?: ActivityContentCompanyOwnersAddingPerson[] | null;
}

export interface ActivityContentCompanyOwnersAddingPerson {
  person?: Person | null;
}

export interface ActivityContentDiscussionCommentSubmitted {
  spaceId?: string | null;
  discussionId?: string | null;
  discussion?: Discussion | null;
  comment?: Comment | null;
  space?: Space | null;
  title?: string | null;
}

export interface ActivityContentDiscussionEditing {
  companyId?: string | null;
  spaceId?: string | null;
  discussionId?: string | null;
}

export interface ActivityContentDiscussionPosting {
  companyId?: string | null;
  spaceId?: string | null;
  title?: string | null;
  discussionId?: string | null;
  space?: Space | null;
  discussion?: Discussion | null;
}

export interface ActivityContentGoalArchived {
  goal?: Goal | null;
}

export interface ActivityContentGoalCheckIn {
  goalId?: string | null;
  goal?: Goal | null;
  update?: GoalProgressUpdate | null;
  oldTimeframe?: Timeframe | null;
  newTimeframe?: Timeframe | null;
}

export interface ActivityContentGoalCheckInAcknowledgement {
  goal?: Goal | null;
  update?: GoalProgressUpdate | null;
}

export interface ActivityContentGoalCheckInCommented {
  goalId?: string | null;
  goal?: Goal | null;
  update?: GoalProgressUpdate | null;
  comment?: Comment | null;
}

export interface ActivityContentGoalCheckInEdit {
  companyId?: string | null;
  goalId?: string | null;
  checkInId?: string | null;
}

export interface ActivityContentGoalClosing {
  companyId?: string | null;
  spaceId?: string | null;
  goalId?: string | null;
  success?: string | null;
  goal?: Goal | null;
}

export interface ActivityContentGoalCreated {
  goal?: Goal | null;
}

export interface ActivityContentGoalDiscussionCreation {
  companyId?: string | null;
  goalId?: string | null;
  goal?: Goal | null;
}

export interface ActivityContentGoalDiscussionEditing {
  companyId?: string | null;
  spaceId?: string | null;
  goalId?: string | null;
  activityId?: string | null;
}

export interface ActivityContentGoalEditing {
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

export interface ActivityContentGoalReopening {
  companyId?: string | null;
  goalId?: string | null;
  message?: string | null;
  goal?: Goal | null;
}

export interface ActivityContentGoalReparent {
  goal?: Goal | null;
  oldParentGoal?: Goal | null;
  newParentGoal?: Goal | null;
}

export interface ActivityContentGoalTimeframeEditing {
  goal?: Goal | null;
  oldTimeframe?: Timeframe | null;
  newTimeframe?: Timeframe | null;
}

export interface ActivityContentGroupEdited {
  exampleField?: string | null;
}

export interface ActivityContentMessageArchiving {
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
  messageId?: string | null;
  title?: string | null;
}

export interface ActivityContentProjectArchived {
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectCheckInAcknowledged {
  projectId?: string | null;
  checkInId?: string | null;
  project?: Project | null;
  checkIn?: ProjectCheckIn | null;
}

export interface ActivityContentProjectCheckInCommented {
  projectId?: string | null;
  checkInId?: string | null;
  project?: Project | null;
  checkIn?: ProjectCheckIn | null;
  comment?: Comment | null;
}

export interface ActivityContentProjectCheckInEdit {
  companyId?: string | null;
  projectId?: string | null;
  checkInId?: string | null;
}

export interface ActivityContentProjectCheckInSubmitted {
  projectId?: string | null;
  checkInId?: string | null;
  project?: Project | null;
  checkIn?: ProjectCheckIn | null;
}

export interface ActivityContentProjectClosed {
  project?: Project | null;
}

export interface ActivityContentProjectContributorAddition {
  companyId?: string | null;
  projectId?: string | null;
  personId?: string | null;
  person?: Person | null;
  project?: Project | null;
}

export interface ActivityContentProjectContributorEdited {
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
  companyId?: string | null;
  projectId?: string | null;
  personId?: string | null;
  person?: Person | null;
  project?: Project | null;
}

export interface ActivityContentProjectContributorsAddition {
  project?: Project | null;
  contributors?: ProjectContributorsAdditionContributor[] | null;
}

export interface ActivityContentProjectCreated {
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectDiscussionSubmitted {
  projectId?: string | null;
  discussionId?: string | null;
  title?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectGoalConnection {
  project?: Project | null;
  goal?: Goal | null;
}

export interface ActivityContentProjectGoalDisconnection {
  project?: Project | null;
  goal?: Goal | null;
}

export interface ActivityContentProjectKeyResourceAdded {
  projectId?: string | null;
  project?: Project | null;
  title?: string | null;
}

export interface ActivityContentProjectKeyResourceDeleted {
  projectId?: string | null;
  project?: Project | null;
  title?: string | null;
}

export interface ActivityContentProjectMilestoneCommented {
  projectId?: string | null;
  project?: Project | null;
  milestone?: Milestone | null;
  commentAction?: string | null;
  comment?: Comment | null;
}

export interface ActivityContentProjectMoved {
  project?: Project | null;
  oldSpace?: Space | null;
  newSpace?: Space | null;
}

export interface ActivityContentProjectPausing {
  companyId?: string | null;
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectRenamed {
  project?: Project | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface ActivityContentProjectResuming {
  companyId?: string | null;
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectRetrospectiveCommented {
  projectId?: string | null;
  project?: Project | null;
  comment?: Comment | null;
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

export interface ActivityContentProjectTimelineEdited {
  project?: Project | null;
  oldStartDate?: string | null;
  newStartDate?: string | null;
  oldEndDate?: string | null;
  newEndDate?: string | null;
  newMilestones?: Milestone[] | null;
  updatedMilestones?: Milestone[] | null;
}

export interface ActivityContentResourceHubDocumentCommented {
  space?: Space | null;
  document?: ResourceHubDocument | null;
  comment?: Comment | null;
}

export interface ActivityContentResourceHubDocumentCreated {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
  copiedDocument?: ResourceHubDocument | null;
}

export interface ActivityContentResourceHubDocumentDeleted {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
}

export interface ActivityContentResourceHubDocumentEdited {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  document?: ResourceHubDocument | null;
}

export interface ActivityContentResourceHubFileCommented {
  space?: Space | null;
  file?: ResourceHubFile | null;
  comment?: Comment | null;
}

export interface ActivityContentResourceHubFileCreated {
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  files?: ResourceHubFile[] | null;
}

export interface ActivityContentResourceHubFileDeleted {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  file?: ResourceHubFile | null;
}

export interface ActivityContentResourceHubFileEdited {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  file?: ResourceHubFile | null;
}

export interface ActivityContentResourceHubFolderCopied {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
  originalFolder?: ResourceHubFolder | null;
}

export interface ActivityContentResourceHubFolderCreated {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
}

export interface ActivityContentResourceHubFolderDeleted {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
}

export interface ActivityContentResourceHubFolderRenamed {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface ActivityContentResourceHubLinkCommented {
  space?: Space | null;
  link?: ResourceHubLink | null;
  comment?: Comment | null;
}

export interface ActivityContentResourceHubLinkCreated {
  space?: Space | null;
  resourceHub?: ResourceHub | null;
  link?: ResourceHubLink | null;
}

export interface ActivityContentResourceHubLinkDeleted {
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  link?: ResourceHubLink | null;
}

export interface ActivityContentResourceHubLinkEdited {
  resourceHub?: ResourceHub | null;
  space?: Space | null;
  link?: ResourceHubLink | null;
  previousName?: string | null;
  previousType?: string | null;
  previousUrl?: string | null;
}

export interface ActivityContentSpaceAdded {
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
}

export interface ActivityContentSpaceJoining {
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
}

export interface ActivityContentSpaceMemberRemoved {
  space?: Space | null;
  member?: Person | null;
}

export interface ActivityContentSpaceMembersAdded {
  space?: Space | null;
  members?: Person[] | null;
}

export interface ActivityContentTaskAdding {
  name?: string | null;
  taskId?: string | null;
  companyId?: string | null;
  spaceId?: string | null;
}

export interface ActivityContentTaskAssigneeAssignment {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  personId?: string | null;
}

export interface ActivityContentTaskClosing {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
}

export interface ActivityContentTaskDescriptionChange {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
}

export interface ActivityContentTaskNameEditing {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface ActivityContentTaskPriorityChange {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  oldPriority?: string | null;
  newPriority?: string | null;
}

export interface ActivityContentTaskReopening {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
}

export interface ActivityContentTaskSizeChange {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  oldSize?: string | null;
  newSize?: string | null;
}

export interface ActivityContentTaskStatusChange {
  companyId?: string | null;
  taskId?: string | null;
  status?: string | null;
}

export interface ActivityContentTaskUpdate {
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

export interface ActivityPermissions {
  canCommentOnThread?: boolean | null;
  canView?: boolean | null;
}

export interface AddMemberInput {
  id?: Id | null;
  accessLevel?: number | null;
}

export interface Assignment {
  type?: string | null;
  due?: string | null;
  resource?: AssignmentResource | null;
}

export interface Assignments {
  assignments?: Assignment[] | null;
}

export interface Blob {
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
  id?: string | null;
  insertedAt?: string | null;
  content?: string | null;
  author?: Person | null;
  reactions?: Reaction[] | null;
  notification?: Notification | null;
}

export interface CommentThread {
  id?: string | null;
  insertedAt?: string | null;
  title?: string | null;
  message?: string | null;
  reactions?: Reaction[] | null;
  comments?: Comment[] | null;
  commentsCount?: number | null;
  author?: Person | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
}

export interface Company {
  id?: string | null;
  name?: string | null;
  mission?: string | null;
  trustedEmailDomains?: string[] | null;
  enabledExperimentalFeatures?: string[] | null;
  companySpaceId?: string | null;
  admins?: Person[] | null;
  owners?: Person[] | null;
  people?: Person[] | null;
  memberCount?: number | null;
  permissions?: CompanyPermissions | null;
}

export interface CompanyPermissions {
  canEditTrustedEmailDomains?: boolean | null;
  canInviteMembers?: boolean | null;
  canRemoveMembers?: boolean | null;
  canCreateSpace?: boolean | null;
  canManageAdmins?: boolean | null;
  canManageOwners?: boolean | null;
}

export interface CreateTargetInput {
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  index?: number | null;
}

export interface Discussion {
  id?: string | null;
  name?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  state?: string | null;
  author?: Person | null;
  title?: string | null;
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

export interface EditMemberPermissionsInput {
  id?: Id | null;
  accessLevel?: number | null;
}

export interface EditProjectTimelineMilestoneUpdateInput {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  dueTime?: string | null;
}

export interface EditProjectTimelineNewMilestoneInput {
  title?: string | null;
  description?: string | null;
  dueTime?: string | null;
}

export interface Goal {
  id: string;
  name: string;
  insertedAt?: string | null;
  updatedAt?: string | null;
  nextUpdateScheduledAt?: string | null;
  parentGoalId?: string | null;
  status: GoalStatus;
  closedAt?: string | null;
  timeframe?: Timeframe | null;
  description?: string | null;
  champion?: Person | null;
  reviewer?: Person | null;
  closedBy?: Person | null;
  targets?: Target[] | null;
  projects?: Project[] | null;
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
}

export interface GoalEditingUpdatedTarget {
  id?: string | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface GoalPermissions {
  canEdit?: boolean | null;
  canCheckIn?: boolean | null;
  canClose?: boolean | null;
  canArchive?: boolean | null;
  canDelete?: boolean | null;
}

export interface GoalProgressUpdate {
  id?: string | null;
  status?: string | null;
  message?: string | null;
  insertedAt?: string | null;
  author?: Person | null;
  acknowledged?: boolean | null;
  acknowledgedAt?: string | null;
  acknowledgingPerson?: Person | null;
  reactions?: Reaction[] | null;
  goalTargetUpdates?: GoalTargetUpdates[] | null;
  commentsCount?: number | null;
  goal?: Goal | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
  timeframe?: Timeframe | null;
  permissions?: GoalUpdatePermissions | null;
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
  canView?: boolean | null;
  canEdit?: boolean | null;
  canDelete?: boolean | null;
  canAcknowledge?: boolean | null;
  canComment?: boolean | null;
}

export interface Invitation {
  id?: string | null;
  admin?: Person | null;
  member?: Person | null;
  company?: Company | null;
  token?: string | null;
  expiresAt?: string | null;
}

export interface MessagesBoard {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  messages?: Discussion[] | null;
  space?: Space | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface Milestone {
  id?: string | null;
  project?: Project | null;
  title?: string | null;
  status?: string | null;
  insertedAt?: string | null;
  deadlineAt?: string | null;
  completedAt?: string | null;
  description?: string | null;
  comments?: MilestoneComment[] | null;
  tasksKanbanState?: string | null;
  permissions?: ProjectPermissions | null;
}

export interface MilestoneComment {
  id?: string | null;
  action?: string | null;
  comment?: Comment | null;
}

export interface Notification {
  id?: string | null;
  read?: boolean | null;
  readAt?: string | null;
  activity?: Activity | null;
}

export interface Panel {
  id?: string | null;
  type?: string | null;
  index?: number | null;
  linkedResource?: PanelLinkedResource | null;
}

export interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string | null;
  timezone?: string | null;
  email: string;
  sendDailySummary?: boolean | null;
  notifyOnMention?: boolean | null;
  notifyAboutAssignments?: boolean | null;
  suspended?: boolean | null;
  company?: Company | null;
  manager?: Person | null;
  reports?: Person[] | null;
  peers?: Person[] | null;
  theme?: string | null;
  accessLevel?: number | null;
  hasOpenInvitation?: boolean | null;
  invitation?: Invitation | null;
  showDevBar?: boolean | null;
}

export interface Project {
  id?: string | null;
  name?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  startedAt?: string | null;
  deadline?: string | null;
  nextUpdateScheduledAt?: string | null;
  nextCheckInScheduledAt?: string | null;
  privacy?: string | null;
  status?: string | null;
  closedAt?: string | null;
  retrospective?: ProjectRetrospective | null;
  description?: string | null;
  goalId?: string | null;
  goal?: Goal | null;
  lastCheckIn?: ProjectCheckIn | null;
  milestones?: Milestone[] | null;
  contributors?: ProjectContributor[] | null;
  keyResources?: ProjectKeyResource[] | null;
  isOutdated?: boolean | null;
  spaceId?: string | null;
  space?: Space | null;
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
}

export interface ProjectCheckIn {
  id?: string | null;
  status?: string | null;
  insertedAt?: string | null;
  description?: string | null;
  author?: Person | null;
  project?: Project | null;
  acknowledgedAt?: string | null;
  acknowledgedBy?: Person | null;
  reactions?: Reaction[] | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
}

export interface ProjectContributor {
  id?: string | null;
  responsibility?: string | null;
  role?: string | null;
  person?: Person | null;
  accessLevel?: number | null;
  project?: Project | null;
}

export interface ProjectContributorInput {
  personId?: string | null;
  responsibility?: string | null;
  accessLevel?: number | null;
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
  id?: string | null;
  projectId?: string | null;
  title?: string | null;
  link?: string | null;
  resourceType?: string | null;
}

export interface ProjectPermissions {
  canView?: boolean | null;
  canCreateMilestone?: boolean | null;
  canDeleteMilestone?: boolean | null;
  canEditContributors?: boolean | null;
  canEditMilestone?: boolean | null;
  canEditDescription?: boolean | null;
  canEditTimeline?: boolean | null;
  canEditResources?: boolean | null;
  canEditGoal?: boolean | null;
  canEditName?: boolean | null;
  canEditSpace?: boolean | null;
  canEditRetrospective?: boolean | null;
  canEditPermissions?: boolean | null;
  canClose?: boolean | null;
  canPause?: boolean | null;
  canCheckIn?: boolean | null;
  canAcknowledgeCheckIn?: boolean | null;
  canCommentOnCheckIn?: boolean | null;
  canCommentOnRetrospective?: boolean | null;
  canCommentOnMilestone?: boolean | null;
}

export interface ProjectRetrospective {
  id?: string | null;
  author?: Person | null;
  project?: Project | null;
  content?: string | null;
  closedAt?: string | null;
  permissions?: ProjectPermissions | null;
  reactions?: Reaction[] | null;
  subscriptionList?: SubscriptionList | null;
  potentialSubscribers?: Subscriber[] | null;
  notifications?: Notification[] | null;
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

export interface Reaction {
  id?: string | null;
  emoji?: string | null;
  reactionType?: string | null;
  person?: Person | null;
}

export interface ResourceHub {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  space?: Space | null;
  nodes?: ResourceHubNode[] | null;
  potentialSubscribers?: Subscriber[] | null;
  permissions?: ResourceHubPermissions | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface ResourceHubDocument {
  id?: string | null;
  author?: Person | null;
  resourceHubId?: string | null;
  resourceHub?: ResourceHub | null;
  parentFolder?: ResourceHubFolder | null;
  parentFolderId?: string | null;
  name?: string | null;
  content?: string | null;
  state?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  permissions?: ResourceHubPermissions | null;
  reactions?: Reaction[] | null;
  commentsCount?: number | null;
  potentialSubscribers?: Subscriber[] | null;
  subscriptionList?: SubscriptionList | null;
  notifications?: Notification[] | null;
  pathToDocument?: ResourceHubFolder[] | null;
}

export interface ResourceHubFile {
  id?: string | null;
  author?: Person | null;
  resourceHubId?: string | null;
  resourceHub?: ResourceHub | null;
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
  type?: string | null;
  size?: number | null;
  blob?: Blob | null;
  pathToFile?: ResourceHubFolder[] | null;
}

export interface ResourceHubFolder {
  id?: string | null;
  resourceHubId?: string | null;
  resourceHub?: ResourceHub | null;
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
  id?: string | null;
  author?: Person | null;
  resourceHubId?: string | null;
  resourceHub?: ResourceHub | null;
  parentFolder?: ResourceHubFolder | null;
  parentFolderId?: string | null;
  name?: string | null;
  url?: string | null;
  description?: string | null;
  type?: string | null;
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
  id?: string | null;
  name?: string | null;
  type?: string | null;
  folder?: ResourceHubFolder | null;
  document?: ResourceHubDocument | null;
  file?: ResourceHubFile | null;
  link?: ResourceHubLink | null;
}

export interface ResourceHubPermissions {
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
  resourceId?: string | null;
  name?: string | null;
  due?: string | null;
  type?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  path?: string | null;
}

export interface Space {
  id: string;
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
}

export interface SpacePermissions {
  canCreateGoal?: boolean | null;
  canCreateProject?: boolean | null;
  canCommentOnDiscussions?: boolean | null;
  canEdit?: boolean | null;
  canEditDiscussions?: boolean | null;
  canEditMembersPermissions?: boolean | null;
  canEditPermissions?: boolean | null;
  canJoin?: boolean | null;
  canPostDiscussions?: boolean | null;
  canRemoveMember?: boolean | null;
  canView?: boolean | null;
  canViewMessage?: boolean | null;
  canAddMembers?: boolean | null;
}

export interface SpaceTools {
  projects?: Project[] | null;
  goals?: Goal[] | null;
  messagesBoards?: MessagesBoard[] | null;
  resourceHubs?: ResourceHub[] | null;
}

export interface Subscriber {
  role?: string | null;
  priority?: boolean | null;
  isSubscribed?: boolean | null;
  person?: Person | null;
}

export interface Subscription {
  id?: string | null;
  type?: string | null;
  person?: Person | null;
}

export interface SubscriptionList {
  id?: string | null;
  parentType?: string | null;
  sendToEveryone?: boolean | null;
  subscriptions?: Subscription[] | null;
}

export interface Target {
  id?: string | null;
  index?: number | null;
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  value?: number | null;
}

export interface Task {
  id?: string | null;
  name?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
  dueDate?: string | null;
  size?: string | null;
  priority?: string | null;
  status?: string | null;
  milestone?: Milestone | null;
  project?: Project | null;
  description?: string | null;
  assignees?: Person[] | null;
  creator?: Person | null;
}

export interface Timeframe {
  startDate?: string | null;
  endDate?: string | null;
  type?: string | null;
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

export interface UpdateTargetInput {
  id?: string | null;
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  index?: number | null;
}

export interface WorkMapItem {
  id: string;
  parentId: string | null;
  name: string;
  state: WorkMapItemState;
  status: WorkMapItemStatus;
  progress: number;
  space: Space;
  spacePath: string;
  owner: Person | null;
  ownerPath: string | null;
  nextStep: string;
  isNew: boolean;
  completedOn: string | null;
  timeframe: Timeframe | null;
  children: WorkMapItem[];
  type: WorkMapItemType;
  itemPath: string;
  privacy: WorkMapItemPrivacy;
  assignees?: Person[] | null;
}

export type ActivityContent =
  | ActivityContentCompanyOwnersAdding
  | ActivityContentCompanyAdminAdded
  | ActivityContentCompanyEditing
  | ActivityContentCommentAdded
  | ActivityContentDiscussionCommentSubmitted
  | ActivityContentDiscussionEditing
  | ActivityContentDiscussionPosting
  | ActivityContentGoalArchived
  | ActivityContentGoalCheckIn
  | ActivityContentGoalCheckInAcknowledgement
  | ActivityContentGoalCheckInEdit
  | ActivityContentGoalClosing
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
  | ActivityContentProjectContributorAddition
  | ActivityContentProjectContributorsAddition
  | ActivityContentProjectContributorEdited
  | ActivityContentProjectContributorRemoved
  | ActivityContentProjectCreated
  | ActivityContentProjectDiscussionSubmitted
  | ActivityContentProjectGoalConnection
  | ActivityContentProjectGoalDisconnection
  | ActivityContentProjectMilestoneCommented
  | ActivityContentProjectMoved
  | ActivityContentProjectPausing
  | ActivityContentProjectRenamed
  | ActivityContentProjectResuming
  | ActivityContentProjectReviewAcknowledged
  | ActivityContentProjectReviewCommented
  | ActivityContentProjectReviewRequestSubmitted
  | ActivityContentProjectReviewSubmitted
  | ActivityContentProjectTimelineEdited
  | ActivityContentSpaceJoining
  | ActivityContentTaskAdding
  | ActivityContentTaskAssigneeAssignment
  | ActivityContentTaskClosing
  | ActivityContentTaskDescriptionChange
  | ActivityContentTaskNameEditing
  | ActivityContentTaskPriorityChange
  | ActivityContentTaskReopening
  | ActivityContentTaskSizeChange
  | ActivityContentTaskStatusChange
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

export type GoalPrivacyValues = "public" | "internal" | "confidential" | "secret";

export type GoalStatus =
  | "on_track"
  | "completed"
  | "achieved"
  | "partial"
  | "missed"
  | "paused"
  | "caution"
  | "issue"
  | "dropped"
  | "pending"
  | "outdated";

export type WorkMapItemPrivacy = "public" | "internal" | "confidential" | "secret";

export type WorkMapItemState = "active" | "paused" | "closed";

export type WorkMapItemStatus =
  | "on_track"
  | "completed"
  | "achieved"
  | "partial"
  | "missed"
  | "paused"
  | "caution"
  | "issue"
  | "dropped"
  | "pending"
  | "outdated";

export type WorkMapItemType = "project" | "goal";

export interface GetAccountInput {}

export interface GetAccountResult {
  account?: Account | null;
}

export interface GetActivitiesInput {
  scopeId?: string | null;
  scopeType?: string | null;
  actions?: string[] | null;
}

export interface GetActivitiesResult {
  activities?: Activity[] | null;
}

export interface GetActivityInput {
  id?: string | null;
  includeUnreadGoalNotifications?: boolean | null;
  includePermissions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
}

export interface GetActivityResult {
  activity?: Activity | null;
}

export interface GetAssignmentsInput {}

export interface GetAssignmentsResult {
  assignments?: ReviewAssignment[] | null;
}

export interface GetAssignmentsCountInput {}

export interface GetAssignmentsCountResult {
  count?: number | null;
}

export interface GetBindedPeopleInput {
  resourseType?: string | null;
  resourseId?: string | null;
}

export interface GetBindedPeopleResult {
  people?: Person[] | null;
}

export interface GetCommentsInput {
  entityId?: string | null;
  entityType?: string | null;
}

export interface GetCommentsResult {
  comments?: Comment[] | null;
}

export interface GetCompaniesInput {
  includeMemberCount?: boolean | null;
}

export interface GetCompaniesResult {
  companies?: Company[] | null;
}

export interface GetCompanyInput {
  id?: CompanyId | null;
  includePermissions?: boolean | null;
  includePeople?: boolean | null;
  includeAdmins?: boolean | null;
  includeOwners?: boolean | null;
}

export interface GetCompanyResult {
  company?: Company | null;
}

export interface GetDiscussionInput {
  id?: string | null;
  includeAuthor?: boolean | null;
  includeReactions?: boolean | null;
  includeSpace?: boolean | null;
  includeSpaceMembers?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includePermissions?: boolean | null;
}

export interface GetDiscussionResult {
  discussion?: Discussion | null;
}

export interface GetDiscussionsInput {
  spaceId?: Id | null;
  includeAuthor?: boolean | null;
  includeCommentsCount?: boolean | null;
  includeMyDrafts?: boolean | null;
}

export interface GetDiscussionsResult {
  discussions?: Discussion[] | null;
  myDrafts?: Discussion[] | null;
}

export interface GetGoalInput {
  id?: Id | null;
  includeChampion?: boolean | null;
  includeClosedBy?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includePermissions?: boolean | null;
  includeProjects?: boolean | null;
  includeReviewer?: boolean | null;
  includeSpace?: boolean | null;
  includeSpaceMembers?: boolean | null;
  includeAccessLevels?: boolean | null;
  includePrivacy?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
}

export interface GetGoalResult {
  goal?: Goal | null;
}

export interface GetGoalProgressUpdateInput {
  id?: string | null;
  includeAuthor?: boolean | null;
  includeAcknowledgedBy?: boolean | null;
  includeReactions?: boolean | null;
  includeGoal?: boolean | null;
  includeGoalSpace?: boolean | null;
  includeGoalTargets?: boolean | null;
  includeReviewer?: boolean | null;
  includeChampion?: boolean | null;
  includeSpaceMembers?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includePermissions?: boolean | null;
}

export interface GetGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface GetGoalProgressUpdatesInput {
  goalId?: string | null;
}

export interface GetGoalProgressUpdatesResult {
  updates?: GoalProgressUpdate | null;
}

export interface GetGoalsInput {
  spaceId?: string | null;
  includeProjects?: boolean | null;
  includeSpace?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeChampion?: boolean | null;
  includeReviewer?: boolean | null;
}

export interface GetGoalsResult {
  goals?: Goal[] | null;
}

export interface GetInvitationInput {
  token?: string | null;
}

export interface GetInvitationResult {
  invitation?: Invitation | null;
}

export interface GetKeyResourceInput {
  id?: string | null;
}

export interface GetKeyResourceResult {
  keyResource?: ProjectKeyResource | null;
}

export interface GetMeInput {
  includeManager?: boolean | null;
}

export interface GetMeResult {
  me?: Person | null;
}

export interface GetMilestoneInput {
  id?: string | null;
  includeComments?: boolean | null;
  includeProject?: boolean | null;
  includePermissions?: boolean | null;
}

export interface GetMilestoneResult {
  milestone?: Milestone | null;
}

export interface GetNotificationsInput {
  page?: number | null;
  perPage?: number | null;
}

export interface GetNotificationsResult {
  notifications?: Notification[] | null;
}

export interface GetPeopleInput {
  onlySuspended?: boolean | null;
  includeSuspended?: boolean | null;
  includeManager?: boolean | null;
  includeInvitations?: boolean | null;
}

export interface GetPeopleResult {
  people?: Person[] | null;
}

export interface GetPersonInput {
  id?: string | null;
  includeManager?: boolean | null;
  includeReports?: boolean | null;
  includePeers?: boolean | null;
}

export interface GetPersonResult {
  person?: Person | null;
}

export interface GetProjectInput {
  id?: string | null;
  includeContributors?: boolean | null;
  includeGoal?: boolean | null;
  includeKeyResources?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeMilestones?: boolean | null;
  includePermissions?: boolean | null;
  includeChampion?: boolean | null;
  includeReviewer?: boolean | null;
  includeSpace?: boolean | null;
  includeContributorsAccessLevels?: boolean | null;
  includeAccessLevels?: boolean | null;
  includePrivacy?: boolean | null;
  includeRetrospective?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
}

export interface GetProjectResult {
  project?: Project | null;
}

export interface GetProjectCheckInInput {
  id?: string | null;
  includeAuthor?: boolean | null;
  includeAcknowledgedBy?: boolean | null;
  includeProject?: boolean | null;
  includeReactions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
}

export interface GetProjectCheckInResult {
  projectCheckIn?: ProjectCheckIn | null;
}

export interface GetProjectCheckInsInput {
  projectId?: string | null;
  includeAuthor?: boolean | null;
  includeProject?: boolean | null;
  includeReactions?: boolean | null;
}

export interface GetProjectCheckInsResult {
  projectCheckIns?: ProjectCheckIn[] | null;
}

export interface GetProjectContributorInput {
  id?: string | null;
  includeProject?: boolean | null;
}

export interface GetProjectContributorResult {
  contributor?: ProjectContributor | null;
}

export interface GetProjectRetrospectiveInput {
  projectId?: string | null;
  includeAuthor?: boolean | null;
  includeProject?: boolean | null;
  includeClosedAt?: boolean | null;
  includePermissions?: boolean | null;
  includeReactions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
}

export interface GetProjectRetrospectiveResult {
  retrospective?: ProjectRetrospective | null;
}

export interface GetProjectsInput {
  onlyMyProjects?: boolean | null;
  onlyReviewedByMe?: boolean | null;
  spaceId?: string | null;
  goalId?: string | null;
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

export interface GetProjectsResult {
  projects?: Project[] | null;
}

export interface GetResourceHubInput {
  id?: Id | null;
  includeSpace?: boolean | null;
  includeNodes?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includePermissions?: boolean | null;
}

export interface GetResourceHubResult {
  resourceHub?: ResourceHub | null;
}

export interface GetResourceHubDocumentInput {
  id?: Id | null;
  includeAuthor?: boolean | null;
  includeSpace?: boolean | null;
  includeResourceHub?: boolean | null;
  includeParentFolder?: boolean | null;
  includeReactions?: boolean | null;
  includePermissions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includePathToDocument?: boolean | null;
}

export interface GetResourceHubDocumentResult {
  document?: ResourceHubDocument | null;
}

export interface GetResourceHubFileInput {
  id?: Id | null;
  includeAuthor?: boolean | null;
  includeResourceHub?: boolean | null;
  includeSpace?: boolean | null;
  includeParentFolder?: boolean | null;
  includeReactions?: boolean | null;
  includePermissions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includePathToFile?: boolean | null;
}

export interface GetResourceHubFileResult {
  file?: ResourceHubFile | null;
}

export interface GetResourceHubFolderInput {
  id?: Id | null;
  includeNodes?: boolean | null;
  includeResourceHub?: boolean | null;
  includePathToFolder?: boolean | null;
  includePermissions?: boolean | null;
  includePotentialSubscribers?: boolean | null;
}

export interface GetResourceHubFolderResult {
  folder?: ResourceHubFolder | null;
}

export interface GetResourceHubLinkInput {
  id?: Id | null;
  includeAuthor?: boolean | null;
  includeSpace?: boolean | null;
  includeResourceHub?: boolean | null;
  includeParentFolder?: boolean | null;
  includeReactions?: boolean | null;
  includePermissions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
  includePathToLink?: boolean | null;
}

export interface GetResourceHubLinkResult {
  link?: ResourceHubLink | null;
}

export interface GetSpaceInput {
  id?: Id | null;
  includePermissions?: boolean | null;
  includeMembers?: boolean | null;
  includeAccessLevels?: boolean | null;
  includeMembersAccessLevels?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
}

export interface GetSpaceResult {
  space?: Space | null;
}

export interface GetSpacesInput {
  includeAccessLevels?: boolean | null;
  includeMembers?: boolean | null;
}

export interface GetSpacesResult {
  spaces?: Space[] | null;
}

export interface GetTaskInput {
  id?: string | null;
  includeAssignees?: boolean | null;
  includeMilestone?: boolean | null;
  includeProject?: boolean | null;
}

export interface GetTaskResult {
  task?: Task | null;
}

export interface GetTasksInput {
  milestoneId?: string | null;
  includeAssignees?: boolean | null;
}

export interface GetTasksResult {
  tasks?: Task[] | null;
}

export interface GetUnreadNotificationCountInput {}

export interface GetUnreadNotificationCountResult {
  unread?: number | null;
}

export interface GetWorkMapInput {
  spaceId?: Id | null;
  parentGoalId?: Id | null;
  ownerId?: Id | null;
  includeAssignees?: boolean | null;
}

export interface GetWorkMapResult {
  workMap?: WorkMapItem[] | null;
}

export interface ListGoalContributorsInput {
  goalId?: Id | null;
}

export interface ListGoalContributorsResult {
  contributors?: Person[] | null;
}

export interface ListResourceHubNodesInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  includeCommentsCount?: boolean | null;
  includeChildrenCount?: boolean | null;
}

export interface ListResourceHubNodesResult {
  nodes?: ResourceHubNode[] | null;
  draftNodes?: ResourceHubNode[] | null;
}

export interface ListSpaceToolsInput {
  spaceId?: Id | null;
}

export interface ListSpaceToolsResult {
  tools?: SpaceTools | null;
}

export interface RunAiPromptInput {
  prompt?: string | null;
}

export interface RunAiPromptResult {
  result?: string | null;
}

export interface SearchPeopleInput {
  query?: string | null;
  ignoredIds?: string[] | null;
  searchScopeType?: string | null;
  searchScopeId?: string | null;
}

export interface SearchPeopleResult {
  people?: Person[] | null;
}

export interface SearchPotentialSpaceMembersInput {
  groupId?: string | null;
  query?: string | null;
  excludeIds?: string[] | null;
  limit?: number | null;
}

export interface SearchPotentialSpaceMembersResult {
  people?: Person[] | null;
}

export interface SearchProjectContributorCandidatesInput {
  projectId?: string | null;
  query?: string | null;
}

export interface SearchProjectContributorCandidatesResult {
  people?: Person[] | null;
}

export interface AcknowledgeGoalProgressUpdateInput {
  id?: string | null;
}

export interface AcknowledgeGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface AcknowledgeProjectCheckInInput {
  id?: string | null;
}

export interface AcknowledgeProjectCheckInResult {
  checkIn?: ProjectCheckIn | null;
}

export interface AddCompanyInput {
  companyName?: string | null;
  title?: string | null;
  isDemo?: boolean | null;
}

export interface AddCompanyResult {
  company?: Company | null;
}

export interface AddCompanyAdminsInput {
  peopleIds?: Id[] | null;
}

export interface AddCompanyAdminsResult {}

export interface AddCompanyMemberInput {
  fullName?: string | null;
  email?: string | null;
  title?: string | null;
}

export interface AddCompanyMemberResult {
  invitation?: Invitation | null;
  newAccount?: boolean | null;
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

export interface AddKeyResourceInput {
  projectId?: string | null;
  title?: string | null;
  link?: string | null;
  resourceType?: string | null;
}

export interface AddKeyResourceResult {
  keyResource?: ProjectKeyResource | null;
}

export interface AddProjectContributorInput {
  projectId?: string | null;
  personId?: string | null;
  responsibility?: string | null;
  permissions?: number | null;
  role?: string | null;
}

export interface AddProjectContributorResult {
  projectContributor?: ProjectContributor | null;
}

export interface AddProjectContributorsInput {
  projectId?: string | null;
  contributors?: ProjectContributorInput[] | null;
}

export interface AddProjectContributorsResult {
  success?: boolean | null;
}

export interface AddReactionInput {
  entityId?: Id | null;
  entityType?: string | null;
  parentType?: string | null;
  emoji?: string | null;
}

export interface AddReactionResult {
  reaction?: Reaction | null;
}

export interface AddSpaceMembersInput {
  spaceId?: Id | null;
  members?: AddMemberInput[] | null;
}

export interface AddSpaceMembersResult {}

export interface ArchiveGoalInput {
  goalId?: string | null;
}

export interface ArchiveGoalResult {
  goal?: Goal | null;
}

export interface ArchiveMessageInput {
  messageId?: Id | null;
}

export interface ArchiveMessageResult {}

export interface ArchiveProjectInput {
  projectId?: string | null;
}

export interface ArchiveProjectResult {
  project?: Project | null;
}

export interface ChangeGoalParentInput {
  goalId?: string | null;
  parentGoalId?: string | null;
}

export interface ChangeGoalParentResult {
  goal?: Goal | null;
}

export interface ChangePasswordInput {
  currentPassword?: string | null;
  newPassword?: string | null;
  newPasswordConfirmation?: string | null;
}

export interface ChangePasswordResult {}

export interface ChangeTaskDescriptionInput {
  taskId?: string | null;
  description?: string | null;
}

export interface ChangeTaskDescriptionResult {
  task?: Task | null;
}

export interface CloseGoalInput {
  goalId?: Id | null;
  success?: string | null;
  retrospective?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface CloseGoalResult {
  goal?: Goal | null;
}

export interface CloseProjectInput {
  projectId?: string | null;
  retrospective?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface CloseProjectResult {
  retrospective?: ProjectRetrospective | null;
}

export interface ConnectGoalToProjectInput {
  projectId?: string | null;
  goalId?: string | null;
}

export interface ConnectGoalToProjectResult {
  project?: Project | null;
}

export interface CopyResourceHubFolderInput {
  folderName?: string | null;
  folderId?: Id | null;
  destResourceHubId?: Id | null;
  destParentFolderId?: Id | null;
}

export interface CopyResourceHubFolderResult {
  folderId?: Id | null;
}

export interface CreateAccountInput {
  code?: string | null;
  email?: string | null;
  password?: string | null;
  fullName?: string | null;
}

export interface CreateAccountResult {}

export interface CreateBlobInput {
  files?: BlobCreationInput[] | null;
}

export interface CreateBlobResult {
  blobs?: BlobCreationOutput[] | null;
}

export interface CreateCommentInput {
  entityId?: string | null;
  entityType?: string | null;
  content?: string | null;
}

export interface CreateCommentResult {
  comment?: Comment | null;
}

export interface CreateEmailActivationCodeInput {
  email?: string | null;
}

export interface CreateEmailActivationCodeResult {}

export interface CreateGoalInput {
  spaceId?: Id | null;
  name?: string | null;
  championId?: Id | null;
  reviewerId?: Id | null;
  timeframe?: Timeframe | null;
  targets?: CreateTargetInput[] | null;
  description?: string | null;
  parentGoalId?: Id | null;
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
}

export interface CreateGoalResult {
  goal?: Goal | null;
}

export interface CreateGoalDiscussionInput {
  goalId?: Id | null;
  title?: string | null;
  message?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface CreateGoalDiscussionResult {
  id?: string | null;
}

export interface CreateProjectInput {
  spaceId?: string | null;
  name?: string | null;
  championId?: string | null;
  reviewerId?: string | null;
  creatorIsContributor?: string | null;
  creatorRole?: string | null;
  goalId?: string | null;
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
}

export interface CreateProjectResult {
  project?: Project | null;
}

export interface CreateResourceHubInput {
  spaceId?: string | null;
  name?: string | null;
  description?: string | null;
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
}

export interface CreateResourceHubResult {
  resourceHub?: ResourceHub | null;
}

export interface CreateResourceHubDocumentInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  name?: string | null;
  content?: string | null;
  postAsDraft?: boolean | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
  copiedDocumentId?: Id | null;
}

export interface CreateResourceHubDocumentResult {
  document?: Document | null;
}

export interface CreateResourceHubFileInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  files?: ResourceHubUploadedFile[] | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface CreateResourceHubFileResult {
  files?: ResourceHubFile[] | null;
}

export interface CreateResourceHubFolderInput {
  resourceHubId?: string | null;
  folderId?: string | null;
  name?: string | null;
}

export interface CreateResourceHubFolderResult {
  folder?: ResourceHubFolder | null;
}

export interface CreateResourceHubLinkInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  name?: string | null;
  url?: string | null;
  description?: string | null;
  type?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface CreateResourceHubLinkResult {
  link?: ResourceHubLink | null;
}

export interface CreateSpaceInput {
  name?: string | null;
  mission?: string | null;
  companyPermissions?: number | null;
  publicPermissions?: number | null;
}

export interface CreateSpaceResult {
  space?: Space | null;
}

export interface CreateTaskInput {
  name?: string | null;
  assigneeIds?: string[] | null;
  description?: string | null;
  milestoneId?: string | null;
}

export interface CreateTaskResult {
  task?: Task | null;
}

export interface DeleteGoalInput {
  goalId?: Id | null;
}

export interface DeleteGoalResult {
  goal?: Goal | null;
}

export interface DeleteResourceHubDocumentInput {
  documentId?: Id | null;
}

export interface DeleteResourceHubDocumentResult {
  document?: Document | null;
}

export interface DeleteResourceHubFileInput {
  fileId?: Id | null;
}

export interface DeleteResourceHubFileResult {
  file?: ResourceHubFile | null;
}

export interface DeleteResourceHubFolderInput {
  folderId?: Id | null;
}

export interface DeleteResourceHubFolderResult {
  success?: boolean | null;
}

export interface DeleteResourceHubLinkInput {
  linkId?: Id | null;
}

export interface DeleteResourceHubLinkResult {
  success?: boolean | null;
}

export interface DisconnectGoalFromProjectInput {
  projectId?: string | null;
  goalId?: string | null;
}

export interface DisconnectGoalFromProjectResult {
  project?: Project | null;
}

export interface EditCommentInput {
  content?: string | null;
  commentId?: string | null;
  parentType?: string | null;
}

export interface EditCommentResult {
  comment?: Comment | null;
}

export interface EditCompanyInput {
  name?: string | null;
}

export interface EditCompanyResult {
  company?: Company | null;
}

export interface EditDiscussionInput {
  id?: Id | null;
  title?: string | null;
  body?: string | null;
  state?: string | null;
}

export interface EditDiscussionResult {
  discussion?: Discussion | null;
}

export interface EditGoalInput {
  goalId?: Id | null;
  parentGoalId?: Id | null;
  name?: string | null;
  championId?: Id | null;
  reviewerId?: Id | null;
  timeframe?: Timeframe | null;
  addedTargets?: CreateTargetInput[] | null;
  updatedTargets?: UpdateTargetInput[] | null;
  description?: string | null;
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
}

export interface EditGoalResult {
  goal?: Goal | null;
}

export interface EditGoalDiscussionInput {
  activityId?: Id | null;
  title?: string | null;
  message?: string | null;
}

export interface EditGoalDiscussionResult {}

export interface EditGoalProgressUpdateInput {
  id?: string | null;
  status?: string | null;
  content?: string | null;
  newTargetValues?: string | null;
  timeframe?: Timeframe | null;
}

export interface EditGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface EditGoalTimeframeInput {
  id?: Id | null;
  timeframe?: Timeframe | null;
  comment?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface EditGoalTimeframeResult {
  goal?: Goal | null;
}

export interface EditKeyResourceInput {
  id?: string | null;
  title?: string | null;
  link?: string | null;
}

export interface EditKeyResourceResult {
  keyResource?: ProjectKeyResource | null;
}

export interface EditParentFolderInResourceHubInput {
  resourceId?: Id | null;
  resourceType?: string | null;
  newFolderId?: Id | null;
}

export interface EditParentFolderInResourceHubResult {
  success?: boolean | null;
}

export interface EditProjectCheckInInput {
  checkInId?: string | null;
  status?: string | null;
  description?: string | null;
}

export interface EditProjectCheckInResult {
  checkIn?: ProjectCheckIn | null;
}

export interface EditProjectNameInput {
  projectId?: string | null;
  name?: string | null;
}

export interface EditProjectNameResult {
  project?: Project | null;
}

export interface EditProjectPermissionsInput {
  projectId?: string | null;
  accessLevels?: AccessLevels | null;
}

export interface EditProjectPermissionsResult {
  success?: boolean | null;
}

export interface EditProjectRetrospectiveInput {
  id?: string | null;
  content?: string | null;
}

export interface EditProjectRetrospectiveResult {
  retrospective?: ProjectRetrospective | null;
}

export interface EditProjectTimelineInput {
  projectId?: string | null;
  projectStartDate?: string | null;
  projectDueDate?: string | null;
  milestoneUpdates?: EditProjectTimelineMilestoneUpdateInput[] | null;
  newMilestones?: EditProjectTimelineNewMilestoneInput[] | null;
}

export interface EditProjectTimelineResult {
  project?: Project | null;
}

export interface EditResourceHubDocumentInput {
  documentId?: Id | null;
  name?: string | null;
  content?: string | null;
}

export interface EditResourceHubDocumentResult {
  document?: ResourceHubDocument | null;
}

export interface EditResourceHubFileInput {
  fileId?: Id | null;
  name?: string | null;
  description?: string | null;
}

export interface EditResourceHubFileResult {
  file?: ResourceHubFile | null;
}

export interface EditResourceHubLinkInput {
  linkId?: Id | null;
  name?: string | null;
  type?: string | null;
  url?: string | null;
  description?: string | null;
}

export interface EditResourceHubLinkResult {
  link?: ResourceHubLink | null;
}

export interface EditSpaceInput {
  id?: Id | null;
  name?: string | null;
  mission?: string | null;
}

export interface EditSpaceResult {
  space?: Space | null;
}

export interface EditSpaceMembersPermissionsInput {
  spaceId?: Id | null;
  members?: EditMemberPermissionsInput[] | null;
}

export interface EditSpaceMembersPermissionsResult {
  success?: boolean | null;
}

export interface EditSpacePermissionsInput {
  spaceId?: string | null;
  accessLevels?: AccessLevels | null;
}

export interface EditSpacePermissionsResult {
  success?: boolean | null;
}

export interface EditSubscriptionsListInput {
  id?: string | null;
  type?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface EditSubscriptionsListResult {}

export interface GoalsAddTargetInput {
  goalId?: Id | null;
  name?: string | null;
  startValue?: number | null;
  targetValue?: number | null;
  unit?: string | null;
}

export interface GoalsAddTargetResult {
  targetId?: Id | null;
  success?: boolean | null;
}

export interface GoalsDeleteTargetInput {
  goalId?: Id | null;
  targetId?: Id | null;
}

export interface GoalsDeleteTargetResult {
  success?: boolean | null;
}

export interface GoalsUpdateDescriptionInput {
  goalId?: Id | null;
  description?: Json | null;
}

export interface GoalsUpdateDescriptionResult {
  success?: boolean | null;
}

export interface GoalsUpdateDueDateInput {
  goalId?: Id | null;
  dueDate?: string | null;
}

export interface GoalsUpdateDueDateResult {
  success?: boolean | null;
}

export interface GoalsUpdateNameInput {
  goalId?: Id | null;
  name?: string | null;
}

export interface GoalsUpdateNameResult {
  success?: boolean | null;
}

export interface GoalsUpdateTargetInput {
  goalId?: Id | null;
  targetId?: Id | null;
  name?: string | null;
  startValue?: number | null;
  targetValue?: number | null;
  unit?: string | null;
}

export interface GoalsUpdateTargetResult {
  success?: boolean | null;
}

export interface GoalsUpdateTargetIndexInput {
  goalId?: Id | null;
  targetId?: Id | null;
  index?: number | null;
}

export interface GoalsUpdateTargetIndexResult {
  success?: boolean | null;
}

export interface GoalsUpdateTargetValueInput {
  goalId?: Id | null;
  targetId?: Id | null;
  value?: number | null;
}

export interface GoalsUpdateTargetValueResult {
  success?: boolean | null;
}

export interface JoinCompanyInput {
  token?: string | null;
  password?: string | null;
  passwordConfirmation?: string | null;
}

export interface JoinCompanyResult {
  result?: string | null;
}

export interface JoinSpaceInput {
  spaceId?: Id | null;
}

export interface JoinSpaceResult {}

export interface MarkAllNotificationsAsReadInput {}

export interface MarkAllNotificationsAsReadResult {}

export interface MarkNotificationAsReadInput {
  id?: string | null;
}

export interface MarkNotificationAsReadResult {}

export interface MarkNotificationsAsReadInput {
  ids?: string[] | null;
}

export interface MarkNotificationsAsReadResult {}

export interface MoveProjectToSpaceInput {
  projectId?: string | null;
  spaceId?: string | null;
}

export interface MoveProjectToSpaceResult {}

export interface NewInvitationTokenInput {
  personId?: string | null;
}

export interface NewInvitationTokenResult {
  invitation?: Invitation | null;
}

export interface PauseProjectInput {
  projectId?: string | null;
}

export interface PauseProjectResult {
  project?: Project | null;
}

export interface PostDiscussionInput {
  spaceId?: Id | null;
  title?: string | null;
  body?: string | null;
  postAsDraft?: boolean | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface PostDiscussionResult {
  discussion?: Discussion | null;
}

export interface PostGoalProgressUpdateInput {
  status?: string | null;
  content?: string | null;
  goalId?: string | null;
  timeframe?: Timeframe | null;
  newTargetValues?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface PostGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface PostMilestoneCommentInput {
  milestoneId?: string | null;
  content?: string | null;
  action?: string | null;
}

export interface PostMilestoneCommentResult {
  comment?: MilestoneComment | null;
}

export interface PostProjectCheckInInput {
  projectId?: string | null;
  status?: string | null;
  description?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface PostProjectCheckInResult {
  checkIn?: ProjectCheckIn | null;
}

export interface PublishDiscussionInput {
  id?: Id | null;
}

export interface PublishDiscussionResult {
  discussion?: Discussion | null;
}

export interface PublishResourceHubDocumentInput {
  documentId?: Id | null;
  name?: string | null;
  content?: string | null;
}

export interface PublishResourceHubDocumentResult {
  document?: ResourceHubDocument | null;
}

export interface RemoveCompanyAdminInput {
  personId?: Id | null;
}

export interface RemoveCompanyAdminResult {
  person?: Person | null;
}

export interface RemoveCompanyMemberInput {
  personId?: string | null;
}

export interface RemoveCompanyMemberResult {
  person?: Person | null;
}

export interface RemoveCompanyOwnerInput {
  personId?: Id | null;
}

export interface RemoveCompanyOwnerResult {}

export interface RemoveCompanyTrustedEmailDomainInput {
  companyId?: string | null;
  domain?: string | null;
}

export interface RemoveCompanyTrustedEmailDomainResult {
  company?: Company | null;
}

export interface RemoveGroupMemberInput {
  groupId?: string | null;
  memberId?: string | null;
}

export interface RemoveGroupMemberResult {}

export interface RemoveKeyResourceInput {
  id?: string | null;
}

export interface RemoveKeyResourceResult {
  keyResource?: ProjectKeyResource | null;
}

export interface RemoveProjectContributorInput {
  contribId?: string | null;
}

export interface RemoveProjectContributorResult {
  projectContributor?: ProjectContributor | null;
}

export interface RemoveProjectMilestoneInput {
  milestoneId?: string | null;
}

export interface RemoveProjectMilestoneResult {
  milestone?: Milestone | null;
}

export interface RenameResourceHubFolderInput {
  folderId?: Id | null;
  newName?: string | null;
}

export interface RenameResourceHubFolderResult {
  success?: boolean | null;
}

export interface ReopenGoalInput {
  id?: Id | null;
  message?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface ReopenGoalResult {
  goal?: Goal | null;
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

export interface RestoreCompanyMemberInput {
  personId?: Id | null;
}

export interface RestoreCompanyMemberResult {}

export interface ResumeProjectInput {
  projectId?: string | null;
}

export interface ResumeProjectResult {
  project?: Project | null;
}

export interface SubscribeToNotificationsInput {
  id?: string | null;
  type?: string | null;
}

export interface SubscribeToNotificationsResult {}

export interface UnsubscribeFromNotificationsInput {
  id?: string | null;
}

export interface UnsubscribeFromNotificationsResult {}

export interface UpdateMilestoneInput {
  milestoneId?: string | null;
  title?: string | null;
  deadlineAt?: string | null;
}

export interface UpdateMilestoneResult {
  milestone?: Milestone | null;
}

export interface UpdateMilestoneDescriptionInput {
  id?: string | null;
  description?: string | null;
}

export interface UpdateMilestoneDescriptionResult {
  milestone?: Milestone | null;
}

export interface UpdateProfileInput {
  id?: string | null;
  fullName?: string | null;
  title?: string | null;
  timezone?: string | null;
  managerId?: string | null;
  theme?: string | null;
}

export interface UpdateProfileResult {
  person?: Person | null;
}

export interface UpdateProjectContributorInput {
  contribId?: string | null;
  personId?: string | null;
  responsibility?: string | null;
  permissions?: number | null;
  role?: string | null;
}

export interface UpdateProjectContributorResult {
  contributor?: ProjectContributor | null;
}

export interface UpdateProjectDescriptionInput {
  projectId?: string | null;
  description?: string | null;
}

export interface UpdateProjectDescriptionResult {
  project?: Project | null;
}

export interface UpdateTaskInput {
  taskId?: string | null;
  name?: string | null;
  assignedIds?: string[] | null;
}

export interface UpdateTaskResult {
  task?: Task | null;
}

export interface UpdateTaskStatusInput {
  taskId?: string | null;
  status?: string | null;
  columnIndex?: number | null;
}

export interface UpdateTaskStatusResult {
  task?: Task | null;
}

class ApiNamespaceRoot {
  constructor(private client: ApiClient) {}

  async getAccount(input: GetAccountInput): Promise<GetAccountResult> {
    return this.client.get("/get_account", input);
  }

  async getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return this.client.get("/get_activities", input);
  }

  async getActivity(input: GetActivityInput): Promise<GetActivityResult> {
    return this.client.get("/get_activity", input);
  }

  async getAssignments(input: GetAssignmentsInput): Promise<GetAssignmentsResult> {
    return this.client.get("/get_assignments", input);
  }

  async getAssignmentsCount(input: GetAssignmentsCountInput): Promise<GetAssignmentsCountResult> {
    return this.client.get("/get_assignments_count", input);
  }

  async getBindedPeople(input: GetBindedPeopleInput): Promise<GetBindedPeopleResult> {
    return this.client.get("/get_binded_people", input);
  }

  async getComments(input: GetCommentsInput): Promise<GetCommentsResult> {
    return this.client.get("/get_comments", input);
  }

  async getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
    return this.client.get("/get_companies", input);
  }

  async getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
    return this.client.get("/get_company", input);
  }

  async getDiscussion(input: GetDiscussionInput): Promise<GetDiscussionResult> {
    return this.client.get("/get_discussion", input);
  }

  async getDiscussions(input: GetDiscussionsInput): Promise<GetDiscussionsResult> {
    return this.client.get("/get_discussions", input);
  }

  async getGoal(input: GetGoalInput): Promise<GetGoalResult> {
    return this.client.get("/get_goal", input);
  }

  async getGoalProgressUpdate(input: GetGoalProgressUpdateInput): Promise<GetGoalProgressUpdateResult> {
    return this.client.get("/get_goal_progress_update", input);
  }

  async getGoalProgressUpdates(input: GetGoalProgressUpdatesInput): Promise<GetGoalProgressUpdatesResult> {
    return this.client.get("/get_goal_progress_updates", input);
  }

  async getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
    return this.client.get("/get_goals", input);
  }

  async getInvitation(input: GetInvitationInput): Promise<GetInvitationResult> {
    return this.client.get("/get_invitation", input);
  }

  async getKeyResource(input: GetKeyResourceInput): Promise<GetKeyResourceResult> {
    return this.client.get("/get_key_resource", input);
  }

  async getMe(input: GetMeInput): Promise<GetMeResult> {
    return this.client.get("/get_me", input);
  }

  async getMilestone(input: GetMilestoneInput): Promise<GetMilestoneResult> {
    return this.client.get("/get_milestone", input);
  }

  async getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
    return this.client.get("/get_notifications", input);
  }

  async getPeople(input: GetPeopleInput): Promise<GetPeopleResult> {
    return this.client.get("/get_people", input);
  }

  async getPerson(input: GetPersonInput): Promise<GetPersonResult> {
    return this.client.get("/get_person", input);
  }

  async getProject(input: GetProjectInput): Promise<GetProjectResult> {
    return this.client.get("/get_project", input);
  }

  async getProjectCheckIn(input: GetProjectCheckInInput): Promise<GetProjectCheckInResult> {
    return this.client.get("/get_project_check_in", input);
  }

  async getProjectCheckIns(input: GetProjectCheckInsInput): Promise<GetProjectCheckInsResult> {
    return this.client.get("/get_project_check_ins", input);
  }

  async getProjectContributor(input: GetProjectContributorInput): Promise<GetProjectContributorResult> {
    return this.client.get("/get_project_contributor", input);
  }

  async getProjectRetrospective(input: GetProjectRetrospectiveInput): Promise<GetProjectRetrospectiveResult> {
    return this.client.get("/get_project_retrospective", input);
  }

  async getProjects(input: GetProjectsInput): Promise<GetProjectsResult> {
    return this.client.get("/get_projects", input);
  }

  async getResourceHub(input: GetResourceHubInput): Promise<GetResourceHubResult> {
    return this.client.get("/get_resource_hub", input);
  }

  async getResourceHubDocument(input: GetResourceHubDocumentInput): Promise<GetResourceHubDocumentResult> {
    return this.client.get("/get_resource_hub_document", input);
  }

  async getResourceHubFile(input: GetResourceHubFileInput): Promise<GetResourceHubFileResult> {
    return this.client.get("/get_resource_hub_file", input);
  }

  async getResourceHubFolder(input: GetResourceHubFolderInput): Promise<GetResourceHubFolderResult> {
    return this.client.get("/get_resource_hub_folder", input);
  }

  async getResourceHubLink(input: GetResourceHubLinkInput): Promise<GetResourceHubLinkResult> {
    return this.client.get("/get_resource_hub_link", input);
  }

  async getSpace(input: GetSpaceInput): Promise<GetSpaceResult> {
    return this.client.get("/get_space", input);
  }

  async getSpaces(input: GetSpacesInput): Promise<GetSpacesResult> {
    return this.client.get("/get_spaces", input);
  }

  async getTask(input: GetTaskInput): Promise<GetTaskResult> {
    return this.client.get("/get_task", input);
  }

  async getTasks(input: GetTasksInput): Promise<GetTasksResult> {
    return this.client.get("/get_tasks", input);
  }

  async getUnreadNotificationCount(input: GetUnreadNotificationCountInput): Promise<GetUnreadNotificationCountResult> {
    return this.client.get("/get_unread_notification_count", input);
  }

  async getWorkMap(input: GetWorkMapInput): Promise<GetWorkMapResult> {
    return this.client.get("/get_work_map", input);
  }

  async listGoalContributors(input: ListGoalContributorsInput): Promise<ListGoalContributorsResult> {
    return this.client.get("/list_goal_contributors", input);
  }

  async listResourceHubNodes(input: ListResourceHubNodesInput): Promise<ListResourceHubNodesResult> {
    return this.client.get("/list_resource_hub_nodes", input);
  }

  async listSpaceTools(input: ListSpaceToolsInput): Promise<ListSpaceToolsResult> {
    return this.client.get("/list_space_tools", input);
  }

  async runAiPrompt(input: RunAiPromptInput): Promise<RunAiPromptResult> {
    return this.client.get("/run_ai_prompt", input);
  }

  async searchPeople(input: SearchPeopleInput): Promise<SearchPeopleResult> {
    return this.client.get("/search_people", input);
  }

  async searchPotentialSpaceMembers(
    input: SearchPotentialSpaceMembersInput,
  ): Promise<SearchPotentialSpaceMembersResult> {
    return this.client.get("/search_potential_space_members", input);
  }

  async searchProjectContributorCandidates(
    input: SearchProjectContributorCandidatesInput,
  ): Promise<SearchProjectContributorCandidatesResult> {
    return this.client.get("/search_project_contributor_candidates", input);
  }

  async acknowledgeGoalProgressUpdate(
    input: AcknowledgeGoalProgressUpdateInput,
  ): Promise<AcknowledgeGoalProgressUpdateResult> {
    return this.client.post("/acknowledge_goal_progress_update", input);
  }

  async acknowledgeProjectCheckIn(input: AcknowledgeProjectCheckInInput): Promise<AcknowledgeProjectCheckInResult> {
    return this.client.post("/acknowledge_project_check_in", input);
  }

  async addCompany(input: AddCompanyInput): Promise<AddCompanyResult> {
    return this.client.post("/add_company", input);
  }

  async addCompanyAdmins(input: AddCompanyAdminsInput): Promise<AddCompanyAdminsResult> {
    return this.client.post("/add_company_admins", input);
  }

  async addCompanyMember(input: AddCompanyMemberInput): Promise<AddCompanyMemberResult> {
    return this.client.post("/add_company_member", input);
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

  async addKeyResource(input: AddKeyResourceInput): Promise<AddKeyResourceResult> {
    return this.client.post("/add_key_resource", input);
  }

  async addProjectContributor(input: AddProjectContributorInput): Promise<AddProjectContributorResult> {
    return this.client.post("/add_project_contributor", input);
  }

  async addProjectContributors(input: AddProjectContributorsInput): Promise<AddProjectContributorsResult> {
    return this.client.post("/add_project_contributors", input);
  }

  async addReaction(input: AddReactionInput): Promise<AddReactionResult> {
    return this.client.post("/add_reaction", input);
  }

  async addSpaceMembers(input: AddSpaceMembersInput): Promise<AddSpaceMembersResult> {
    return this.client.post("/add_space_members", input);
  }

  async archiveGoal(input: ArchiveGoalInput): Promise<ArchiveGoalResult> {
    return this.client.post("/archive_goal", input);
  }

  async archiveMessage(input: ArchiveMessageInput): Promise<ArchiveMessageResult> {
    return this.client.post("/archive_message", input);
  }

  async archiveProject(input: ArchiveProjectInput): Promise<ArchiveProjectResult> {
    return this.client.post("/archive_project", input);
  }

  async changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
    return this.client.post("/change_goal_parent", input);
  }

  async changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    return this.client.post("/change_password", input);
  }

  async changeTaskDescription(input: ChangeTaskDescriptionInput): Promise<ChangeTaskDescriptionResult> {
    return this.client.post("/change_task_description", input);
  }

  async closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
    return this.client.post("/close_goal", input);
  }

  async closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
    return this.client.post("/close_project", input);
  }

  async connectGoalToProject(input: ConnectGoalToProjectInput): Promise<ConnectGoalToProjectResult> {
    return this.client.post("/connect_goal_to_project", input);
  }

  async copyResourceHubFolder(input: CopyResourceHubFolderInput): Promise<CopyResourceHubFolderResult> {
    return this.client.post("/copy_resource_hub_folder", input);
  }

  async createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
    return this.client.post("/create_account", input);
  }

  async createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
    return this.client.post("/create_blob", input);
  }

  async createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
    return this.client.post("/create_comment", input);
  }

  async createEmailActivationCode(input: CreateEmailActivationCodeInput): Promise<CreateEmailActivationCodeResult> {
    return this.client.post("/create_email_activation_code", input);
  }

  async createGoal(input: CreateGoalInput): Promise<CreateGoalResult> {
    return this.client.post("/create_goal", input);
  }

  async createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
    return this.client.post("/create_goal_discussion", input);
  }

  async createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
    return this.client.post("/create_project", input);
  }

  async createResourceHub(input: CreateResourceHubInput): Promise<CreateResourceHubResult> {
    return this.client.post("/create_resource_hub", input);
  }

  async createResourceHubDocument(input: CreateResourceHubDocumentInput): Promise<CreateResourceHubDocumentResult> {
    return this.client.post("/create_resource_hub_document", input);
  }

  async createResourceHubFile(input: CreateResourceHubFileInput): Promise<CreateResourceHubFileResult> {
    return this.client.post("/create_resource_hub_file", input);
  }

  async createResourceHubFolder(input: CreateResourceHubFolderInput): Promise<CreateResourceHubFolderResult> {
    return this.client.post("/create_resource_hub_folder", input);
  }

  async createResourceHubLink(input: CreateResourceHubLinkInput): Promise<CreateResourceHubLinkResult> {
    return this.client.post("/create_resource_hub_link", input);
  }

  async createSpace(input: CreateSpaceInput): Promise<CreateSpaceResult> {
    return this.client.post("/create_space", input);
  }

  async createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
    return this.client.post("/create_task", input);
  }

  async deleteGoal(input: DeleteGoalInput): Promise<DeleteGoalResult> {
    return this.client.post("/delete_goal", input);
  }

  async deleteResourceHubDocument(input: DeleteResourceHubDocumentInput): Promise<DeleteResourceHubDocumentResult> {
    return this.client.post("/delete_resource_hub_document", input);
  }

  async deleteResourceHubFile(input: DeleteResourceHubFileInput): Promise<DeleteResourceHubFileResult> {
    return this.client.post("/delete_resource_hub_file", input);
  }

  async deleteResourceHubFolder(input: DeleteResourceHubFolderInput): Promise<DeleteResourceHubFolderResult> {
    return this.client.post("/delete_resource_hub_folder", input);
  }

  async deleteResourceHubLink(input: DeleteResourceHubLinkInput): Promise<DeleteResourceHubLinkResult> {
    return this.client.post("/delete_resource_hub_link", input);
  }

  async disconnectGoalFromProject(input: DisconnectGoalFromProjectInput): Promise<DisconnectGoalFromProjectResult> {
    return this.client.post("/disconnect_goal_from_project", input);
  }

  async editComment(input: EditCommentInput): Promise<EditCommentResult> {
    return this.client.post("/edit_comment", input);
  }

  async editCompany(input: EditCompanyInput): Promise<EditCompanyResult> {
    return this.client.post("/edit_company", input);
  }

  async editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
    return this.client.post("/edit_discussion", input);
  }

  async editGoal(input: EditGoalInput): Promise<EditGoalResult> {
    return this.client.post("/edit_goal", input);
  }

  async editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return this.client.post("/edit_goal_discussion", input);
  }

  async editGoalProgressUpdate(input: EditGoalProgressUpdateInput): Promise<EditGoalProgressUpdateResult> {
    return this.client.post("/edit_goal_progress_update", input);
  }

  async editGoalTimeframe(input: EditGoalTimeframeInput): Promise<EditGoalTimeframeResult> {
    return this.client.post("/edit_goal_timeframe", input);
  }

  async editKeyResource(input: EditKeyResourceInput): Promise<EditKeyResourceResult> {
    return this.client.post("/edit_key_resource", input);
  }

  async editParentFolderInResourceHub(
    input: EditParentFolderInResourceHubInput,
  ): Promise<EditParentFolderInResourceHubResult> {
    return this.client.post("/edit_parent_folder_in_resource_hub", input);
  }

  async editProjectCheckIn(input: EditProjectCheckInInput): Promise<EditProjectCheckInResult> {
    return this.client.post("/edit_project_check_in", input);
  }

  async editProjectName(input: EditProjectNameInput): Promise<EditProjectNameResult> {
    return this.client.post("/edit_project_name", input);
  }

  async editProjectPermissions(input: EditProjectPermissionsInput): Promise<EditProjectPermissionsResult> {
    return this.client.post("/edit_project_permissions", input);
  }

  async editProjectRetrospective(input: EditProjectRetrospectiveInput): Promise<EditProjectRetrospectiveResult> {
    return this.client.post("/edit_project_retrospective", input);
  }

  async editProjectTimeline(input: EditProjectTimelineInput): Promise<EditProjectTimelineResult> {
    return this.client.post("/edit_project_timeline", input);
  }

  async editResourceHubDocument(input: EditResourceHubDocumentInput): Promise<EditResourceHubDocumentResult> {
    return this.client.post("/edit_resource_hub_document", input);
  }

  async editResourceHubFile(input: EditResourceHubFileInput): Promise<EditResourceHubFileResult> {
    return this.client.post("/edit_resource_hub_file", input);
  }

  async editResourceHubLink(input: EditResourceHubLinkInput): Promise<EditResourceHubLinkResult> {
    return this.client.post("/edit_resource_hub_link", input);
  }

  async editSpace(input: EditSpaceInput): Promise<EditSpaceResult> {
    return this.client.post("/edit_space", input);
  }

  async editSpaceMembersPermissions(
    input: EditSpaceMembersPermissionsInput,
  ): Promise<EditSpaceMembersPermissionsResult> {
    return this.client.post("/edit_space_members_permissions", input);
  }

  async editSpacePermissions(input: EditSpacePermissionsInput): Promise<EditSpacePermissionsResult> {
    return this.client.post("/edit_space_permissions", input);
  }

  async editSubscriptionsList(input: EditSubscriptionsListInput): Promise<EditSubscriptionsListResult> {
    return this.client.post("/edit_subscriptions_list", input);
  }

  async joinCompany(input: JoinCompanyInput): Promise<JoinCompanyResult> {
    return this.client.post("/join_company", input);
  }

  async joinSpace(input: JoinSpaceInput): Promise<JoinSpaceResult> {
    return this.client.post("/join_space", input);
  }

  async markAllNotificationsAsRead(input: MarkAllNotificationsAsReadInput): Promise<MarkAllNotificationsAsReadResult> {
    return this.client.post("/mark_all_notifications_as_read", input);
  }

  async markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadResult> {
    return this.client.post("/mark_notification_as_read", input);
  }

  async markNotificationsAsRead(input: MarkNotificationsAsReadInput): Promise<MarkNotificationsAsReadResult> {
    return this.client.post("/mark_notifications_as_read", input);
  }

  async moveProjectToSpace(input: MoveProjectToSpaceInput): Promise<MoveProjectToSpaceResult> {
    return this.client.post("/move_project_to_space", input);
  }

  async newInvitationToken(input: NewInvitationTokenInput): Promise<NewInvitationTokenResult> {
    return this.client.post("/new_invitation_token", input);
  }

  async pauseProject(input: PauseProjectInput): Promise<PauseProjectResult> {
    return this.client.post("/pause_project", input);
  }

  async postDiscussion(input: PostDiscussionInput): Promise<PostDiscussionResult> {
    return this.client.post("/post_discussion", input);
  }

  async postGoalProgressUpdate(input: PostGoalProgressUpdateInput): Promise<PostGoalProgressUpdateResult> {
    return this.client.post("/post_goal_progress_update", input);
  }

  async postMilestoneComment(input: PostMilestoneCommentInput): Promise<PostMilestoneCommentResult> {
    return this.client.post("/post_milestone_comment", input);
  }

  async postProjectCheckIn(input: PostProjectCheckInInput): Promise<PostProjectCheckInResult> {
    return this.client.post("/post_project_check_in", input);
  }

  async publishDiscussion(input: PublishDiscussionInput): Promise<PublishDiscussionResult> {
    return this.client.post("/publish_discussion", input);
  }

  async publishResourceHubDocument(input: PublishResourceHubDocumentInput): Promise<PublishResourceHubDocumentResult> {
    return this.client.post("/publish_resource_hub_document", input);
  }

  async removeCompanyAdmin(input: RemoveCompanyAdminInput): Promise<RemoveCompanyAdminResult> {
    return this.client.post("/remove_company_admin", input);
  }

  async removeCompanyMember(input: RemoveCompanyMemberInput): Promise<RemoveCompanyMemberResult> {
    return this.client.post("/remove_company_member", input);
  }

  async removeCompanyOwner(input: RemoveCompanyOwnerInput): Promise<RemoveCompanyOwnerResult> {
    return this.client.post("/remove_company_owner", input);
  }

  async removeCompanyTrustedEmailDomain(
    input: RemoveCompanyTrustedEmailDomainInput,
  ): Promise<RemoveCompanyTrustedEmailDomainResult> {
    return this.client.post("/remove_company_trusted_email_domain", input);
  }

  async removeGroupMember(input: RemoveGroupMemberInput): Promise<RemoveGroupMemberResult> {
    return this.client.post("/remove_group_member", input);
  }

  async removeKeyResource(input: RemoveKeyResourceInput): Promise<RemoveKeyResourceResult> {
    return this.client.post("/remove_key_resource", input);
  }

  async removeProjectContributor(input: RemoveProjectContributorInput): Promise<RemoveProjectContributorResult> {
    return this.client.post("/remove_project_contributor", input);
  }

  async removeProjectMilestone(input: RemoveProjectMilestoneInput): Promise<RemoveProjectMilestoneResult> {
    return this.client.post("/remove_project_milestone", input);
  }

  async renameResourceHubFolder(input: RenameResourceHubFolderInput): Promise<RenameResourceHubFolderResult> {
    return this.client.post("/rename_resource_hub_folder", input);
  }

  async reopenGoal(input: ReopenGoalInput): Promise<ReopenGoalResult> {
    return this.client.post("/reopen_goal", input);
  }

  async requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    return this.client.post("/request_password_reset", input);
  }

  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    return this.client.post("/reset_password", input);
  }

  async restoreCompanyMember(input: RestoreCompanyMemberInput): Promise<RestoreCompanyMemberResult> {
    return this.client.post("/restore_company_member", input);
  }

  async resumeProject(input: ResumeProjectInput): Promise<ResumeProjectResult> {
    return this.client.post("/resume_project", input);
  }

  async subscribeToNotifications(input: SubscribeToNotificationsInput): Promise<SubscribeToNotificationsResult> {
    return this.client.post("/subscribe_to_notifications", input);
  }

  async unsubscribeFromNotifications(
    input: UnsubscribeFromNotificationsInput,
  ): Promise<UnsubscribeFromNotificationsResult> {
    return this.client.post("/unsubscribe_from_notifications", input);
  }

  async updateMilestone(input: UpdateMilestoneInput): Promise<UpdateMilestoneResult> {
    return this.client.post("/update_milestone", input);
  }

  async updateMilestoneDescription(input: UpdateMilestoneDescriptionInput): Promise<UpdateMilestoneDescriptionResult> {
    return this.client.post("/update_milestone_description", input);
  }

  async updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    return this.client.post("/update_profile", input);
  }

  async updateProjectContributor(input: UpdateProjectContributorInput): Promise<UpdateProjectContributorResult> {
    return this.client.post("/update_project_contributor", input);
  }

  async updateProjectDescription(input: UpdateProjectDescriptionInput): Promise<UpdateProjectDescriptionResult> {
    return this.client.post("/update_project_description", input);
  }

  async updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
    return this.client.post("/update_task", input);
  }

  async updateTaskStatus(input: UpdateTaskStatusInput): Promise<UpdateTaskStatusResult> {
    return this.client.post("/update_task_status", input);
  }
}

class ApiNamespaceGoals {
  constructor(private client: ApiClient) {}

  async addTarget(input: GoalsAddTargetInput): Promise<GoalsAddTargetResult> {
    return this.client.post("/goals/add_target", input);
  }

  async deleteTarget(input: GoalsDeleteTargetInput): Promise<GoalsDeleteTargetResult> {
    return this.client.post("/goals/delete_target", input);
  }

  async updateDescription(input: GoalsUpdateDescriptionInput): Promise<GoalsUpdateDescriptionResult> {
    return this.client.post("/goals/update_description", input);
  }

  async updateDueDate(input: GoalsUpdateDueDateInput): Promise<GoalsUpdateDueDateResult> {
    return this.client.post("/goals/update_due_date", input);
  }

  async updateName(input: GoalsUpdateNameInput): Promise<GoalsUpdateNameResult> {
    return this.client.post("/goals/update_name", input);
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

export class ApiClient {
  private basePath: string;
  private headers: any;
  public apiNamespaceRoot: ApiNamespaceRoot;
  public apiNamespaceGoals: ApiNamespaceGoals;

  constructor() {
    this.apiNamespaceRoot = new ApiNamespaceRoot(this);
    this.apiNamespaceGoals = new ApiNamespaceGoals(this);
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
    const response = await axios.post(this.getBasePath() + path, toSnake(data), { headers: this.getHeaders() });
    return toCamel(response.data);
  }

  // @ts-ignore
  async get(path: string, params: any) {
    const response = await axios.get(this.getBasePath() + path, {
      params: toSnake(params),
      headers: this.getHeaders(),
    });
    return toCamel(response.data);
  }

  getAccount(input: GetAccountInput): Promise<GetAccountResult> {
    return this.apiNamespaceRoot.getAccount(input);
  }

  getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return this.apiNamespaceRoot.getActivities(input);
  }

  getActivity(input: GetActivityInput): Promise<GetActivityResult> {
    return this.apiNamespaceRoot.getActivity(input);
  }

  getAssignments(input: GetAssignmentsInput): Promise<GetAssignmentsResult> {
    return this.apiNamespaceRoot.getAssignments(input);
  }

  getAssignmentsCount(input: GetAssignmentsCountInput): Promise<GetAssignmentsCountResult> {
    return this.apiNamespaceRoot.getAssignmentsCount(input);
  }

  getBindedPeople(input: GetBindedPeopleInput): Promise<GetBindedPeopleResult> {
    return this.apiNamespaceRoot.getBindedPeople(input);
  }

  getComments(input: GetCommentsInput): Promise<GetCommentsResult> {
    return this.apiNamespaceRoot.getComments(input);
  }

  getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
    return this.apiNamespaceRoot.getCompanies(input);
  }

  getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
    return this.apiNamespaceRoot.getCompany(input);
  }

  getDiscussion(input: GetDiscussionInput): Promise<GetDiscussionResult> {
    return this.apiNamespaceRoot.getDiscussion(input);
  }

  getDiscussions(input: GetDiscussionsInput): Promise<GetDiscussionsResult> {
    return this.apiNamespaceRoot.getDiscussions(input);
  }

  getGoal(input: GetGoalInput): Promise<GetGoalResult> {
    return this.apiNamespaceRoot.getGoal(input);
  }

  getGoalProgressUpdate(input: GetGoalProgressUpdateInput): Promise<GetGoalProgressUpdateResult> {
    return this.apiNamespaceRoot.getGoalProgressUpdate(input);
  }

  getGoalProgressUpdates(input: GetGoalProgressUpdatesInput): Promise<GetGoalProgressUpdatesResult> {
    return this.apiNamespaceRoot.getGoalProgressUpdates(input);
  }

  getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
    return this.apiNamespaceRoot.getGoals(input);
  }

  getInvitation(input: GetInvitationInput): Promise<GetInvitationResult> {
    return this.apiNamespaceRoot.getInvitation(input);
  }

  getKeyResource(input: GetKeyResourceInput): Promise<GetKeyResourceResult> {
    return this.apiNamespaceRoot.getKeyResource(input);
  }

  getMe(input: GetMeInput): Promise<GetMeResult> {
    return this.apiNamespaceRoot.getMe(input);
  }

  getMilestone(input: GetMilestoneInput): Promise<GetMilestoneResult> {
    return this.apiNamespaceRoot.getMilestone(input);
  }

  getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
    return this.apiNamespaceRoot.getNotifications(input);
  }

  getPeople(input: GetPeopleInput): Promise<GetPeopleResult> {
    return this.apiNamespaceRoot.getPeople(input);
  }

  getPerson(input: GetPersonInput): Promise<GetPersonResult> {
    return this.apiNamespaceRoot.getPerson(input);
  }

  getProject(input: GetProjectInput): Promise<GetProjectResult> {
    return this.apiNamespaceRoot.getProject(input);
  }

  getProjectCheckIn(input: GetProjectCheckInInput): Promise<GetProjectCheckInResult> {
    return this.apiNamespaceRoot.getProjectCheckIn(input);
  }

  getProjectCheckIns(input: GetProjectCheckInsInput): Promise<GetProjectCheckInsResult> {
    return this.apiNamespaceRoot.getProjectCheckIns(input);
  }

  getProjectContributor(input: GetProjectContributorInput): Promise<GetProjectContributorResult> {
    return this.apiNamespaceRoot.getProjectContributor(input);
  }

  getProjectRetrospective(input: GetProjectRetrospectiveInput): Promise<GetProjectRetrospectiveResult> {
    return this.apiNamespaceRoot.getProjectRetrospective(input);
  }

  getProjects(input: GetProjectsInput): Promise<GetProjectsResult> {
    return this.apiNamespaceRoot.getProjects(input);
  }

  getResourceHub(input: GetResourceHubInput): Promise<GetResourceHubResult> {
    return this.apiNamespaceRoot.getResourceHub(input);
  }

  getResourceHubDocument(input: GetResourceHubDocumentInput): Promise<GetResourceHubDocumentResult> {
    return this.apiNamespaceRoot.getResourceHubDocument(input);
  }

  getResourceHubFile(input: GetResourceHubFileInput): Promise<GetResourceHubFileResult> {
    return this.apiNamespaceRoot.getResourceHubFile(input);
  }

  getResourceHubFolder(input: GetResourceHubFolderInput): Promise<GetResourceHubFolderResult> {
    return this.apiNamespaceRoot.getResourceHubFolder(input);
  }

  getResourceHubLink(input: GetResourceHubLinkInput): Promise<GetResourceHubLinkResult> {
    return this.apiNamespaceRoot.getResourceHubLink(input);
  }

  getSpace(input: GetSpaceInput): Promise<GetSpaceResult> {
    return this.apiNamespaceRoot.getSpace(input);
  }

  getSpaces(input: GetSpacesInput): Promise<GetSpacesResult> {
    return this.apiNamespaceRoot.getSpaces(input);
  }

  getTask(input: GetTaskInput): Promise<GetTaskResult> {
    return this.apiNamespaceRoot.getTask(input);
  }

  getTasks(input: GetTasksInput): Promise<GetTasksResult> {
    return this.apiNamespaceRoot.getTasks(input);
  }

  getUnreadNotificationCount(input: GetUnreadNotificationCountInput): Promise<GetUnreadNotificationCountResult> {
    return this.apiNamespaceRoot.getUnreadNotificationCount(input);
  }

  getWorkMap(input: GetWorkMapInput): Promise<GetWorkMapResult> {
    return this.apiNamespaceRoot.getWorkMap(input);
  }

  listGoalContributors(input: ListGoalContributorsInput): Promise<ListGoalContributorsResult> {
    return this.apiNamespaceRoot.listGoalContributors(input);
  }

  listResourceHubNodes(input: ListResourceHubNodesInput): Promise<ListResourceHubNodesResult> {
    return this.apiNamespaceRoot.listResourceHubNodes(input);
  }

  listSpaceTools(input: ListSpaceToolsInput): Promise<ListSpaceToolsResult> {
    return this.apiNamespaceRoot.listSpaceTools(input);
  }

  runAiPrompt(input: RunAiPromptInput): Promise<RunAiPromptResult> {
    return this.apiNamespaceRoot.runAiPrompt(input);
  }

  searchPeople(input: SearchPeopleInput): Promise<SearchPeopleResult> {
    return this.apiNamespaceRoot.searchPeople(input);
  }

  searchPotentialSpaceMembers(input: SearchPotentialSpaceMembersInput): Promise<SearchPotentialSpaceMembersResult> {
    return this.apiNamespaceRoot.searchPotentialSpaceMembers(input);
  }

  searchProjectContributorCandidates(
    input: SearchProjectContributorCandidatesInput,
  ): Promise<SearchProjectContributorCandidatesResult> {
    return this.apiNamespaceRoot.searchProjectContributorCandidates(input);
  }

  acknowledgeGoalProgressUpdate(
    input: AcknowledgeGoalProgressUpdateInput,
  ): Promise<AcknowledgeGoalProgressUpdateResult> {
    return this.apiNamespaceRoot.acknowledgeGoalProgressUpdate(input);
  }

  acknowledgeProjectCheckIn(input: AcknowledgeProjectCheckInInput): Promise<AcknowledgeProjectCheckInResult> {
    return this.apiNamespaceRoot.acknowledgeProjectCheckIn(input);
  }

  addCompany(input: AddCompanyInput): Promise<AddCompanyResult> {
    return this.apiNamespaceRoot.addCompany(input);
  }

  addCompanyAdmins(input: AddCompanyAdminsInput): Promise<AddCompanyAdminsResult> {
    return this.apiNamespaceRoot.addCompanyAdmins(input);
  }

  addCompanyMember(input: AddCompanyMemberInput): Promise<AddCompanyMemberResult> {
    return this.apiNamespaceRoot.addCompanyMember(input);
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

  addKeyResource(input: AddKeyResourceInput): Promise<AddKeyResourceResult> {
    return this.apiNamespaceRoot.addKeyResource(input);
  }

  addProjectContributor(input: AddProjectContributorInput): Promise<AddProjectContributorResult> {
    return this.apiNamespaceRoot.addProjectContributor(input);
  }

  addProjectContributors(input: AddProjectContributorsInput): Promise<AddProjectContributorsResult> {
    return this.apiNamespaceRoot.addProjectContributors(input);
  }

  addReaction(input: AddReactionInput): Promise<AddReactionResult> {
    return this.apiNamespaceRoot.addReaction(input);
  }

  addSpaceMembers(input: AddSpaceMembersInput): Promise<AddSpaceMembersResult> {
    return this.apiNamespaceRoot.addSpaceMembers(input);
  }

  archiveGoal(input: ArchiveGoalInput): Promise<ArchiveGoalResult> {
    return this.apiNamespaceRoot.archiveGoal(input);
  }

  archiveMessage(input: ArchiveMessageInput): Promise<ArchiveMessageResult> {
    return this.apiNamespaceRoot.archiveMessage(input);
  }

  archiveProject(input: ArchiveProjectInput): Promise<ArchiveProjectResult> {
    return this.apiNamespaceRoot.archiveProject(input);
  }

  changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
    return this.apiNamespaceRoot.changeGoalParent(input);
  }

  changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    return this.apiNamespaceRoot.changePassword(input);
  }

  changeTaskDescription(input: ChangeTaskDescriptionInput): Promise<ChangeTaskDescriptionResult> {
    return this.apiNamespaceRoot.changeTaskDescription(input);
  }

  closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
    return this.apiNamespaceRoot.closeGoal(input);
  }

  closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
    return this.apiNamespaceRoot.closeProject(input);
  }

  connectGoalToProject(input: ConnectGoalToProjectInput): Promise<ConnectGoalToProjectResult> {
    return this.apiNamespaceRoot.connectGoalToProject(input);
  }

  copyResourceHubFolder(input: CopyResourceHubFolderInput): Promise<CopyResourceHubFolderResult> {
    return this.apiNamespaceRoot.copyResourceHubFolder(input);
  }

  createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
    return this.apiNamespaceRoot.createAccount(input);
  }

  createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
    return this.apiNamespaceRoot.createBlob(input);
  }

  createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
    return this.apiNamespaceRoot.createComment(input);
  }

  createEmailActivationCode(input: CreateEmailActivationCodeInput): Promise<CreateEmailActivationCodeResult> {
    return this.apiNamespaceRoot.createEmailActivationCode(input);
  }

  createGoal(input: CreateGoalInput): Promise<CreateGoalResult> {
    return this.apiNamespaceRoot.createGoal(input);
  }

  createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
    return this.apiNamespaceRoot.createGoalDiscussion(input);
  }

  createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
    return this.apiNamespaceRoot.createProject(input);
  }

  createResourceHub(input: CreateResourceHubInput): Promise<CreateResourceHubResult> {
    return this.apiNamespaceRoot.createResourceHub(input);
  }

  createResourceHubDocument(input: CreateResourceHubDocumentInput): Promise<CreateResourceHubDocumentResult> {
    return this.apiNamespaceRoot.createResourceHubDocument(input);
  }

  createResourceHubFile(input: CreateResourceHubFileInput): Promise<CreateResourceHubFileResult> {
    return this.apiNamespaceRoot.createResourceHubFile(input);
  }

  createResourceHubFolder(input: CreateResourceHubFolderInput): Promise<CreateResourceHubFolderResult> {
    return this.apiNamespaceRoot.createResourceHubFolder(input);
  }

  createResourceHubLink(input: CreateResourceHubLinkInput): Promise<CreateResourceHubLinkResult> {
    return this.apiNamespaceRoot.createResourceHubLink(input);
  }

  createSpace(input: CreateSpaceInput): Promise<CreateSpaceResult> {
    return this.apiNamespaceRoot.createSpace(input);
  }

  createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
    return this.apiNamespaceRoot.createTask(input);
  }

  deleteGoal(input: DeleteGoalInput): Promise<DeleteGoalResult> {
    return this.apiNamespaceRoot.deleteGoal(input);
  }

  deleteResourceHubDocument(input: DeleteResourceHubDocumentInput): Promise<DeleteResourceHubDocumentResult> {
    return this.apiNamespaceRoot.deleteResourceHubDocument(input);
  }

  deleteResourceHubFile(input: DeleteResourceHubFileInput): Promise<DeleteResourceHubFileResult> {
    return this.apiNamespaceRoot.deleteResourceHubFile(input);
  }

  deleteResourceHubFolder(input: DeleteResourceHubFolderInput): Promise<DeleteResourceHubFolderResult> {
    return this.apiNamespaceRoot.deleteResourceHubFolder(input);
  }

  deleteResourceHubLink(input: DeleteResourceHubLinkInput): Promise<DeleteResourceHubLinkResult> {
    return this.apiNamespaceRoot.deleteResourceHubLink(input);
  }

  disconnectGoalFromProject(input: DisconnectGoalFromProjectInput): Promise<DisconnectGoalFromProjectResult> {
    return this.apiNamespaceRoot.disconnectGoalFromProject(input);
  }

  editComment(input: EditCommentInput): Promise<EditCommentResult> {
    return this.apiNamespaceRoot.editComment(input);
  }

  editCompany(input: EditCompanyInput): Promise<EditCompanyResult> {
    return this.apiNamespaceRoot.editCompany(input);
  }

  editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
    return this.apiNamespaceRoot.editDiscussion(input);
  }

  editGoal(input: EditGoalInput): Promise<EditGoalResult> {
    return this.apiNamespaceRoot.editGoal(input);
  }

  editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return this.apiNamespaceRoot.editGoalDiscussion(input);
  }

  editGoalProgressUpdate(input: EditGoalProgressUpdateInput): Promise<EditGoalProgressUpdateResult> {
    return this.apiNamespaceRoot.editGoalProgressUpdate(input);
  }

  editGoalTimeframe(input: EditGoalTimeframeInput): Promise<EditGoalTimeframeResult> {
    return this.apiNamespaceRoot.editGoalTimeframe(input);
  }

  editKeyResource(input: EditKeyResourceInput): Promise<EditKeyResourceResult> {
    return this.apiNamespaceRoot.editKeyResource(input);
  }

  editParentFolderInResourceHub(
    input: EditParentFolderInResourceHubInput,
  ): Promise<EditParentFolderInResourceHubResult> {
    return this.apiNamespaceRoot.editParentFolderInResourceHub(input);
  }

  editProjectCheckIn(input: EditProjectCheckInInput): Promise<EditProjectCheckInResult> {
    return this.apiNamespaceRoot.editProjectCheckIn(input);
  }

  editProjectName(input: EditProjectNameInput): Promise<EditProjectNameResult> {
    return this.apiNamespaceRoot.editProjectName(input);
  }

  editProjectPermissions(input: EditProjectPermissionsInput): Promise<EditProjectPermissionsResult> {
    return this.apiNamespaceRoot.editProjectPermissions(input);
  }

  editProjectRetrospective(input: EditProjectRetrospectiveInput): Promise<EditProjectRetrospectiveResult> {
    return this.apiNamespaceRoot.editProjectRetrospective(input);
  }

  editProjectTimeline(input: EditProjectTimelineInput): Promise<EditProjectTimelineResult> {
    return this.apiNamespaceRoot.editProjectTimeline(input);
  }

  editResourceHubDocument(input: EditResourceHubDocumentInput): Promise<EditResourceHubDocumentResult> {
    return this.apiNamespaceRoot.editResourceHubDocument(input);
  }

  editResourceHubFile(input: EditResourceHubFileInput): Promise<EditResourceHubFileResult> {
    return this.apiNamespaceRoot.editResourceHubFile(input);
  }

  editResourceHubLink(input: EditResourceHubLinkInput): Promise<EditResourceHubLinkResult> {
    return this.apiNamespaceRoot.editResourceHubLink(input);
  }

  editSpace(input: EditSpaceInput): Promise<EditSpaceResult> {
    return this.apiNamespaceRoot.editSpace(input);
  }

  editSpaceMembersPermissions(input: EditSpaceMembersPermissionsInput): Promise<EditSpaceMembersPermissionsResult> {
    return this.apiNamespaceRoot.editSpaceMembersPermissions(input);
  }

  editSpacePermissions(input: EditSpacePermissionsInput): Promise<EditSpacePermissionsResult> {
    return this.apiNamespaceRoot.editSpacePermissions(input);
  }

  editSubscriptionsList(input: EditSubscriptionsListInput): Promise<EditSubscriptionsListResult> {
    return this.apiNamespaceRoot.editSubscriptionsList(input);
  }

  joinCompany(input: JoinCompanyInput): Promise<JoinCompanyResult> {
    return this.apiNamespaceRoot.joinCompany(input);
  }

  joinSpace(input: JoinSpaceInput): Promise<JoinSpaceResult> {
    return this.apiNamespaceRoot.joinSpace(input);
  }

  markAllNotificationsAsRead(input: MarkAllNotificationsAsReadInput): Promise<MarkAllNotificationsAsReadResult> {
    return this.apiNamespaceRoot.markAllNotificationsAsRead(input);
  }

  markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadResult> {
    return this.apiNamespaceRoot.markNotificationAsRead(input);
  }

  markNotificationsAsRead(input: MarkNotificationsAsReadInput): Promise<MarkNotificationsAsReadResult> {
    return this.apiNamespaceRoot.markNotificationsAsRead(input);
  }

  moveProjectToSpace(input: MoveProjectToSpaceInput): Promise<MoveProjectToSpaceResult> {
    return this.apiNamespaceRoot.moveProjectToSpace(input);
  }

  newInvitationToken(input: NewInvitationTokenInput): Promise<NewInvitationTokenResult> {
    return this.apiNamespaceRoot.newInvitationToken(input);
  }

  pauseProject(input: PauseProjectInput): Promise<PauseProjectResult> {
    return this.apiNamespaceRoot.pauseProject(input);
  }

  postDiscussion(input: PostDiscussionInput): Promise<PostDiscussionResult> {
    return this.apiNamespaceRoot.postDiscussion(input);
  }

  postGoalProgressUpdate(input: PostGoalProgressUpdateInput): Promise<PostGoalProgressUpdateResult> {
    return this.apiNamespaceRoot.postGoalProgressUpdate(input);
  }

  postMilestoneComment(input: PostMilestoneCommentInput): Promise<PostMilestoneCommentResult> {
    return this.apiNamespaceRoot.postMilestoneComment(input);
  }

  postProjectCheckIn(input: PostProjectCheckInInput): Promise<PostProjectCheckInResult> {
    return this.apiNamespaceRoot.postProjectCheckIn(input);
  }

  publishDiscussion(input: PublishDiscussionInput): Promise<PublishDiscussionResult> {
    return this.apiNamespaceRoot.publishDiscussion(input);
  }

  publishResourceHubDocument(input: PublishResourceHubDocumentInput): Promise<PublishResourceHubDocumentResult> {
    return this.apiNamespaceRoot.publishResourceHubDocument(input);
  }

  removeCompanyAdmin(input: RemoveCompanyAdminInput): Promise<RemoveCompanyAdminResult> {
    return this.apiNamespaceRoot.removeCompanyAdmin(input);
  }

  removeCompanyMember(input: RemoveCompanyMemberInput): Promise<RemoveCompanyMemberResult> {
    return this.apiNamespaceRoot.removeCompanyMember(input);
  }

  removeCompanyOwner(input: RemoveCompanyOwnerInput): Promise<RemoveCompanyOwnerResult> {
    return this.apiNamespaceRoot.removeCompanyOwner(input);
  }

  removeCompanyTrustedEmailDomain(
    input: RemoveCompanyTrustedEmailDomainInput,
  ): Promise<RemoveCompanyTrustedEmailDomainResult> {
    return this.apiNamespaceRoot.removeCompanyTrustedEmailDomain(input);
  }

  removeGroupMember(input: RemoveGroupMemberInput): Promise<RemoveGroupMemberResult> {
    return this.apiNamespaceRoot.removeGroupMember(input);
  }

  removeKeyResource(input: RemoveKeyResourceInput): Promise<RemoveKeyResourceResult> {
    return this.apiNamespaceRoot.removeKeyResource(input);
  }

  removeProjectContributor(input: RemoveProjectContributorInput): Promise<RemoveProjectContributorResult> {
    return this.apiNamespaceRoot.removeProjectContributor(input);
  }

  removeProjectMilestone(input: RemoveProjectMilestoneInput): Promise<RemoveProjectMilestoneResult> {
    return this.apiNamespaceRoot.removeProjectMilestone(input);
  }

  renameResourceHubFolder(input: RenameResourceHubFolderInput): Promise<RenameResourceHubFolderResult> {
    return this.apiNamespaceRoot.renameResourceHubFolder(input);
  }

  reopenGoal(input: ReopenGoalInput): Promise<ReopenGoalResult> {
    return this.apiNamespaceRoot.reopenGoal(input);
  }

  requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    return this.apiNamespaceRoot.requestPasswordReset(input);
  }

  resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    return this.apiNamespaceRoot.resetPassword(input);
  }

  restoreCompanyMember(input: RestoreCompanyMemberInput): Promise<RestoreCompanyMemberResult> {
    return this.apiNamespaceRoot.restoreCompanyMember(input);
  }

  resumeProject(input: ResumeProjectInput): Promise<ResumeProjectResult> {
    return this.apiNamespaceRoot.resumeProject(input);
  }

  subscribeToNotifications(input: SubscribeToNotificationsInput): Promise<SubscribeToNotificationsResult> {
    return this.apiNamespaceRoot.subscribeToNotifications(input);
  }

  unsubscribeFromNotifications(input: UnsubscribeFromNotificationsInput): Promise<UnsubscribeFromNotificationsResult> {
    return this.apiNamespaceRoot.unsubscribeFromNotifications(input);
  }

  updateMilestone(input: UpdateMilestoneInput): Promise<UpdateMilestoneResult> {
    return this.apiNamespaceRoot.updateMilestone(input);
  }

  updateMilestoneDescription(input: UpdateMilestoneDescriptionInput): Promise<UpdateMilestoneDescriptionResult> {
    return this.apiNamespaceRoot.updateMilestoneDescription(input);
  }

  updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    return this.apiNamespaceRoot.updateProfile(input);
  }

  updateProjectContributor(input: UpdateProjectContributorInput): Promise<UpdateProjectContributorResult> {
    return this.apiNamespaceRoot.updateProjectContributor(input);
  }

  updateProjectDescription(input: UpdateProjectDescriptionInput): Promise<UpdateProjectDescriptionResult> {
    return this.apiNamespaceRoot.updateProjectDescription(input);
  }

  updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
    return this.apiNamespaceRoot.updateTask(input);
  }

  updateTaskStatus(input: UpdateTaskStatusInput): Promise<UpdateTaskStatusResult> {
    return this.apiNamespaceRoot.updateTaskStatus(input);
  }
}

const defaultApiClient = new ApiClient();

export async function getAccount(input: GetAccountInput): Promise<GetAccountResult> {
  return defaultApiClient.getAccount(input);
}
export async function getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
  return defaultApiClient.getActivities(input);
}
export async function getActivity(input: GetActivityInput): Promise<GetActivityResult> {
  return defaultApiClient.getActivity(input);
}
export async function getAssignments(input: GetAssignmentsInput): Promise<GetAssignmentsResult> {
  return defaultApiClient.getAssignments(input);
}
export async function getAssignmentsCount(input: GetAssignmentsCountInput): Promise<GetAssignmentsCountResult> {
  return defaultApiClient.getAssignmentsCount(input);
}
export async function getBindedPeople(input: GetBindedPeopleInput): Promise<GetBindedPeopleResult> {
  return defaultApiClient.getBindedPeople(input);
}
export async function getComments(input: GetCommentsInput): Promise<GetCommentsResult> {
  return defaultApiClient.getComments(input);
}
export async function getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
  return defaultApiClient.getCompanies(input);
}
export async function getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
  return defaultApiClient.getCompany(input);
}
export async function getDiscussion(input: GetDiscussionInput): Promise<GetDiscussionResult> {
  return defaultApiClient.getDiscussion(input);
}
export async function getDiscussions(input: GetDiscussionsInput): Promise<GetDiscussionsResult> {
  return defaultApiClient.getDiscussions(input);
}
export async function getGoal(input: GetGoalInput): Promise<GetGoalResult> {
  return defaultApiClient.getGoal(input);
}
export async function getGoalProgressUpdate(input: GetGoalProgressUpdateInput): Promise<GetGoalProgressUpdateResult> {
  return defaultApiClient.getGoalProgressUpdate(input);
}
export async function getGoalProgressUpdates(
  input: GetGoalProgressUpdatesInput,
): Promise<GetGoalProgressUpdatesResult> {
  return defaultApiClient.getGoalProgressUpdates(input);
}
export async function getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
  return defaultApiClient.getGoals(input);
}
export async function getInvitation(input: GetInvitationInput): Promise<GetInvitationResult> {
  return defaultApiClient.getInvitation(input);
}
export async function getKeyResource(input: GetKeyResourceInput): Promise<GetKeyResourceResult> {
  return defaultApiClient.getKeyResource(input);
}
export async function getMe(input: GetMeInput): Promise<GetMeResult> {
  return defaultApiClient.getMe(input);
}
export async function getMilestone(input: GetMilestoneInput): Promise<GetMilestoneResult> {
  return defaultApiClient.getMilestone(input);
}
export async function getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
  return defaultApiClient.getNotifications(input);
}
export async function getPeople(input: GetPeopleInput): Promise<GetPeopleResult> {
  return defaultApiClient.getPeople(input);
}
export async function getPerson(input: GetPersonInput): Promise<GetPersonResult> {
  return defaultApiClient.getPerson(input);
}
export async function getProject(input: GetProjectInput): Promise<GetProjectResult> {
  return defaultApiClient.getProject(input);
}
export async function getProjectCheckIn(input: GetProjectCheckInInput): Promise<GetProjectCheckInResult> {
  return defaultApiClient.getProjectCheckIn(input);
}
export async function getProjectCheckIns(input: GetProjectCheckInsInput): Promise<GetProjectCheckInsResult> {
  return defaultApiClient.getProjectCheckIns(input);
}
export async function getProjectContributor(input: GetProjectContributorInput): Promise<GetProjectContributorResult> {
  return defaultApiClient.getProjectContributor(input);
}
export async function getProjectRetrospective(
  input: GetProjectRetrospectiveInput,
): Promise<GetProjectRetrospectiveResult> {
  return defaultApiClient.getProjectRetrospective(input);
}
export async function getProjects(input: GetProjectsInput): Promise<GetProjectsResult> {
  return defaultApiClient.getProjects(input);
}
export async function getResourceHub(input: GetResourceHubInput): Promise<GetResourceHubResult> {
  return defaultApiClient.getResourceHub(input);
}
export async function getResourceHubDocument(
  input: GetResourceHubDocumentInput,
): Promise<GetResourceHubDocumentResult> {
  return defaultApiClient.getResourceHubDocument(input);
}
export async function getResourceHubFile(input: GetResourceHubFileInput): Promise<GetResourceHubFileResult> {
  return defaultApiClient.getResourceHubFile(input);
}
export async function getResourceHubFolder(input: GetResourceHubFolderInput): Promise<GetResourceHubFolderResult> {
  return defaultApiClient.getResourceHubFolder(input);
}
export async function getResourceHubLink(input: GetResourceHubLinkInput): Promise<GetResourceHubLinkResult> {
  return defaultApiClient.getResourceHubLink(input);
}
export async function getSpace(input: GetSpaceInput): Promise<GetSpaceResult> {
  return defaultApiClient.getSpace(input);
}
export async function getSpaces(input: GetSpacesInput): Promise<GetSpacesResult> {
  return defaultApiClient.getSpaces(input);
}
export async function getTask(input: GetTaskInput): Promise<GetTaskResult> {
  return defaultApiClient.getTask(input);
}
export async function getTasks(input: GetTasksInput): Promise<GetTasksResult> {
  return defaultApiClient.getTasks(input);
}
export async function getUnreadNotificationCount(
  input: GetUnreadNotificationCountInput,
): Promise<GetUnreadNotificationCountResult> {
  return defaultApiClient.getUnreadNotificationCount(input);
}
export async function getWorkMap(input: GetWorkMapInput): Promise<GetWorkMapResult> {
  return defaultApiClient.getWorkMap(input);
}
export async function listGoalContributors(input: ListGoalContributorsInput): Promise<ListGoalContributorsResult> {
  return defaultApiClient.listGoalContributors(input);
}
export async function listResourceHubNodes(input: ListResourceHubNodesInput): Promise<ListResourceHubNodesResult> {
  return defaultApiClient.listResourceHubNodes(input);
}
export async function listSpaceTools(input: ListSpaceToolsInput): Promise<ListSpaceToolsResult> {
  return defaultApiClient.listSpaceTools(input);
}
export async function runAiPrompt(input: RunAiPromptInput): Promise<RunAiPromptResult> {
  return defaultApiClient.runAiPrompt(input);
}
export async function searchPeople(input: SearchPeopleInput): Promise<SearchPeopleResult> {
  return defaultApiClient.searchPeople(input);
}
export async function searchPotentialSpaceMembers(
  input: SearchPotentialSpaceMembersInput,
): Promise<SearchPotentialSpaceMembersResult> {
  return defaultApiClient.searchPotentialSpaceMembers(input);
}
export async function searchProjectContributorCandidates(
  input: SearchProjectContributorCandidatesInput,
): Promise<SearchProjectContributorCandidatesResult> {
  return defaultApiClient.searchProjectContributorCandidates(input);
}
export async function acknowledgeGoalProgressUpdate(
  input: AcknowledgeGoalProgressUpdateInput,
): Promise<AcknowledgeGoalProgressUpdateResult> {
  return defaultApiClient.acknowledgeGoalProgressUpdate(input);
}
export async function acknowledgeProjectCheckIn(
  input: AcknowledgeProjectCheckInInput,
): Promise<AcknowledgeProjectCheckInResult> {
  return defaultApiClient.acknowledgeProjectCheckIn(input);
}
export async function addCompany(input: AddCompanyInput): Promise<AddCompanyResult> {
  return defaultApiClient.addCompany(input);
}
export async function addCompanyAdmins(input: AddCompanyAdminsInput): Promise<AddCompanyAdminsResult> {
  return defaultApiClient.addCompanyAdmins(input);
}
export async function addCompanyMember(input: AddCompanyMemberInput): Promise<AddCompanyMemberResult> {
  return defaultApiClient.addCompanyMember(input);
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
export async function addKeyResource(input: AddKeyResourceInput): Promise<AddKeyResourceResult> {
  return defaultApiClient.addKeyResource(input);
}
export async function addProjectContributor(input: AddProjectContributorInput): Promise<AddProjectContributorResult> {
  return defaultApiClient.addProjectContributor(input);
}
export async function addProjectContributors(
  input: AddProjectContributorsInput,
): Promise<AddProjectContributorsResult> {
  return defaultApiClient.addProjectContributors(input);
}
export async function addReaction(input: AddReactionInput): Promise<AddReactionResult> {
  return defaultApiClient.addReaction(input);
}
export async function addSpaceMembers(input: AddSpaceMembersInput): Promise<AddSpaceMembersResult> {
  return defaultApiClient.addSpaceMembers(input);
}
export async function archiveGoal(input: ArchiveGoalInput): Promise<ArchiveGoalResult> {
  return defaultApiClient.archiveGoal(input);
}
export async function archiveMessage(input: ArchiveMessageInput): Promise<ArchiveMessageResult> {
  return defaultApiClient.archiveMessage(input);
}
export async function archiveProject(input: ArchiveProjectInput): Promise<ArchiveProjectResult> {
  return defaultApiClient.archiveProject(input);
}
export async function changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
  return defaultApiClient.changeGoalParent(input);
}
export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  return defaultApiClient.changePassword(input);
}
export async function changeTaskDescription(input: ChangeTaskDescriptionInput): Promise<ChangeTaskDescriptionResult> {
  return defaultApiClient.changeTaskDescription(input);
}
export async function closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
  return defaultApiClient.closeGoal(input);
}
export async function closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
  return defaultApiClient.closeProject(input);
}
export async function connectGoalToProject(input: ConnectGoalToProjectInput): Promise<ConnectGoalToProjectResult> {
  return defaultApiClient.connectGoalToProject(input);
}
export async function copyResourceHubFolder(input: CopyResourceHubFolderInput): Promise<CopyResourceHubFolderResult> {
  return defaultApiClient.copyResourceHubFolder(input);
}
export async function createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
  return defaultApiClient.createAccount(input);
}
export async function createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
  return defaultApiClient.createBlob(input);
}
export async function createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
  return defaultApiClient.createComment(input);
}
export async function createEmailActivationCode(
  input: CreateEmailActivationCodeInput,
): Promise<CreateEmailActivationCodeResult> {
  return defaultApiClient.createEmailActivationCode(input);
}
export async function createGoal(input: CreateGoalInput): Promise<CreateGoalResult> {
  return defaultApiClient.createGoal(input);
}
export async function createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
  return defaultApiClient.createGoalDiscussion(input);
}
export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  return defaultApiClient.createProject(input);
}
export async function createResourceHub(input: CreateResourceHubInput): Promise<CreateResourceHubResult> {
  return defaultApiClient.createResourceHub(input);
}
export async function createResourceHubDocument(
  input: CreateResourceHubDocumentInput,
): Promise<CreateResourceHubDocumentResult> {
  return defaultApiClient.createResourceHubDocument(input);
}
export async function createResourceHubFile(input: CreateResourceHubFileInput): Promise<CreateResourceHubFileResult> {
  return defaultApiClient.createResourceHubFile(input);
}
export async function createResourceHubFolder(
  input: CreateResourceHubFolderInput,
): Promise<CreateResourceHubFolderResult> {
  return defaultApiClient.createResourceHubFolder(input);
}
export async function createResourceHubLink(input: CreateResourceHubLinkInput): Promise<CreateResourceHubLinkResult> {
  return defaultApiClient.createResourceHubLink(input);
}
export async function createSpace(input: CreateSpaceInput): Promise<CreateSpaceResult> {
  return defaultApiClient.createSpace(input);
}
export async function createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  return defaultApiClient.createTask(input);
}
export async function deleteGoal(input: DeleteGoalInput): Promise<DeleteGoalResult> {
  return defaultApiClient.deleteGoal(input);
}
export async function deleteResourceHubDocument(
  input: DeleteResourceHubDocumentInput,
): Promise<DeleteResourceHubDocumentResult> {
  return defaultApiClient.deleteResourceHubDocument(input);
}
export async function deleteResourceHubFile(input: DeleteResourceHubFileInput): Promise<DeleteResourceHubFileResult> {
  return defaultApiClient.deleteResourceHubFile(input);
}
export async function deleteResourceHubFolder(
  input: DeleteResourceHubFolderInput,
): Promise<DeleteResourceHubFolderResult> {
  return defaultApiClient.deleteResourceHubFolder(input);
}
export async function deleteResourceHubLink(input: DeleteResourceHubLinkInput): Promise<DeleteResourceHubLinkResult> {
  return defaultApiClient.deleteResourceHubLink(input);
}
export async function disconnectGoalFromProject(
  input: DisconnectGoalFromProjectInput,
): Promise<DisconnectGoalFromProjectResult> {
  return defaultApiClient.disconnectGoalFromProject(input);
}
export async function editComment(input: EditCommentInput): Promise<EditCommentResult> {
  return defaultApiClient.editComment(input);
}
export async function editCompany(input: EditCompanyInput): Promise<EditCompanyResult> {
  return defaultApiClient.editCompany(input);
}
export async function editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
  return defaultApiClient.editDiscussion(input);
}
export async function editGoal(input: EditGoalInput): Promise<EditGoalResult> {
  return defaultApiClient.editGoal(input);
}
export async function editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
  return defaultApiClient.editGoalDiscussion(input);
}
export async function editGoalProgressUpdate(
  input: EditGoalProgressUpdateInput,
): Promise<EditGoalProgressUpdateResult> {
  return defaultApiClient.editGoalProgressUpdate(input);
}
export async function editGoalTimeframe(input: EditGoalTimeframeInput): Promise<EditGoalTimeframeResult> {
  return defaultApiClient.editGoalTimeframe(input);
}
export async function editKeyResource(input: EditKeyResourceInput): Promise<EditKeyResourceResult> {
  return defaultApiClient.editKeyResource(input);
}
export async function editParentFolderInResourceHub(
  input: EditParentFolderInResourceHubInput,
): Promise<EditParentFolderInResourceHubResult> {
  return defaultApiClient.editParentFolderInResourceHub(input);
}
export async function editProjectCheckIn(input: EditProjectCheckInInput): Promise<EditProjectCheckInResult> {
  return defaultApiClient.editProjectCheckIn(input);
}
export async function editProjectName(input: EditProjectNameInput): Promise<EditProjectNameResult> {
  return defaultApiClient.editProjectName(input);
}
export async function editProjectPermissions(
  input: EditProjectPermissionsInput,
): Promise<EditProjectPermissionsResult> {
  return defaultApiClient.editProjectPermissions(input);
}
export async function editProjectRetrospective(
  input: EditProjectRetrospectiveInput,
): Promise<EditProjectRetrospectiveResult> {
  return defaultApiClient.editProjectRetrospective(input);
}
export async function editProjectTimeline(input: EditProjectTimelineInput): Promise<EditProjectTimelineResult> {
  return defaultApiClient.editProjectTimeline(input);
}
export async function editResourceHubDocument(
  input: EditResourceHubDocumentInput,
): Promise<EditResourceHubDocumentResult> {
  return defaultApiClient.editResourceHubDocument(input);
}
export async function editResourceHubFile(input: EditResourceHubFileInput): Promise<EditResourceHubFileResult> {
  return defaultApiClient.editResourceHubFile(input);
}
export async function editResourceHubLink(input: EditResourceHubLinkInput): Promise<EditResourceHubLinkResult> {
  return defaultApiClient.editResourceHubLink(input);
}
export async function editSpace(input: EditSpaceInput): Promise<EditSpaceResult> {
  return defaultApiClient.editSpace(input);
}
export async function editSpaceMembersPermissions(
  input: EditSpaceMembersPermissionsInput,
): Promise<EditSpaceMembersPermissionsResult> {
  return defaultApiClient.editSpaceMembersPermissions(input);
}
export async function editSpacePermissions(input: EditSpacePermissionsInput): Promise<EditSpacePermissionsResult> {
  return defaultApiClient.editSpacePermissions(input);
}
export async function editSubscriptionsList(input: EditSubscriptionsListInput): Promise<EditSubscriptionsListResult> {
  return defaultApiClient.editSubscriptionsList(input);
}
export async function joinCompany(input: JoinCompanyInput): Promise<JoinCompanyResult> {
  return defaultApiClient.joinCompany(input);
}
export async function joinSpace(input: JoinSpaceInput): Promise<JoinSpaceResult> {
  return defaultApiClient.joinSpace(input);
}
export async function markAllNotificationsAsRead(
  input: MarkAllNotificationsAsReadInput,
): Promise<MarkAllNotificationsAsReadResult> {
  return defaultApiClient.markAllNotificationsAsRead(input);
}
export async function markNotificationAsRead(
  input: MarkNotificationAsReadInput,
): Promise<MarkNotificationAsReadResult> {
  return defaultApiClient.markNotificationAsRead(input);
}
export async function markNotificationsAsRead(
  input: MarkNotificationsAsReadInput,
): Promise<MarkNotificationsAsReadResult> {
  return defaultApiClient.markNotificationsAsRead(input);
}
export async function moveProjectToSpace(input: MoveProjectToSpaceInput): Promise<MoveProjectToSpaceResult> {
  return defaultApiClient.moveProjectToSpace(input);
}
export async function newInvitationToken(input: NewInvitationTokenInput): Promise<NewInvitationTokenResult> {
  return defaultApiClient.newInvitationToken(input);
}
export async function pauseProject(input: PauseProjectInput): Promise<PauseProjectResult> {
  return defaultApiClient.pauseProject(input);
}
export async function postDiscussion(input: PostDiscussionInput): Promise<PostDiscussionResult> {
  return defaultApiClient.postDiscussion(input);
}
export async function postGoalProgressUpdate(
  input: PostGoalProgressUpdateInput,
): Promise<PostGoalProgressUpdateResult> {
  return defaultApiClient.postGoalProgressUpdate(input);
}
export async function postMilestoneComment(input: PostMilestoneCommentInput): Promise<PostMilestoneCommentResult> {
  return defaultApiClient.postMilestoneComment(input);
}
export async function postProjectCheckIn(input: PostProjectCheckInInput): Promise<PostProjectCheckInResult> {
  return defaultApiClient.postProjectCheckIn(input);
}
export async function publishDiscussion(input: PublishDiscussionInput): Promise<PublishDiscussionResult> {
  return defaultApiClient.publishDiscussion(input);
}
export async function publishResourceHubDocument(
  input: PublishResourceHubDocumentInput,
): Promise<PublishResourceHubDocumentResult> {
  return defaultApiClient.publishResourceHubDocument(input);
}
export async function removeCompanyAdmin(input: RemoveCompanyAdminInput): Promise<RemoveCompanyAdminResult> {
  return defaultApiClient.removeCompanyAdmin(input);
}
export async function removeCompanyMember(input: RemoveCompanyMemberInput): Promise<RemoveCompanyMemberResult> {
  return defaultApiClient.removeCompanyMember(input);
}
export async function removeCompanyOwner(input: RemoveCompanyOwnerInput): Promise<RemoveCompanyOwnerResult> {
  return defaultApiClient.removeCompanyOwner(input);
}
export async function removeCompanyTrustedEmailDomain(
  input: RemoveCompanyTrustedEmailDomainInput,
): Promise<RemoveCompanyTrustedEmailDomainResult> {
  return defaultApiClient.removeCompanyTrustedEmailDomain(input);
}
export async function removeGroupMember(input: RemoveGroupMemberInput): Promise<RemoveGroupMemberResult> {
  return defaultApiClient.removeGroupMember(input);
}
export async function removeKeyResource(input: RemoveKeyResourceInput): Promise<RemoveKeyResourceResult> {
  return defaultApiClient.removeKeyResource(input);
}
export async function removeProjectContributor(
  input: RemoveProjectContributorInput,
): Promise<RemoveProjectContributorResult> {
  return defaultApiClient.removeProjectContributor(input);
}
export async function removeProjectMilestone(
  input: RemoveProjectMilestoneInput,
): Promise<RemoveProjectMilestoneResult> {
  return defaultApiClient.removeProjectMilestone(input);
}
export async function renameResourceHubFolder(
  input: RenameResourceHubFolderInput,
): Promise<RenameResourceHubFolderResult> {
  return defaultApiClient.renameResourceHubFolder(input);
}
export async function reopenGoal(input: ReopenGoalInput): Promise<ReopenGoalResult> {
  return defaultApiClient.reopenGoal(input);
}
export async function requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
  return defaultApiClient.requestPasswordReset(input);
}
export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  return defaultApiClient.resetPassword(input);
}
export async function restoreCompanyMember(input: RestoreCompanyMemberInput): Promise<RestoreCompanyMemberResult> {
  return defaultApiClient.restoreCompanyMember(input);
}
export async function resumeProject(input: ResumeProjectInput): Promise<ResumeProjectResult> {
  return defaultApiClient.resumeProject(input);
}
export async function subscribeToNotifications(
  input: SubscribeToNotificationsInput,
): Promise<SubscribeToNotificationsResult> {
  return defaultApiClient.subscribeToNotifications(input);
}
export async function unsubscribeFromNotifications(
  input: UnsubscribeFromNotificationsInput,
): Promise<UnsubscribeFromNotificationsResult> {
  return defaultApiClient.unsubscribeFromNotifications(input);
}
export async function updateMilestone(input: UpdateMilestoneInput): Promise<UpdateMilestoneResult> {
  return defaultApiClient.updateMilestone(input);
}
export async function updateMilestoneDescription(
  input: UpdateMilestoneDescriptionInput,
): Promise<UpdateMilestoneDescriptionResult> {
  return defaultApiClient.updateMilestoneDescription(input);
}
export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  return defaultApiClient.updateProfile(input);
}
export async function updateProjectContributor(
  input: UpdateProjectContributorInput,
): Promise<UpdateProjectContributorResult> {
  return defaultApiClient.updateProjectContributor(input);
}
export async function updateProjectDescription(
  input: UpdateProjectDescriptionInput,
): Promise<UpdateProjectDescriptionResult> {
  return defaultApiClient.updateProjectDescription(input);
}
export async function updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
  return defaultApiClient.updateTask(input);
}
export async function updateTaskStatus(input: UpdateTaskStatusInput): Promise<UpdateTaskStatusResult> {
  return defaultApiClient.updateTaskStatus(input);
}

export function useGetAccount(input: GetAccountInput): UseQueryHookResult<GetAccountResult> {
  return useQuery<GetAccountResult>(() => defaultApiClient.getAccount(input));
}

export function useGetActivities(input: GetActivitiesInput): UseQueryHookResult<GetActivitiesResult> {
  return useQuery<GetActivitiesResult>(() => defaultApiClient.getActivities(input));
}

export function useGetActivity(input: GetActivityInput): UseQueryHookResult<GetActivityResult> {
  return useQuery<GetActivityResult>(() => defaultApiClient.getActivity(input));
}

export function useGetAssignments(input: GetAssignmentsInput): UseQueryHookResult<GetAssignmentsResult> {
  return useQuery<GetAssignmentsResult>(() => defaultApiClient.getAssignments(input));
}

export function useGetAssignmentsCount(input: GetAssignmentsCountInput): UseQueryHookResult<GetAssignmentsCountResult> {
  return useQuery<GetAssignmentsCountResult>(() => defaultApiClient.getAssignmentsCount(input));
}

export function useGetBindedPeople(input: GetBindedPeopleInput): UseQueryHookResult<GetBindedPeopleResult> {
  return useQuery<GetBindedPeopleResult>(() => defaultApiClient.getBindedPeople(input));
}

export function useGetComments(input: GetCommentsInput): UseQueryHookResult<GetCommentsResult> {
  return useQuery<GetCommentsResult>(() => defaultApiClient.getComments(input));
}

export function useGetCompanies(input: GetCompaniesInput): UseQueryHookResult<GetCompaniesResult> {
  return useQuery<GetCompaniesResult>(() => defaultApiClient.getCompanies(input));
}

export function useGetCompany(input: GetCompanyInput): UseQueryHookResult<GetCompanyResult> {
  return useQuery<GetCompanyResult>(() => defaultApiClient.getCompany(input));
}

export function useGetDiscussion(input: GetDiscussionInput): UseQueryHookResult<GetDiscussionResult> {
  return useQuery<GetDiscussionResult>(() => defaultApiClient.getDiscussion(input));
}

export function useGetDiscussions(input: GetDiscussionsInput): UseQueryHookResult<GetDiscussionsResult> {
  return useQuery<GetDiscussionsResult>(() => defaultApiClient.getDiscussions(input));
}

export function useGetGoal(input: GetGoalInput): UseQueryHookResult<GetGoalResult> {
  return useQuery<GetGoalResult>(() => defaultApiClient.getGoal(input));
}

export function useGetGoalProgressUpdate(
  input: GetGoalProgressUpdateInput,
): UseQueryHookResult<GetGoalProgressUpdateResult> {
  return useQuery<GetGoalProgressUpdateResult>(() => defaultApiClient.getGoalProgressUpdate(input));
}

export function useGetGoalProgressUpdates(
  input: GetGoalProgressUpdatesInput,
): UseQueryHookResult<GetGoalProgressUpdatesResult> {
  return useQuery<GetGoalProgressUpdatesResult>(() => defaultApiClient.getGoalProgressUpdates(input));
}

export function useGetGoals(input: GetGoalsInput): UseQueryHookResult<GetGoalsResult> {
  return useQuery<GetGoalsResult>(() => defaultApiClient.getGoals(input));
}

export function useGetInvitation(input: GetInvitationInput): UseQueryHookResult<GetInvitationResult> {
  return useQuery<GetInvitationResult>(() => defaultApiClient.getInvitation(input));
}

export function useGetKeyResource(input: GetKeyResourceInput): UseQueryHookResult<GetKeyResourceResult> {
  return useQuery<GetKeyResourceResult>(() => defaultApiClient.getKeyResource(input));
}

export function useGetMe(input: GetMeInput): UseQueryHookResult<GetMeResult> {
  return useQuery<GetMeResult>(() => defaultApiClient.getMe(input));
}

export function useGetMilestone(input: GetMilestoneInput): UseQueryHookResult<GetMilestoneResult> {
  return useQuery<GetMilestoneResult>(() => defaultApiClient.getMilestone(input));
}

export function useGetNotifications(input: GetNotificationsInput): UseQueryHookResult<GetNotificationsResult> {
  return useQuery<GetNotificationsResult>(() => defaultApiClient.getNotifications(input));
}

export function useGetPeople(input: GetPeopleInput): UseQueryHookResult<GetPeopleResult> {
  return useQuery<GetPeopleResult>(() => defaultApiClient.getPeople(input));
}

export function useGetPerson(input: GetPersonInput): UseQueryHookResult<GetPersonResult> {
  return useQuery<GetPersonResult>(() => defaultApiClient.getPerson(input));
}

export function useGetProject(input: GetProjectInput): UseQueryHookResult<GetProjectResult> {
  return useQuery<GetProjectResult>(() => defaultApiClient.getProject(input));
}

export function useGetProjectCheckIn(input: GetProjectCheckInInput): UseQueryHookResult<GetProjectCheckInResult> {
  return useQuery<GetProjectCheckInResult>(() => defaultApiClient.getProjectCheckIn(input));
}

export function useGetProjectCheckIns(input: GetProjectCheckInsInput): UseQueryHookResult<GetProjectCheckInsResult> {
  return useQuery<GetProjectCheckInsResult>(() => defaultApiClient.getProjectCheckIns(input));
}

export function useGetProjectContributor(
  input: GetProjectContributorInput,
): UseQueryHookResult<GetProjectContributorResult> {
  return useQuery<GetProjectContributorResult>(() => defaultApiClient.getProjectContributor(input));
}

export function useGetProjectRetrospective(
  input: GetProjectRetrospectiveInput,
): UseQueryHookResult<GetProjectRetrospectiveResult> {
  return useQuery<GetProjectRetrospectiveResult>(() => defaultApiClient.getProjectRetrospective(input));
}

export function useGetProjects(input: GetProjectsInput): UseQueryHookResult<GetProjectsResult> {
  return useQuery<GetProjectsResult>(() => defaultApiClient.getProjects(input));
}

export function useGetResourceHub(input: GetResourceHubInput): UseQueryHookResult<GetResourceHubResult> {
  return useQuery<GetResourceHubResult>(() => defaultApiClient.getResourceHub(input));
}

export function useGetResourceHubDocument(
  input: GetResourceHubDocumentInput,
): UseQueryHookResult<GetResourceHubDocumentResult> {
  return useQuery<GetResourceHubDocumentResult>(() => defaultApiClient.getResourceHubDocument(input));
}

export function useGetResourceHubFile(input: GetResourceHubFileInput): UseQueryHookResult<GetResourceHubFileResult> {
  return useQuery<GetResourceHubFileResult>(() => defaultApiClient.getResourceHubFile(input));
}

export function useGetResourceHubFolder(
  input: GetResourceHubFolderInput,
): UseQueryHookResult<GetResourceHubFolderResult> {
  return useQuery<GetResourceHubFolderResult>(() => defaultApiClient.getResourceHubFolder(input));
}

export function useGetResourceHubLink(input: GetResourceHubLinkInput): UseQueryHookResult<GetResourceHubLinkResult> {
  return useQuery<GetResourceHubLinkResult>(() => defaultApiClient.getResourceHubLink(input));
}

export function useGetSpace(input: GetSpaceInput): UseQueryHookResult<GetSpaceResult> {
  return useQuery<GetSpaceResult>(() => defaultApiClient.getSpace(input));
}

export function useGetSpaces(input: GetSpacesInput): UseQueryHookResult<GetSpacesResult> {
  return useQuery<GetSpacesResult>(() => defaultApiClient.getSpaces(input));
}

export function useGetTask(input: GetTaskInput): UseQueryHookResult<GetTaskResult> {
  return useQuery<GetTaskResult>(() => defaultApiClient.getTask(input));
}

export function useGetTasks(input: GetTasksInput): UseQueryHookResult<GetTasksResult> {
  return useQuery<GetTasksResult>(() => defaultApiClient.getTasks(input));
}

export function useGetUnreadNotificationCount(
  input: GetUnreadNotificationCountInput,
): UseQueryHookResult<GetUnreadNotificationCountResult> {
  return useQuery<GetUnreadNotificationCountResult>(() => defaultApiClient.getUnreadNotificationCount(input));
}

export function useGetWorkMap(input: GetWorkMapInput): UseQueryHookResult<GetWorkMapResult> {
  return useQuery<GetWorkMapResult>(() => defaultApiClient.getWorkMap(input));
}

export function useListGoalContributors(
  input: ListGoalContributorsInput,
): UseQueryHookResult<ListGoalContributorsResult> {
  return useQuery<ListGoalContributorsResult>(() => defaultApiClient.listGoalContributors(input));
}

export function useListResourceHubNodes(
  input: ListResourceHubNodesInput,
): UseQueryHookResult<ListResourceHubNodesResult> {
  return useQuery<ListResourceHubNodesResult>(() => defaultApiClient.listResourceHubNodes(input));
}

export function useListSpaceTools(input: ListSpaceToolsInput): UseQueryHookResult<ListSpaceToolsResult> {
  return useQuery<ListSpaceToolsResult>(() => defaultApiClient.listSpaceTools(input));
}

export function useRunAiPrompt(input: RunAiPromptInput): UseQueryHookResult<RunAiPromptResult> {
  return useQuery<RunAiPromptResult>(() => defaultApiClient.runAiPrompt(input));
}

export function useSearchPeople(input: SearchPeopleInput): UseQueryHookResult<SearchPeopleResult> {
  return useQuery<SearchPeopleResult>(() => defaultApiClient.searchPeople(input));
}

export function useSearchPotentialSpaceMembers(
  input: SearchPotentialSpaceMembersInput,
): UseQueryHookResult<SearchPotentialSpaceMembersResult> {
  return useQuery<SearchPotentialSpaceMembersResult>(() => defaultApiClient.searchPotentialSpaceMembers(input));
}

export function useSearchProjectContributorCandidates(
  input: SearchProjectContributorCandidatesInput,
): UseQueryHookResult<SearchProjectContributorCandidatesResult> {
  return useQuery<SearchProjectContributorCandidatesResult>(() =>
    defaultApiClient.searchProjectContributorCandidates(input),
  );
}

export function useAcknowledgeGoalProgressUpdate(): UseMutationHookResult<
  AcknowledgeGoalProgressUpdateInput,
  AcknowledgeGoalProgressUpdateResult
> {
  return useMutation<AcknowledgeGoalProgressUpdateInput, AcknowledgeGoalProgressUpdateResult>((input) =>
    defaultApiClient.acknowledgeGoalProgressUpdate(input),
  );
}

export function useAcknowledgeProjectCheckIn(): UseMutationHookResult<
  AcknowledgeProjectCheckInInput,
  AcknowledgeProjectCheckInResult
> {
  return useMutation<AcknowledgeProjectCheckInInput, AcknowledgeProjectCheckInResult>((input) =>
    defaultApiClient.acknowledgeProjectCheckIn(input),
  );
}

export function useAddCompany(): UseMutationHookResult<AddCompanyInput, AddCompanyResult> {
  return useMutation<AddCompanyInput, AddCompanyResult>((input) => defaultApiClient.addCompany(input));
}

export function useAddCompanyAdmins(): UseMutationHookResult<AddCompanyAdminsInput, AddCompanyAdminsResult> {
  return useMutation<AddCompanyAdminsInput, AddCompanyAdminsResult>((input) =>
    defaultApiClient.addCompanyAdmins(input),
  );
}

export function useAddCompanyMember(): UseMutationHookResult<AddCompanyMemberInput, AddCompanyMemberResult> {
  return useMutation<AddCompanyMemberInput, AddCompanyMemberResult>((input) =>
    defaultApiClient.addCompanyMember(input),
  );
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

export function useAddKeyResource(): UseMutationHookResult<AddKeyResourceInput, AddKeyResourceResult> {
  return useMutation<AddKeyResourceInput, AddKeyResourceResult>((input) => defaultApiClient.addKeyResource(input));
}

export function useAddProjectContributor(): UseMutationHookResult<
  AddProjectContributorInput,
  AddProjectContributorResult
> {
  return useMutation<AddProjectContributorInput, AddProjectContributorResult>((input) =>
    defaultApiClient.addProjectContributor(input),
  );
}

export function useAddProjectContributors(): UseMutationHookResult<
  AddProjectContributorsInput,
  AddProjectContributorsResult
> {
  return useMutation<AddProjectContributorsInput, AddProjectContributorsResult>((input) =>
    defaultApiClient.addProjectContributors(input),
  );
}

export function useAddReaction(): UseMutationHookResult<AddReactionInput, AddReactionResult> {
  return useMutation<AddReactionInput, AddReactionResult>((input) => defaultApiClient.addReaction(input));
}

export function useAddSpaceMembers(): UseMutationHookResult<AddSpaceMembersInput, AddSpaceMembersResult> {
  return useMutation<AddSpaceMembersInput, AddSpaceMembersResult>((input) => defaultApiClient.addSpaceMembers(input));
}

export function useArchiveGoal(): UseMutationHookResult<ArchiveGoalInput, ArchiveGoalResult> {
  return useMutation<ArchiveGoalInput, ArchiveGoalResult>((input) => defaultApiClient.archiveGoal(input));
}

export function useArchiveMessage(): UseMutationHookResult<ArchiveMessageInput, ArchiveMessageResult> {
  return useMutation<ArchiveMessageInput, ArchiveMessageResult>((input) => defaultApiClient.archiveMessage(input));
}

export function useArchiveProject(): UseMutationHookResult<ArchiveProjectInput, ArchiveProjectResult> {
  return useMutation<ArchiveProjectInput, ArchiveProjectResult>((input) => defaultApiClient.archiveProject(input));
}

export function useChangeGoalParent(): UseMutationHookResult<ChangeGoalParentInput, ChangeGoalParentResult> {
  return useMutation<ChangeGoalParentInput, ChangeGoalParentResult>((input) =>
    defaultApiClient.changeGoalParent(input),
  );
}

export function useChangePassword(): UseMutationHookResult<ChangePasswordInput, ChangePasswordResult> {
  return useMutation<ChangePasswordInput, ChangePasswordResult>((input) => defaultApiClient.changePassword(input));
}

export function useChangeTaskDescription(): UseMutationHookResult<
  ChangeTaskDescriptionInput,
  ChangeTaskDescriptionResult
> {
  return useMutation<ChangeTaskDescriptionInput, ChangeTaskDescriptionResult>((input) =>
    defaultApiClient.changeTaskDescription(input),
  );
}

export function useCloseGoal(): UseMutationHookResult<CloseGoalInput, CloseGoalResult> {
  return useMutation<CloseGoalInput, CloseGoalResult>((input) => defaultApiClient.closeGoal(input));
}

export function useCloseProject(): UseMutationHookResult<CloseProjectInput, CloseProjectResult> {
  return useMutation<CloseProjectInput, CloseProjectResult>((input) => defaultApiClient.closeProject(input));
}

export function useConnectGoalToProject(): UseMutationHookResult<
  ConnectGoalToProjectInput,
  ConnectGoalToProjectResult
> {
  return useMutation<ConnectGoalToProjectInput, ConnectGoalToProjectResult>((input) =>
    defaultApiClient.connectGoalToProject(input),
  );
}

export function useCopyResourceHubFolder(): UseMutationHookResult<
  CopyResourceHubFolderInput,
  CopyResourceHubFolderResult
> {
  return useMutation<CopyResourceHubFolderInput, CopyResourceHubFolderResult>((input) =>
    defaultApiClient.copyResourceHubFolder(input),
  );
}

export function useCreateAccount(): UseMutationHookResult<CreateAccountInput, CreateAccountResult> {
  return useMutation<CreateAccountInput, CreateAccountResult>((input) => defaultApiClient.createAccount(input));
}

export function useCreateBlob(): UseMutationHookResult<CreateBlobInput, CreateBlobResult> {
  return useMutation<CreateBlobInput, CreateBlobResult>((input) => defaultApiClient.createBlob(input));
}

export function useCreateComment(): UseMutationHookResult<CreateCommentInput, CreateCommentResult> {
  return useMutation<CreateCommentInput, CreateCommentResult>((input) => defaultApiClient.createComment(input));
}

export function useCreateEmailActivationCode(): UseMutationHookResult<
  CreateEmailActivationCodeInput,
  CreateEmailActivationCodeResult
> {
  return useMutation<CreateEmailActivationCodeInput, CreateEmailActivationCodeResult>((input) =>
    defaultApiClient.createEmailActivationCode(input),
  );
}

export function useCreateGoal(): UseMutationHookResult<CreateGoalInput, CreateGoalResult> {
  return useMutation<CreateGoalInput, CreateGoalResult>((input) => defaultApiClient.createGoal(input));
}

export function useCreateGoalDiscussion(): UseMutationHookResult<
  CreateGoalDiscussionInput,
  CreateGoalDiscussionResult
> {
  return useMutation<CreateGoalDiscussionInput, CreateGoalDiscussionResult>((input) =>
    defaultApiClient.createGoalDiscussion(input),
  );
}

export function useCreateProject(): UseMutationHookResult<CreateProjectInput, CreateProjectResult> {
  return useMutation<CreateProjectInput, CreateProjectResult>((input) => defaultApiClient.createProject(input));
}

export function useCreateResourceHub(): UseMutationHookResult<CreateResourceHubInput, CreateResourceHubResult> {
  return useMutation<CreateResourceHubInput, CreateResourceHubResult>((input) =>
    defaultApiClient.createResourceHub(input),
  );
}

export function useCreateResourceHubDocument(): UseMutationHookResult<
  CreateResourceHubDocumentInput,
  CreateResourceHubDocumentResult
> {
  return useMutation<CreateResourceHubDocumentInput, CreateResourceHubDocumentResult>((input) =>
    defaultApiClient.createResourceHubDocument(input),
  );
}

export function useCreateResourceHubFile(): UseMutationHookResult<
  CreateResourceHubFileInput,
  CreateResourceHubFileResult
> {
  return useMutation<CreateResourceHubFileInput, CreateResourceHubFileResult>((input) =>
    defaultApiClient.createResourceHubFile(input),
  );
}

export function useCreateResourceHubFolder(): UseMutationHookResult<
  CreateResourceHubFolderInput,
  CreateResourceHubFolderResult
> {
  return useMutation<CreateResourceHubFolderInput, CreateResourceHubFolderResult>((input) =>
    defaultApiClient.createResourceHubFolder(input),
  );
}

export function useCreateResourceHubLink(): UseMutationHookResult<
  CreateResourceHubLinkInput,
  CreateResourceHubLinkResult
> {
  return useMutation<CreateResourceHubLinkInput, CreateResourceHubLinkResult>((input) =>
    defaultApiClient.createResourceHubLink(input),
  );
}

export function useCreateSpace(): UseMutationHookResult<CreateSpaceInput, CreateSpaceResult> {
  return useMutation<CreateSpaceInput, CreateSpaceResult>((input) => defaultApiClient.createSpace(input));
}

export function useCreateTask(): UseMutationHookResult<CreateTaskInput, CreateTaskResult> {
  return useMutation<CreateTaskInput, CreateTaskResult>((input) => defaultApiClient.createTask(input));
}

export function useDeleteGoal(): UseMutationHookResult<DeleteGoalInput, DeleteGoalResult> {
  return useMutation<DeleteGoalInput, DeleteGoalResult>((input) => defaultApiClient.deleteGoal(input));
}

export function useDeleteResourceHubDocument(): UseMutationHookResult<
  DeleteResourceHubDocumentInput,
  DeleteResourceHubDocumentResult
> {
  return useMutation<DeleteResourceHubDocumentInput, DeleteResourceHubDocumentResult>((input) =>
    defaultApiClient.deleteResourceHubDocument(input),
  );
}

export function useDeleteResourceHubFile(): UseMutationHookResult<
  DeleteResourceHubFileInput,
  DeleteResourceHubFileResult
> {
  return useMutation<DeleteResourceHubFileInput, DeleteResourceHubFileResult>((input) =>
    defaultApiClient.deleteResourceHubFile(input),
  );
}

export function useDeleteResourceHubFolder(): UseMutationHookResult<
  DeleteResourceHubFolderInput,
  DeleteResourceHubFolderResult
> {
  return useMutation<DeleteResourceHubFolderInput, DeleteResourceHubFolderResult>((input) =>
    defaultApiClient.deleteResourceHubFolder(input),
  );
}

export function useDeleteResourceHubLink(): UseMutationHookResult<
  DeleteResourceHubLinkInput,
  DeleteResourceHubLinkResult
> {
  return useMutation<DeleteResourceHubLinkInput, DeleteResourceHubLinkResult>((input) =>
    defaultApiClient.deleteResourceHubLink(input),
  );
}

export function useDisconnectGoalFromProject(): UseMutationHookResult<
  DisconnectGoalFromProjectInput,
  DisconnectGoalFromProjectResult
> {
  return useMutation<DisconnectGoalFromProjectInput, DisconnectGoalFromProjectResult>((input) =>
    defaultApiClient.disconnectGoalFromProject(input),
  );
}

export function useEditComment(): UseMutationHookResult<EditCommentInput, EditCommentResult> {
  return useMutation<EditCommentInput, EditCommentResult>((input) => defaultApiClient.editComment(input));
}

export function useEditCompany(): UseMutationHookResult<EditCompanyInput, EditCompanyResult> {
  return useMutation<EditCompanyInput, EditCompanyResult>((input) => defaultApiClient.editCompany(input));
}

export function useEditDiscussion(): UseMutationHookResult<EditDiscussionInput, EditDiscussionResult> {
  return useMutation<EditDiscussionInput, EditDiscussionResult>((input) => defaultApiClient.editDiscussion(input));
}

export function useEditGoal(): UseMutationHookResult<EditGoalInput, EditGoalResult> {
  return useMutation<EditGoalInput, EditGoalResult>((input) => defaultApiClient.editGoal(input));
}

export function useEditGoalDiscussion(): UseMutationHookResult<EditGoalDiscussionInput, EditGoalDiscussionResult> {
  return useMutation<EditGoalDiscussionInput, EditGoalDiscussionResult>((input) =>
    defaultApiClient.editGoalDiscussion(input),
  );
}

export function useEditGoalProgressUpdate(): UseMutationHookResult<
  EditGoalProgressUpdateInput,
  EditGoalProgressUpdateResult
> {
  return useMutation<EditGoalProgressUpdateInput, EditGoalProgressUpdateResult>((input) =>
    defaultApiClient.editGoalProgressUpdate(input),
  );
}

export function useEditGoalTimeframe(): UseMutationHookResult<EditGoalTimeframeInput, EditGoalTimeframeResult> {
  return useMutation<EditGoalTimeframeInput, EditGoalTimeframeResult>((input) =>
    defaultApiClient.editGoalTimeframe(input),
  );
}

export function useEditKeyResource(): UseMutationHookResult<EditKeyResourceInput, EditKeyResourceResult> {
  return useMutation<EditKeyResourceInput, EditKeyResourceResult>((input) => defaultApiClient.editKeyResource(input));
}

export function useEditParentFolderInResourceHub(): UseMutationHookResult<
  EditParentFolderInResourceHubInput,
  EditParentFolderInResourceHubResult
> {
  return useMutation<EditParentFolderInResourceHubInput, EditParentFolderInResourceHubResult>((input) =>
    defaultApiClient.editParentFolderInResourceHub(input),
  );
}

export function useEditProjectCheckIn(): UseMutationHookResult<EditProjectCheckInInput, EditProjectCheckInResult> {
  return useMutation<EditProjectCheckInInput, EditProjectCheckInResult>((input) =>
    defaultApiClient.editProjectCheckIn(input),
  );
}

export function useEditProjectName(): UseMutationHookResult<EditProjectNameInput, EditProjectNameResult> {
  return useMutation<EditProjectNameInput, EditProjectNameResult>((input) => defaultApiClient.editProjectName(input));
}

export function useEditProjectPermissions(): UseMutationHookResult<
  EditProjectPermissionsInput,
  EditProjectPermissionsResult
> {
  return useMutation<EditProjectPermissionsInput, EditProjectPermissionsResult>((input) =>
    defaultApiClient.editProjectPermissions(input),
  );
}

export function useEditProjectRetrospective(): UseMutationHookResult<
  EditProjectRetrospectiveInput,
  EditProjectRetrospectiveResult
> {
  return useMutation<EditProjectRetrospectiveInput, EditProjectRetrospectiveResult>((input) =>
    defaultApiClient.editProjectRetrospective(input),
  );
}

export function useEditProjectTimeline(): UseMutationHookResult<EditProjectTimelineInput, EditProjectTimelineResult> {
  return useMutation<EditProjectTimelineInput, EditProjectTimelineResult>((input) =>
    defaultApiClient.editProjectTimeline(input),
  );
}

export function useEditResourceHubDocument(): UseMutationHookResult<
  EditResourceHubDocumentInput,
  EditResourceHubDocumentResult
> {
  return useMutation<EditResourceHubDocumentInput, EditResourceHubDocumentResult>((input) =>
    defaultApiClient.editResourceHubDocument(input),
  );
}

export function useEditResourceHubFile(): UseMutationHookResult<EditResourceHubFileInput, EditResourceHubFileResult> {
  return useMutation<EditResourceHubFileInput, EditResourceHubFileResult>((input) =>
    defaultApiClient.editResourceHubFile(input),
  );
}

export function useEditResourceHubLink(): UseMutationHookResult<EditResourceHubLinkInput, EditResourceHubLinkResult> {
  return useMutation<EditResourceHubLinkInput, EditResourceHubLinkResult>((input) =>
    defaultApiClient.editResourceHubLink(input),
  );
}

export function useEditSpace(): UseMutationHookResult<EditSpaceInput, EditSpaceResult> {
  return useMutation<EditSpaceInput, EditSpaceResult>((input) => defaultApiClient.editSpace(input));
}

export function useEditSpaceMembersPermissions(): UseMutationHookResult<
  EditSpaceMembersPermissionsInput,
  EditSpaceMembersPermissionsResult
> {
  return useMutation<EditSpaceMembersPermissionsInput, EditSpaceMembersPermissionsResult>((input) =>
    defaultApiClient.editSpaceMembersPermissions(input),
  );
}

export function useEditSpacePermissions(): UseMutationHookResult<
  EditSpacePermissionsInput,
  EditSpacePermissionsResult
> {
  return useMutation<EditSpacePermissionsInput, EditSpacePermissionsResult>((input) =>
    defaultApiClient.editSpacePermissions(input),
  );
}

export function useEditSubscriptionsList(): UseMutationHookResult<
  EditSubscriptionsListInput,
  EditSubscriptionsListResult
> {
  return useMutation<EditSubscriptionsListInput, EditSubscriptionsListResult>((input) =>
    defaultApiClient.editSubscriptionsList(input),
  );
}

export function useJoinCompany(): UseMutationHookResult<JoinCompanyInput, JoinCompanyResult> {
  return useMutation<JoinCompanyInput, JoinCompanyResult>((input) => defaultApiClient.joinCompany(input));
}

export function useJoinSpace(): UseMutationHookResult<JoinSpaceInput, JoinSpaceResult> {
  return useMutation<JoinSpaceInput, JoinSpaceResult>((input) => defaultApiClient.joinSpace(input));
}

export function useMarkAllNotificationsAsRead(): UseMutationHookResult<
  MarkAllNotificationsAsReadInput,
  MarkAllNotificationsAsReadResult
> {
  return useMutation<MarkAllNotificationsAsReadInput, MarkAllNotificationsAsReadResult>((input) =>
    defaultApiClient.markAllNotificationsAsRead(input),
  );
}

export function useMarkNotificationAsRead(): UseMutationHookResult<
  MarkNotificationAsReadInput,
  MarkNotificationAsReadResult
> {
  return useMutation<MarkNotificationAsReadInput, MarkNotificationAsReadResult>((input) =>
    defaultApiClient.markNotificationAsRead(input),
  );
}

export function useMarkNotificationsAsRead(): UseMutationHookResult<
  MarkNotificationsAsReadInput,
  MarkNotificationsAsReadResult
> {
  return useMutation<MarkNotificationsAsReadInput, MarkNotificationsAsReadResult>((input) =>
    defaultApiClient.markNotificationsAsRead(input),
  );
}

export function useMoveProjectToSpace(): UseMutationHookResult<MoveProjectToSpaceInput, MoveProjectToSpaceResult> {
  return useMutation<MoveProjectToSpaceInput, MoveProjectToSpaceResult>((input) =>
    defaultApiClient.moveProjectToSpace(input),
  );
}

export function useNewInvitationToken(): UseMutationHookResult<NewInvitationTokenInput, NewInvitationTokenResult> {
  return useMutation<NewInvitationTokenInput, NewInvitationTokenResult>((input) =>
    defaultApiClient.newInvitationToken(input),
  );
}

export function usePauseProject(): UseMutationHookResult<PauseProjectInput, PauseProjectResult> {
  return useMutation<PauseProjectInput, PauseProjectResult>((input) => defaultApiClient.pauseProject(input));
}

export function usePostDiscussion(): UseMutationHookResult<PostDiscussionInput, PostDiscussionResult> {
  return useMutation<PostDiscussionInput, PostDiscussionResult>((input) => defaultApiClient.postDiscussion(input));
}

export function usePostGoalProgressUpdate(): UseMutationHookResult<
  PostGoalProgressUpdateInput,
  PostGoalProgressUpdateResult
> {
  return useMutation<PostGoalProgressUpdateInput, PostGoalProgressUpdateResult>((input) =>
    defaultApiClient.postGoalProgressUpdate(input),
  );
}

export function usePostMilestoneComment(): UseMutationHookResult<
  PostMilestoneCommentInput,
  PostMilestoneCommentResult
> {
  return useMutation<PostMilestoneCommentInput, PostMilestoneCommentResult>((input) =>
    defaultApiClient.postMilestoneComment(input),
  );
}

export function usePostProjectCheckIn(): UseMutationHookResult<PostProjectCheckInInput, PostProjectCheckInResult> {
  return useMutation<PostProjectCheckInInput, PostProjectCheckInResult>((input) =>
    defaultApiClient.postProjectCheckIn(input),
  );
}

export function usePublishDiscussion(): UseMutationHookResult<PublishDiscussionInput, PublishDiscussionResult> {
  return useMutation<PublishDiscussionInput, PublishDiscussionResult>((input) =>
    defaultApiClient.publishDiscussion(input),
  );
}

export function usePublishResourceHubDocument(): UseMutationHookResult<
  PublishResourceHubDocumentInput,
  PublishResourceHubDocumentResult
> {
  return useMutation<PublishResourceHubDocumentInput, PublishResourceHubDocumentResult>((input) =>
    defaultApiClient.publishResourceHubDocument(input),
  );
}

export function useRemoveCompanyAdmin(): UseMutationHookResult<RemoveCompanyAdminInput, RemoveCompanyAdminResult> {
  return useMutation<RemoveCompanyAdminInput, RemoveCompanyAdminResult>((input) =>
    defaultApiClient.removeCompanyAdmin(input),
  );
}

export function useRemoveCompanyMember(): UseMutationHookResult<RemoveCompanyMemberInput, RemoveCompanyMemberResult> {
  return useMutation<RemoveCompanyMemberInput, RemoveCompanyMemberResult>((input) =>
    defaultApiClient.removeCompanyMember(input),
  );
}

export function useRemoveCompanyOwner(): UseMutationHookResult<RemoveCompanyOwnerInput, RemoveCompanyOwnerResult> {
  return useMutation<RemoveCompanyOwnerInput, RemoveCompanyOwnerResult>((input) =>
    defaultApiClient.removeCompanyOwner(input),
  );
}

export function useRemoveCompanyTrustedEmailDomain(): UseMutationHookResult<
  RemoveCompanyTrustedEmailDomainInput,
  RemoveCompanyTrustedEmailDomainResult
> {
  return useMutation<RemoveCompanyTrustedEmailDomainInput, RemoveCompanyTrustedEmailDomainResult>((input) =>
    defaultApiClient.removeCompanyTrustedEmailDomain(input),
  );
}

export function useRemoveGroupMember(): UseMutationHookResult<RemoveGroupMemberInput, RemoveGroupMemberResult> {
  return useMutation<RemoveGroupMemberInput, RemoveGroupMemberResult>((input) =>
    defaultApiClient.removeGroupMember(input),
  );
}

export function useRemoveKeyResource(): UseMutationHookResult<RemoveKeyResourceInput, RemoveKeyResourceResult> {
  return useMutation<RemoveKeyResourceInput, RemoveKeyResourceResult>((input) =>
    defaultApiClient.removeKeyResource(input),
  );
}

export function useRemoveProjectContributor(): UseMutationHookResult<
  RemoveProjectContributorInput,
  RemoveProjectContributorResult
> {
  return useMutation<RemoveProjectContributorInput, RemoveProjectContributorResult>((input) =>
    defaultApiClient.removeProjectContributor(input),
  );
}

export function useRemoveProjectMilestone(): UseMutationHookResult<
  RemoveProjectMilestoneInput,
  RemoveProjectMilestoneResult
> {
  return useMutation<RemoveProjectMilestoneInput, RemoveProjectMilestoneResult>((input) =>
    defaultApiClient.removeProjectMilestone(input),
  );
}

export function useRenameResourceHubFolder(): UseMutationHookResult<
  RenameResourceHubFolderInput,
  RenameResourceHubFolderResult
> {
  return useMutation<RenameResourceHubFolderInput, RenameResourceHubFolderResult>((input) =>
    defaultApiClient.renameResourceHubFolder(input),
  );
}

export function useReopenGoal(): UseMutationHookResult<ReopenGoalInput, ReopenGoalResult> {
  return useMutation<ReopenGoalInput, ReopenGoalResult>((input) => defaultApiClient.reopenGoal(input));
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

export function useRestoreCompanyMember(): UseMutationHookResult<
  RestoreCompanyMemberInput,
  RestoreCompanyMemberResult
> {
  return useMutation<RestoreCompanyMemberInput, RestoreCompanyMemberResult>((input) =>
    defaultApiClient.restoreCompanyMember(input),
  );
}

export function useResumeProject(): UseMutationHookResult<ResumeProjectInput, ResumeProjectResult> {
  return useMutation<ResumeProjectInput, ResumeProjectResult>((input) => defaultApiClient.resumeProject(input));
}

export function useSubscribeToNotifications(): UseMutationHookResult<
  SubscribeToNotificationsInput,
  SubscribeToNotificationsResult
> {
  return useMutation<SubscribeToNotificationsInput, SubscribeToNotificationsResult>((input) =>
    defaultApiClient.subscribeToNotifications(input),
  );
}

export function useUnsubscribeFromNotifications(): UseMutationHookResult<
  UnsubscribeFromNotificationsInput,
  UnsubscribeFromNotificationsResult
> {
  return useMutation<UnsubscribeFromNotificationsInput, UnsubscribeFromNotificationsResult>((input) =>
    defaultApiClient.unsubscribeFromNotifications(input),
  );
}

export function useUpdateMilestone(): UseMutationHookResult<UpdateMilestoneInput, UpdateMilestoneResult> {
  return useMutation<UpdateMilestoneInput, UpdateMilestoneResult>((input) => defaultApiClient.updateMilestone(input));
}

export function useUpdateMilestoneDescription(): UseMutationHookResult<
  UpdateMilestoneDescriptionInput,
  UpdateMilestoneDescriptionResult
> {
  return useMutation<UpdateMilestoneDescriptionInput, UpdateMilestoneDescriptionResult>((input) =>
    defaultApiClient.updateMilestoneDescription(input),
  );
}

export function useUpdateProfile(): UseMutationHookResult<UpdateProfileInput, UpdateProfileResult> {
  return useMutation<UpdateProfileInput, UpdateProfileResult>((input) => defaultApiClient.updateProfile(input));
}

export function useUpdateProjectContributor(): UseMutationHookResult<
  UpdateProjectContributorInput,
  UpdateProjectContributorResult
> {
  return useMutation<UpdateProjectContributorInput, UpdateProjectContributorResult>((input) =>
    defaultApiClient.updateProjectContributor(input),
  );
}

export function useUpdateProjectDescription(): UseMutationHookResult<
  UpdateProjectDescriptionInput,
  UpdateProjectDescriptionResult
> {
  return useMutation<UpdateProjectDescriptionInput, UpdateProjectDescriptionResult>((input) =>
    defaultApiClient.updateProjectDescription(input),
  );
}

export function useUpdateTask(): UseMutationHookResult<UpdateTaskInput, UpdateTaskResult> {
  return useMutation<UpdateTaskInput, UpdateTaskResult>((input) => defaultApiClient.updateTask(input));
}

export function useUpdateTaskStatus(): UseMutationHookResult<UpdateTaskStatusInput, UpdateTaskStatusResult> {
  return useMutation<UpdateTaskStatusInput, UpdateTaskStatusResult>((input) =>
    defaultApiClient.updateTaskStatus(input),
  );
}

export default {
  default: defaultApiClient,

  getAccount,
  useGetAccount,
  getActivities,
  useGetActivities,
  getActivity,
  useGetActivity,
  getAssignments,
  useGetAssignments,
  getAssignmentsCount,
  useGetAssignmentsCount,
  getBindedPeople,
  useGetBindedPeople,
  getComments,
  useGetComments,
  getCompanies,
  useGetCompanies,
  getCompany,
  useGetCompany,
  getDiscussion,
  useGetDiscussion,
  getDiscussions,
  useGetDiscussions,
  getGoal,
  useGetGoal,
  getGoalProgressUpdate,
  useGetGoalProgressUpdate,
  getGoalProgressUpdates,
  useGetGoalProgressUpdates,
  getGoals,
  useGetGoals,
  getInvitation,
  useGetInvitation,
  getKeyResource,
  useGetKeyResource,
  getMe,
  useGetMe,
  getMilestone,
  useGetMilestone,
  getNotifications,
  useGetNotifications,
  getPeople,
  useGetPeople,
  getPerson,
  useGetPerson,
  getProject,
  useGetProject,
  getProjectCheckIn,
  useGetProjectCheckIn,
  getProjectCheckIns,
  useGetProjectCheckIns,
  getProjectContributor,
  useGetProjectContributor,
  getProjectRetrospective,
  useGetProjectRetrospective,
  getProjects,
  useGetProjects,
  getResourceHub,
  useGetResourceHub,
  getResourceHubDocument,
  useGetResourceHubDocument,
  getResourceHubFile,
  useGetResourceHubFile,
  getResourceHubFolder,
  useGetResourceHubFolder,
  getResourceHubLink,
  useGetResourceHubLink,
  getSpace,
  useGetSpace,
  getSpaces,
  useGetSpaces,
  getTask,
  useGetTask,
  getTasks,
  useGetTasks,
  getUnreadNotificationCount,
  useGetUnreadNotificationCount,
  getWorkMap,
  useGetWorkMap,
  listGoalContributors,
  useListGoalContributors,
  listResourceHubNodes,
  useListResourceHubNodes,
  listSpaceTools,
  useListSpaceTools,
  runAiPrompt,
  useRunAiPrompt,
  searchPeople,
  useSearchPeople,
  searchPotentialSpaceMembers,
  useSearchPotentialSpaceMembers,
  searchProjectContributorCandidates,
  useSearchProjectContributorCandidates,
  acknowledgeGoalProgressUpdate,
  useAcknowledgeGoalProgressUpdate,
  acknowledgeProjectCheckIn,
  useAcknowledgeProjectCheckIn,
  addCompany,
  useAddCompany,
  addCompanyAdmins,
  useAddCompanyAdmins,
  addCompanyMember,
  useAddCompanyMember,
  addCompanyOwners,
  useAddCompanyOwners,
  addCompanyTrustedEmailDomain,
  useAddCompanyTrustedEmailDomain,
  addFirstCompany,
  useAddFirstCompany,
  addKeyResource,
  useAddKeyResource,
  addProjectContributor,
  useAddProjectContributor,
  addProjectContributors,
  useAddProjectContributors,
  addReaction,
  useAddReaction,
  addSpaceMembers,
  useAddSpaceMembers,
  archiveGoal,
  useArchiveGoal,
  archiveMessage,
  useArchiveMessage,
  archiveProject,
  useArchiveProject,
  changeGoalParent,
  useChangeGoalParent,
  changePassword,
  useChangePassword,
  changeTaskDescription,
  useChangeTaskDescription,
  closeGoal,
  useCloseGoal,
  closeProject,
  useCloseProject,
  connectGoalToProject,
  useConnectGoalToProject,
  copyResourceHubFolder,
  useCopyResourceHubFolder,
  createAccount,
  useCreateAccount,
  createBlob,
  useCreateBlob,
  createComment,
  useCreateComment,
  createEmailActivationCode,
  useCreateEmailActivationCode,
  createGoal,
  useCreateGoal,
  createGoalDiscussion,
  useCreateGoalDiscussion,
  createProject,
  useCreateProject,
  createResourceHub,
  useCreateResourceHub,
  createResourceHubDocument,
  useCreateResourceHubDocument,
  createResourceHubFile,
  useCreateResourceHubFile,
  createResourceHubFolder,
  useCreateResourceHubFolder,
  createResourceHubLink,
  useCreateResourceHubLink,
  createSpace,
  useCreateSpace,
  createTask,
  useCreateTask,
  deleteGoal,
  useDeleteGoal,
  deleteResourceHubDocument,
  useDeleteResourceHubDocument,
  deleteResourceHubFile,
  useDeleteResourceHubFile,
  deleteResourceHubFolder,
  useDeleteResourceHubFolder,
  deleteResourceHubLink,
  useDeleteResourceHubLink,
  disconnectGoalFromProject,
  useDisconnectGoalFromProject,
  editComment,
  useEditComment,
  editCompany,
  useEditCompany,
  editDiscussion,
  useEditDiscussion,
  editGoal,
  useEditGoal,
  editGoalDiscussion,
  useEditGoalDiscussion,
  editGoalProgressUpdate,
  useEditGoalProgressUpdate,
  editGoalTimeframe,
  useEditGoalTimeframe,
  editKeyResource,
  useEditKeyResource,
  editParentFolderInResourceHub,
  useEditParentFolderInResourceHub,
  editProjectCheckIn,
  useEditProjectCheckIn,
  editProjectName,
  useEditProjectName,
  editProjectPermissions,
  useEditProjectPermissions,
  editProjectRetrospective,
  useEditProjectRetrospective,
  editProjectTimeline,
  useEditProjectTimeline,
  editResourceHubDocument,
  useEditResourceHubDocument,
  editResourceHubFile,
  useEditResourceHubFile,
  editResourceHubLink,
  useEditResourceHubLink,
  editSpace,
  useEditSpace,
  editSpaceMembersPermissions,
  useEditSpaceMembersPermissions,
  editSpacePermissions,
  useEditSpacePermissions,
  editSubscriptionsList,
  useEditSubscriptionsList,
  joinCompany,
  useJoinCompany,
  joinSpace,
  useJoinSpace,
  markAllNotificationsAsRead,
  useMarkAllNotificationsAsRead,
  markNotificationAsRead,
  useMarkNotificationAsRead,
  markNotificationsAsRead,
  useMarkNotificationsAsRead,
  moveProjectToSpace,
  useMoveProjectToSpace,
  newInvitationToken,
  useNewInvitationToken,
  pauseProject,
  usePauseProject,
  postDiscussion,
  usePostDiscussion,
  postGoalProgressUpdate,
  usePostGoalProgressUpdate,
  postMilestoneComment,
  usePostMilestoneComment,
  postProjectCheckIn,
  usePostProjectCheckIn,
  publishDiscussion,
  usePublishDiscussion,
  publishResourceHubDocument,
  usePublishResourceHubDocument,
  removeCompanyAdmin,
  useRemoveCompanyAdmin,
  removeCompanyMember,
  useRemoveCompanyMember,
  removeCompanyOwner,
  useRemoveCompanyOwner,
  removeCompanyTrustedEmailDomain,
  useRemoveCompanyTrustedEmailDomain,
  removeGroupMember,
  useRemoveGroupMember,
  removeKeyResource,
  useRemoveKeyResource,
  removeProjectContributor,
  useRemoveProjectContributor,
  removeProjectMilestone,
  useRemoveProjectMilestone,
  renameResourceHubFolder,
  useRenameResourceHubFolder,
  reopenGoal,
  useReopenGoal,
  requestPasswordReset,
  useRequestPasswordReset,
  resetPassword,
  useResetPassword,
  restoreCompanyMember,
  useRestoreCompanyMember,
  resumeProject,
  useResumeProject,
  subscribeToNotifications,
  useSubscribeToNotifications,
  unsubscribeFromNotifications,
  useUnsubscribeFromNotifications,
  updateMilestone,
  useUpdateMilestone,
  updateMilestoneDescription,
  useUpdateMilestoneDescription,
  updateProfile,
  useUpdateProfile,
  updateProjectContributor,
  useUpdateProjectContributor,
  updateProjectDescription,
  useUpdateProjectDescription,
  updateTask,
  useUpdateTask,
  updateTaskStatus,
  useUpdateTaskStatus,

  goals: {
    updateName: (input: GoalsUpdateNameInput) => defaultApiClient.apiNamespaceGoals.updateName(input),
    useUpdateName: () =>
      useMutation<GoalsUpdateNameInput, GoalsUpdateNameResult>(defaultApiClient.apiNamespaceGoals.updateName),

    updateTargetIndex: (input: GoalsUpdateTargetIndexInput) =>
      defaultApiClient.apiNamespaceGoals.updateTargetIndex(input),
    useUpdateTargetIndex: () =>
      useMutation<GoalsUpdateTargetIndexInput, GoalsUpdateTargetIndexResult>(
        defaultApiClient.apiNamespaceGoals.updateTargetIndex,
      ),

    addTarget: (input: GoalsAddTargetInput) => defaultApiClient.apiNamespaceGoals.addTarget(input),
    useAddTarget: () =>
      useMutation<GoalsAddTargetInput, GoalsAddTargetResult>(defaultApiClient.apiNamespaceGoals.addTarget),

    updateTarget: (input: GoalsUpdateTargetInput) => defaultApiClient.apiNamespaceGoals.updateTarget(input),
    useUpdateTarget: () =>
      useMutation<GoalsUpdateTargetInput, GoalsUpdateTargetResult>(defaultApiClient.apiNamespaceGoals.updateTarget),

    deleteTarget: (input: GoalsDeleteTargetInput) => defaultApiClient.apiNamespaceGoals.deleteTarget(input),
    useDeleteTarget: () =>
      useMutation<GoalsDeleteTargetInput, GoalsDeleteTargetResult>(defaultApiClient.apiNamespaceGoals.deleteTarget),

    updateDueDate: (input: GoalsUpdateDueDateInput) => defaultApiClient.apiNamespaceGoals.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<GoalsUpdateDueDateInput, GoalsUpdateDueDateResult>(defaultApiClient.apiNamespaceGoals.updateDueDate),

    updateDescription: (input: GoalsUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceGoals.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<GoalsUpdateDescriptionInput, GoalsUpdateDescriptionResult>(
        defaultApiClient.apiNamespaceGoals.updateDescription,
      ),

    updateTargetValue: (input: GoalsUpdateTargetValueInput) =>
      defaultApiClient.apiNamespaceGoals.updateTargetValue(input),
    useUpdateTargetValue: () =>
      useMutation<GoalsUpdateTargetValueInput, GoalsUpdateTargetValueResult>(
        defaultApiClient.apiNamespaceGoals.updateTargetValue,
      ),
  },
};
