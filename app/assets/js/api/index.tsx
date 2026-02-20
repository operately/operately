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
  fullName: string;
  siteAdmin: boolean;
}

export interface Activity {
  id: string;
  scopeType?: string | null;
  scopeId?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
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

export interface ActivityContentCompanyMemberAdded {
  company: Company;
  person: Person | null;
  name: string;
}

export interface ActivityContentCompanyMemberConvertedToGuest {
  company: Company;
  person: Person | null;
}

export interface ActivityContentCompanyMemberRestoring {
  person?: Person | null;
}

export interface ActivityContentCompanyMembersPermissionsEdited {
  companyId: string;
  members: ActivityContentCompanyMembersPermissionsEditedMember[];
}

export interface ActivityContentCompanyMembersPermissionsEditedMember {
  personId: string;
  person: Person;
  previousAccessLevel: number;
  previousAccessLevelLabel: string;
  updatedAccessLevel: number;
  updatedAccessLevelLabel: string;
}

export interface ActivityContentCompanyOwnerRemoving {
  company: Company;
  person: Person | null;
}

export interface ActivityContentCompanyOwnersAdding {
  company?: Company | null;
  people?: ActivityContentCompanyOwnersAddingPerson[] | null;
}

export interface ActivityContentCompanyOwnersAddingPerson {
  person?: Person | null;
}

export interface ActivityContentDiscussionCommentSubmitted {
  discussion: Discussion | null;
  comment: Comment | null;
  space: Space;
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

export interface ActivityContentGoalChampionUpdating {
  company: Company;
  space: Space;
  goal: Goal;
  oldChampion: Person;
  newChampion: Person;
}

export interface ActivityContentGoalCheckAdding {
  company: Company;
  space: Space;
  goal: Goal;
  name: string;
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
  goal: Goal;
  update: GoalProgressUpdate | null;
  comment: Comment | null;
}

export interface ActivityContentGoalCheckInEdit {
  companyId?: string | null;
  goalId?: string | null;
  checkInId?: string | null;
}

export interface ActivityContentGoalCheckRemoving {
  company: Company;
  space: Space;
  goal: Goal;
  name: string;
}

export interface ActivityContentGoalCheckToggled {
  company: Company;
  space: Space;
  goal: Goal;
  name: string;
  completed: boolean;
}

export interface ActivityContentGoalClosing {
  successStatus: SuccessStatus;
  goal: Goal;
}

export interface ActivityContentGoalCreated {
  goal?: Goal | null;
}

export interface ActivityContentGoalDescriptionChanged {
  goal: Goal | null;
  goalName: string;
  hasDescription: boolean;
  oldDescription: string | null;
  newDescription: string | null;
}

export interface ActivityContentGoalDiscussionCreation {
  goal: Goal;
}

export interface ActivityContentGoalDiscussionEditing {
  companyId?: string | null;
  spaceId?: string | null;
  goalId?: string | null;
  activityId?: string | null;
}

export interface ActivityContentGoalDueDateUpdating {
  company: Company;
  space: Space;
  goal: Goal;
  oldDueDate: string | null;
  newDueDate: string | null;
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

export interface ActivityContentGoalNameUpdating {
  company: Company;
  space: Space;
  goal: Goal;
  oldName: string;
  newName: string;
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

export interface ActivityContentGoalReviewerUpdating {
  company: Company;
  space: Space;
  goal: Goal;
  oldReviewer: Person;
  newReviewer: Person;
}

export interface ActivityContentGoalSpaceUpdating {
  company: Company;
  space: Space;
  goal: Goal;
  oldSpace: Space;
}

export interface ActivityContentGoalStartDateUpdating {
  company: Company;
  space: Space;
  goal: Goal;
  oldStartDate: string | null;
  newStartDate: string | null;
}

export interface ActivityContentGoalTargetAdding {
  company: Company;
  space: Space;
  goal: Goal;
  targetName: string;
}

export interface ActivityContentGoalTargetDeleting {
  company: Company;
  space: Space;
  goal: Goal;
  targetName: string;
}

export interface ActivityContentGoalTargetUpdating {
  company: Company;
  space: Space;
  goal: Goal;
  targetName: string;
  oldValue: string;
  newValue: string;
  unit: string;
}

export interface ActivityContentGoalTimeframeEditing {
  goal?: Goal | null;
  oldTimeframe?: Timeframe | null;
  newTimeframe?: Timeframe | null;
}

export interface ActivityContentGroupEdited {
  company: Company;
  space: Space;
  oldName: string;
  newName: string;
  oldMission: string | null;
  newMission: string | null;
}

export interface ActivityContentGuestInvited {
  company: Company;
  person: Person;
}

export interface ActivityContentMessageArchiving {
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
  messageId?: string | null;
  title?: string | null;
}

export interface ActivityContentMilestoneDeleting {
  project: Project;
  milestoneName: string;
}

export interface ActivityContentMilestoneDescriptionUpdating {
  project: Project;
  milestone: Milestone | null;
  milestoneName: string;
  hasDescription: boolean;
  description: string | null;
}

export interface ActivityContentMilestoneDueDateUpdating {
  project: Project;
  milestone: Milestone | null;
  milestoneName: string;
  oldDueDate: ContextualDate;
  newDueDate: ContextualDate;
}

export interface ActivityContentMilestoneTitleUpdating {
  project: Project;
  milestone: Milestone | null;
  oldTitle: string;
  newTitle: string;
}

export interface ActivityContentProjectArchived {
  projectId?: string | null;
  project?: Project | null;
}

export interface ActivityContentProjectChampionUpdating {
  company: Company;
  space: Space;
  project: Project;
  oldChampion: Person;
  newChampion: Person;
}

export interface ActivityContentProjectCheckInAcknowledged {
  projectId?: string | null;
  checkInId?: string | null;
  project?: Project | null;
  checkIn?: ProjectCheckIn | null;
}

export interface ActivityContentProjectCheckInCommented {
  project: Project;
  checkIn: ProjectCheckIn;
  comment: Comment | null;
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

export interface ActivityContentProjectDescriptionChanged {
  project: Project;
  projectName: string;
  hasDescription: boolean;
  description: string | null;
}

export interface ActivityContentProjectDiscussionSubmitted {
  title: string | null;
  project: Project;
  discussion: CommentThread | null;
}

export interface ActivityContentProjectDueDateUpdating {
  company: Company;
  space: Space;
  project: Project;
  oldDueDate: string | null;
  newDueDate: string | null;
}

export interface ActivityContentProjectGoalConnection {
  project: Project;
  goal: Goal | null;
  goalName: string | null;
  previousGoal: Goal | null;
  previousGoalName: string | null;
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
  project: Project;
  milestone: Milestone | null;
  commentAction: string;
  comment: Comment;
}

export interface ActivityContentProjectMilestoneCreation {
  company: Company;
  space: Space;
  project: Project;
  milestone: Milestone | null;
  milestoneName: string;
}

export interface ActivityContentProjectMilestoneUpdating {
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
  company: Company;
  space: Space;
  project: Project;
  oldReviewer: Person;
  newReviewer: Person;
}

export interface ActivityContentProjectStartDateUpdating {
  company: Company;
  space: Space;
  project: Project;
  oldStartDate: string | null;
  newStartDate: string | null;
}

export interface ActivityContentProjectTaskCommented {
  project: Project;
  task: Task | null;
  comment: Comment | null;
}

export interface ActivityContentProjectTimelineEdited {
  project?: Project | null;
  oldStartDate?: string | null;
  newStartDate?: string | null;
  oldEndDate?: string | null;
  newEndDate?: string | null;
  newMilestones?: ActivityMilestone[] | null;
  updatedMilestones?: ActivityMilestone[] | null;
}

export interface ActivityContentResourceHubDocumentCommented {
  space: Space;
  document: ResourceHubDocument | null;
  comment: Comment | null;
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
  space: Space;
  file: ResourceHubFile | null;
  comment: Comment | null;
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
  space: Space;
  link: ResourceHubLink | null;
  comment: Comment | null;
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

export interface ActivityContentSpaceTaskCommented {
  space: Space;
  task: Task | null;
  comment: Comment | null;
}

export interface ActivityContentTaskAdding {
  space: Space;
  project: Project | null;
  milestone: Milestone | null;
  task: Task | null;
  taskName: string;
}

export interface ActivityContentTaskAssigneeAssignment {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  personId?: string | null;
}

export interface ActivityContentTaskAssigneeUpdating {
  space: Space;
  project: Project | null;
  task: Task | null;
  oldAssignee: Person;
  newAssignee: Person;
}

export interface ActivityContentTaskClosing {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
}

export interface ActivityContentTaskDeleting {
  company: Company;
  space: Space;
  project: Project | null;
  taskName: string;
}

export interface ActivityContentTaskDescriptionChange {
  task: Task | null;
  space: Space | null;
  projectName: string;
  hasDescription: boolean;
  description: string | null;
}

export interface ActivityContentTaskDueDateUpdating {
  space: Space;
  project: Project | null;
  task: Task | null;
  taskName: string | null;
  oldDueDate: ContextualDate;
  newDueDate: ContextualDate;
}

export interface ActivityContentTaskMilestoneUpdating {
  project: Project;
  task: Task | null;
  oldMilestone: Milestone | null;
  newMilestone: Milestone | null;
}

export interface ActivityContentTaskNameEditing {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface ActivityContentTaskNameUpdating {
  space: Space;
  project: Project | null;
  task: Task | null;
  oldName: string;
  newName: string;
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

export interface ActivityContentTaskStatusUpdating {
  space: Space;
  project: Project | null;
  task: Task | null;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  name: string;
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

export interface ActivityMilestone {
  id: string;
  title: string;
  deadlineAt: string;
}

export interface ActivityPermissions {
  canCommentOnThread?: boolean | null;
  canView?: boolean | null;
}

export interface AddMemberInput {
  id?: Id | null;
  accessLevel?: number | null;
}

export interface AgentConversation {
  id: Id;
  title: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentDef {
  definition: string;
  sandboxMode: boolean;
  planningInstructions: string;
  taskExecutionInstructions: string;
  dailyRun: boolean;
  verboseLogs: boolean;
  provider: string;
}

export interface AgentMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: AgentMessageSender;
  status: AgentMessageStatus;
}

export interface AgentRun {
  id: string;
  status: string;
  startedAt: string;
  sandboxMode: boolean;
  logs?: string;
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
}

export interface Company {
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

export interface CompanyPermissions {
  canView: boolean;
  isAdmin: boolean;
  canEditTrustedEmailDomains: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canCreateSpace: boolean;
  canManageAdmins: boolean;
  canManageOwners: boolean;
  canEditMembersAccessLevels: boolean;
}

export interface ContextualDate {
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
  id: string;
  name: string;
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

export interface EditCompanyMemberPermissionsInput {
  id: Id;
  accessLevel: AccessOptions;
}

export interface EditMemberPermissionsInput {
  id?: Id | null;
  accessLevel?: number | null;
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
  id: string;
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

export interface GoalDiscussion {
  id: Id;
  title: string;
  insertedAt: string;
  commentCount: number;
  author: Person;
  content: string;
}

export interface GoalEditingUpdatedTarget {
  id?: string | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface GoalPermissions {
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  hasFullAccess: boolean;
}

export interface GoalProgressUpdate {
  id: string;
  status?: string | null;
  message?: string | null;
  insertedAt?: string | null;
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
  id: Id;
  title: string;
  insertedAt: string;
  commentCount: number;
  author: Person;
  content: string;
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

export interface InviteLink {
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
  id: string;
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
  action: MilestoneCommentAction;
  comment: Comment;
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
  avatarBlobId?: string | null;
  email: string;
  type: string;
  description?: string | null;
  timezone?: string | null;
  sendDailySummary?: boolean | null;
  notifyOnMention?: boolean | null;
  notifyAboutAssignments?: boolean;
  suspended?: boolean | null;
  company?: Company | null;
  manager?: Person | null;
  reports?: Person[] | null;
  peers?: Person[] | null;
  accessLevel?: number | null;
  hasOpenInvitation?: boolean | null;
  inviteLink?: InviteLink | null;
  showDevBar?: boolean | null;
  permissions?: PersonPermissions | null;
  agentDef?: AgentDef;
}

export interface PersonPermissions {
  canEditProfile: boolean | null;
}

export interface Project {
  id: string;
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
  subscriptionList?: SubscriptionList | null;
  milestonesOrderingState?: string[] | null;
  taskStatuses?: TaskStatus[] | null;
  tasksKanbanState?: Json | null;
}

export interface ProjectCheckIn {
  id: string;
  status: ProjectCheckInStatus;
  insertedAt: string | null;
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
}

export interface ProjectContributor {
  id: string;
  responsibility: string | null;
  role: string | null;
  person?: Person | null;
  accessLevel: number | null;
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
  id: string;
  projectId: string;
  title: string;
  link: string;
  resourceType?: string;
}

export interface ProjectPermissions {
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  hasFullAccess: boolean;
}

export interface ProjectRetrospective {
  id: string;
  author: Person;
  project: Project;
  content: string;
  closedAt: string;
  permissions: ProjectPermissions;
  reactions: Reaction[];
  subscriptionList: SubscriptionList;
  potentialSubscribers: Subscriber[];
  notifications: Notification[];
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
  id: string;
  name: string;
  description?: string | null;
  space?: Space | null;
  nodes?: ResourceHubNode[] | null;
  potentialSubscribers?: Subscriber[] | null;
  permissions?: ResourceHubPermissions | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export interface ResourceHubDocument {
  id: string;
  author?: Person | null;
  resourceHubId: string;
  resourceHub?: ResourceHub | null;
  parentFolder?: ResourceHubFolder | null;
  parentFolderId: string;
  name: string;
  content: string;
  state: string;
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
  id: string;
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
  id: string;
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
  insertedAt?: string | null;
  updatedAt?: string | null;
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
}

export interface ReviewAssignmentOrigin {
  id: string;
  name: string;
  type: ReviewAssignmentOriginTypes;
  path: string;
  spaceName: string | null;
  dueDate: string | null;
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
  taskStatuses?: TaskStatus[] | null;
  tasksKanbanState?: Json | null;
}

export interface SpacePermissions {
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
  tasksEnabled: boolean;
  discussionsEnabled: boolean;
  resourceHubEnabled: boolean;
  projects: Project[] | null;
  goals: Goal[] | null;
  messagesBoards: MessagesBoard[] | null;
  resourceHubs: ResourceHub[] | null;
  tasks: Task[] | null;
}

export interface Subscriber {
  role?: string | null;
  priority?: boolean | null;
  isSubscribed?: boolean | null;
  person?: Person | null;
}

export interface Subscription {
  id: string;
  type: string;
  canceled: boolean;
  person: Person | null;
}

export interface SubscriptionList {
  id: string;
  parentType: SubscriptionParentType;
  sendToEveryone: boolean;
  subscriptions: Subscription[] | null;
}

export interface Target {
  id?: Id | null;
  index?: number | null;
  name?: string | null;
  from?: number | null;
  to?: number | null;
  unit?: string | null;
  value?: number | null;
}

export interface Task {
  id: string;
  name: string;
  insertedAt?: string | null;
  updatedAt?: string | null;
  dueDate?: ContextualDate | null;
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

export interface TaskStatus {
  id: string;
  label: string;
  color: ProjectTaskStatusColor;
  index: number;
  value: string;
  closed: boolean;
}

export interface Timeframe {
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
  tasksEnabled: boolean;
  discussionsEnabled: boolean;
  resourceHubEnabled: boolean;
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
  id: string;
  parentId: string | null;
  name: string;
  state: WorkMapItemState;
  status: WorkMapItemStatus;
  taskStatus: TaskStatus | null;
  progress: number;
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
  children: WorkMapItem[];
  type: WorkMapItemType;
  itemPath: string;
  privacy: WorkMapItemPrivacy;
  assignees?: Person[] | null;
}

export type ActivityContent =
  | ActivityContentCompanyOwnersAdding
  | ActivityContentCompanyAdminAdded
  | ActivityContentCompanyMembersPermissionsEdited
  | ActivityContentCompanyMemberAdded
  | ActivityContentCompanyMemberConvertedToGuest
  | ActivityContentGuestInvited
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
  | ActivityContentSpaceTaskCommented
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

export type AgentMessageSender = "user" | "ai";

export type AgentMessageStatus = "pending" | "done";

export type CommentParentType =
  | "project_check_in"
  | "project_retrospective"
  | "comment_thread"
  | "goal_update"
  | "message"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link"
  | "space_task"
  | "project_task"
  | "milestone";

export type ContextualDateType = "day" | "month" | "quarter" | "year";

export type CreateConversationContextType = "goal" | "project";

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

export type MilestoneStatus = "pending" | "done";

export type ProjectCheckInStatus = "on_track" | "caution" | "off_track";

export type ProjectTaskStatusColor = "gray" | "blue" | "green" | "red";

export type ReactionEntityType =
  | "project_check_in"
  | "project_retrospective"
  | "comment_thread"
  | "goal_update"
  | "message"
  | "comment"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link";

export type ReactionParentType =
  | "project_check_in"
  | "project_retrospective"
  | "comment_thread"
  | "goal_update"
  | "message"
  | "milestone"
  | "project_task"
  | "space_task"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link";

export type ResourceAccessTypes = "space" | "goal" | "project";

export type ReviewAssignmentOriginTypes = "project" | "goal" | "space";

export type ReviewAssignmentRoles = "owner" | "reviewer";

export type ReviewAssignmentTypes = "check_in" | "goal_update" | "space_task" | "project_task" | "milestone";

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
  | "project_task";

export type SuccessStatus = "achieved" | "missed";

export type TaskType = "space" | "project";

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

export interface AiGetAgentInput {
  id: Id;
}

export interface AiGetAgentResult {
  agent: Person;
}

export interface AiGetAgentRunInput {
  id: Id;
}

export interface AiGetAgentRunResult {
  run: AgentRun;
}

export interface AiGetConversationMessagesInput {
  convoId: string;
}

export interface AiGetConversationMessagesResult {
  messages: AgentMessage[];
}

export interface AiGetConversationsInput {
  contextId: Id;
  contextType: string;
}

export interface AiGetConversationsResult {
  conversations: AgentConversation[];
}

export interface AiListAgentRunsInput {
  agentId: Id;
}

export interface AiListAgentRunsResult {
  runs: AgentRun[];
}

export interface AiListAgentsInput {}

export interface AiListAgentsResult {
  agents: Person[];
}

export interface AiPromptInput {
  prompt: string;
}

export interface AiPromptResult {
  result: string;
}

export interface GetAccountInput {}

export interface GetAccountResult {
  account?: Account | null;
}

export interface GetActivitiesInput {
  scopeId: string;
  scopeType: ActivityScopeType;
  actions: string[];
}

export interface GetActivitiesResult {
  activities: Activity[];
}

export interface GetActivityInput {
  id?: string | null;
  includeUnreadGoalNotifications?: boolean | null;
  includeUnreadProjectNotifications?: boolean | null;
  includePermissions?: boolean | null;
  includeSubscriptionsList?: boolean | null;
  includePotentialSubscribers?: boolean | null;
}

export interface GetActivityResult {
  activity?: Activity | null;
}

export interface GetAssignmentsInput {}

export interface GetAssignmentsResult {
  assignments: ReviewAssignment[];
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
  entityId: Id;
  entityType: CommentParentType;
}

export interface GetCommentsResult {
  comments: Comment[];
}

export interface GetCompaniesInput {
  includeMemberCount?: boolean | null;
}

export interface GetCompaniesResult {
  companies?: Company[] | null;
}

export interface GetCompanyInput {
  id?: CompanyId;
  includePermissions?: boolean;
  includePeople?: boolean;
  includeAdmins?: boolean;
  includeOwners?: boolean;
  includeGeneralSpace?: boolean;
  includeMembersAccessLevels?: boolean;
}

export interface GetCompanyResult {
  company: Company;
}

export interface GetDiscussionInput {
  id: string;
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
  discussion: Discussion;
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

export interface GetFlatWorkMapInput {
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

export interface GetFlatWorkMapResult {
  workMap?: WorkMapItem[] | null;
}

export interface GetGoalInput {
  id: Id;
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
  includeRetrospective?: boolean | null;
  includeChecklist?: boolean;
  includeMarkdown?: boolean;
}

export interface GetGoalResult {
  goal: Goal;
  markdown?: string;
}

export interface GetGoalProgressUpdateInput {
  id: string;
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

export interface GetGoalProgressUpdateResult {
  update: GoalProgressUpdate;
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
  id: Id;
  includeComments?: boolean;
  includeProject?: boolean;
  includeCreator?: boolean;
  includePermissions?: boolean;
  includeSpace?: boolean;
  includeSubscriptionList?: boolean;
  includeAvailableStatuses?: boolean;
}

export interface GetMilestoneResult {
  milestone: Milestone;
}

export interface GetNotificationsInput {
  page?: number | null;
  perPage?: number | null;
}

export interface GetNotificationsResult {
  notifications?: Notification[] | null;
}

export interface GetPeopleInput {
  onlySuspended?: boolean;
  includeSuspended?: boolean;
  includeManager?: boolean;
  includeAccount?: boolean;
  includeInviteLink?: boolean;
  includeCompanyAccessLevels?: boolean;
}

export interface GetPeopleResult {
  people?: Person[] | null;
}

export interface GetPersonInput {
  id: Id;
  includeManager?: boolean;
  includeReports?: boolean;
  includePeers?: boolean;
  includePermissions?: boolean;
  includeAccount?: boolean;
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
  includeSubscriptionList?: boolean | null;
  includeMarkdown?: boolean;
}

export interface GetProjectResult {
  project: Project;
  markdown?: string;
}

export interface GetProjectCheckInInput {
  id: string;
  includeAuthor?: boolean;
  includeAcknowledgedBy?: boolean;
  includeProject?: boolean;
  includeSpace?: boolean;
  includeReactions?: boolean;
  includeSubscriptionsList?: boolean;
  includePotentialSubscribers?: boolean;
  includeUnreadNotifications?: boolean | null;
}

export interface GetProjectCheckInResult {
  projectCheckIn: ProjectCheckIn;
}

export interface GetProjectCheckInsInput {
  projectId: string;
  includeAuthor?: boolean;
  includeProject?: boolean;
  includeReactions?: boolean;
}

export interface GetProjectCheckInsResult {
  projectCheckIns?: ProjectCheckIn[] | null;
}

export interface GetProjectContributorInput {
  id: string;
  includeProject?: boolean;
  includePermissions?: boolean;
}

export interface GetProjectContributorResult {
  contributor: ProjectContributor;
}

export interface GetProjectRetrospectiveInput {
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

export interface GetProjectRetrospectiveResult {
  retrospective: ProjectRetrospective;
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
  id: Id;
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
  document: ResourceHubDocument;
}

export interface GetResourceHubFileInput {
  id: Id;
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
  file: ResourceHubFile;
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
  id: Id;
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
  link: ResourceHubLink;
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
  accessLevel?: AccessOptions;
  includeAccessLevels?: boolean;
  includeMembers?: boolean;
}

export interface GetSpacesResult {
  spaces?: Space[] | null;
}

export interface GetTaskInput {
  id: Id;
  includeAssignees?: boolean;
  includeMilestone?: boolean;
  includeProject?: boolean;
  includeCreator?: boolean;
  includeProjectSpace?: boolean;
  includePermissions?: boolean;
  includeSubscriptionList?: boolean;
  includeAvailableStatuses?: boolean;
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

export interface GetThemeInput {}

export interface GetThemeResult {
  theme: AccountTheme;
}

export interface GetUnreadNotificationCountInput {}

export interface GetUnreadNotificationCountResult {
  unread?: number | null;
}

export interface GetWorkMapInput {
  spaceId?: Id | null;
  parentGoalId?: Id | null;
  championId?: Id | null;
  reviewerId?: Id | null;
  contributorId?: Id | null;
  onlyCompleted?: boolean | null;
  includeAssignees?: boolean | null;
  includeReviewer?: boolean | null;
}

export interface GetWorkMapResult {
  workMap?: WorkMapItem[] | null;
}

export interface GlobalSearchInput {
  query: string;
}

export interface GlobalSearchResult {
  projects: Project[];
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  people: Person[];
}

export interface GoalsGetCheckInsInput {
  goalId: Id;
}

export interface GoalsGetCheckInsResult {
  checkIns?: GoalProgressUpdate[] | null;
}

export interface GoalsGetDiscussionsInput {
  goalId: Id;
}

export interface GoalsGetDiscussionsResult {
  discussions: Discussion[] | null;
}

export interface GoalsListAccessMembersInput {
  goalId: Id;
}

export interface GoalsListAccessMembersResult {
  people: Person[] | null;
}

export interface GoalsParentGoalSearchInput {
  query: string;
  goalId: Id;
}

export interface GoalsParentGoalSearchResult {
  goals: Goal[];
}

export interface InvitationsGetInvitationInput {
  token: string;
}

export interface InvitationsGetInvitationResult {
  inviteLink: InviteLink;
  member: Person;
}

export interface InvitationsGetInviteLinkByTokenInput {
  token: string;
}

export interface InvitationsGetInviteLinkByTokenResult {
  inviteLink?: InviteLink | null;
}

export interface IsSubscribedToResourceInput {
  resourceId: Id;
  resourceType: SubscriptionParentType;
}

export interface IsSubscribedToResourceResult {
  subscribed: boolean;
}

export interface ListGoalContributorsInput {
  goalId?: Id | null;
}

export interface ListGoalContributorsResult {
  contributors?: Person[] | null;
}

export interface ListPossibleManagersInput {
  userId?: Id;
  query?: string | null;
}

export interface ListPossibleManagersResult {
  people: Person[];
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
  spaceId: Id;
}

export interface ListSpaceToolsResult {
  tools: SpaceTools;
}

export interface ListTaskAssignablePeopleInput {
  id: Id;
  type: TaskType;
  query?: string | null;
  ignoredIds?: Id[] | null;
}

export interface ListTaskAssignablePeopleResult {
  people: Person[] | null;
}

export interface ProjectDiscussionsGetInput {
  id: Id;
  includeUnreadNotifications?: boolean;
  includePermissions?: boolean;
  includeSubscriptionsList?: boolean;
  includePotentialSubscribers?: boolean;
  includeUnreadProjectNotifications?: boolean;
  includeProject?: boolean;
  includeSpace?: boolean;
}

export interface ProjectDiscussionsGetResult {
  discussion: CommentThread;
}

export interface ProjectDiscussionsListInput {
  projectId: Id;
}

export interface ProjectDiscussionsListResult {
  discussions: CommentThread[];
}

export interface ProjectMilestonesListTasksInput {
  milestoneId: Id;
}

export interface ProjectMilestonesListTasksResult {
  tasks: Task[];
}

export interface ProjectsCountChildrenInput {
  id: Id;
  useTaskId?: boolean;
  useMilestoneId?: boolean;
}

export interface ProjectsCountChildrenResult {
  childrenCount: ProjectChildrenCount;
}

export interface ProjectsGetContributorsInput {
  projectId: Id;
  query?: string | null;
  ignoredIds?: Id[] | null;
}

export interface ProjectsGetContributorsResult {
  contributors: Person[] | null;
}

export interface ProjectsGetMilestonesInput {
  projectId: Id;
  query?: string;
}

export interface ProjectsGetMilestonesResult {
  milestones: Milestone[] | null;
}

export interface ProjectsParentGoalSearchInput {
  query: string;
  projectId: Id;
}

export interface ProjectsParentGoalSearchResult {
  goals: Goal[];
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

export interface SpacesCountByAccessLevelInput {
  accessLevel: AccessOptions;
}

export interface SpacesCountByAccessLevelResult {
  count: number;
}

export interface SpacesListMembersInput {
  spaceId: Id;
  query?: string | null;
  ignoredIds?: Id[] | null;
}

export interface SpacesListMembersResult {
  people: Person[] | null;
}

export interface SpacesListTasksInput {
  spaceId: Id;
}

export interface SpacesListTasksResult {
  tasks: Task[];
}

export interface SpacesSearchInput {
  query: string;
  accessLevel?: AccessOptions;
}

export interface SpacesSearchResult {
  spaces: Space[];
}

export interface TasksListInput {
  projectId: Id;
}

export interface TasksListResult {
  tasks: Task[];
}

export interface AcknowledgeGoalProgressUpdateInput {
  id?: string | null;
}

export interface AcknowledgeGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface AcknowledgeProjectCheckInInput {
  id: Id;
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
  fullName: string;
  email: string;
  title: string;
}

export interface AddCompanyMemberResult {
  inviteLink: InviteLink;
  newAccount: boolean;
  personId?: string | null;
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
  projectId: Id;
  title: string;
  link: string;
  resourceType?: string;
}

export interface AddKeyResourceResult {
  keyResource: ProjectKeyResource;
}

export interface AddProjectContributorInput {
  projectId: Id;
  personId: Id;
  responsibility: string;
  permissions: AccessOptions;
  role: string | null;
}

export interface AddProjectContributorResult {
  projectContributor?: ProjectContributor | null;
}

export interface AddProjectContributorsInput {
  projectId: string;
  contributors: ProjectContributorInput[];
}

export interface AddProjectContributorsResult {
  success: boolean;
}

export interface AddReactionInput {
  entityId: Id;
  entityType: ReactionEntityType;
  parentType?: ReactionParentType;
  emoji: string;
}

export interface AddReactionResult {
  reaction: Reaction;
}

export interface AddSpaceMembersInput {
  spaceId: Id;
  members: AddMemberInput[];
}

export interface AddSpaceMembersResult {
  success: boolean;
}

export interface AiAddAgentInput {
  title: string;
  fullName: string;
}

export interface AiAddAgentResult {
  success: boolean;
}

export interface AiCreateConversationInput {
  actionId: string;
  contextType: CreateConversationContextType;
  contextId: Id;
}

export interface AiCreateConversationResult {
  success: boolean;
  conversation: AgentConversation;
}

export interface AiEditAgentDailyRunInput {
  id: Id;
  enabled: boolean;
}

export interface AiEditAgentDailyRunResult {
  success: boolean;
}

export interface AiEditAgentDefinitionInput {
  id: Id;
  definition: string;
}

export interface AiEditAgentDefinitionResult {
  success: boolean;
}

export interface AiEditAgentPlanningInstructionsInput {
  id: Id;
  instructions: string;
}

export interface AiEditAgentPlanningInstructionsResult {
  success: boolean;
}

export interface AiEditAgentProviderInput {
  id: Id;
  provider: string;
}

export interface AiEditAgentProviderResult {
  success: boolean;
}

export interface AiEditAgentSandboxModeInput {
  id: Id;
  mode: boolean;
}

export interface AiEditAgentSandboxModeResult {
  success: boolean;
}

export interface AiEditAgentTaskExecutionInstructionsInput {
  id: Id;
  instructions: string;
}

export interface AiEditAgentTaskExecutionInstructionsResult {
  success: boolean;
}

export interface AiEditAgentVerbosityInput {
  id: Id;
  verbose: boolean;
}

export interface AiEditAgentVerbosityResult {
  success: boolean;
}

export interface AiRunAgentInput {
  id: Id;
}

export interface AiRunAgentResult {
  run: AgentRun;
}

export interface AiSendMessageInput {
  conversationId: Id;
  message: string;
}

export interface AiSendMessageResult {
  success: boolean;
  message: AgentMessage;
}

export interface ArchiveMessageInput {
  messageId?: Id | null;
}

export interface ArchiveMessageResult {}

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

export interface CloseGoalInput {
  goalId: Id;
  success: string;
  retrospective: string;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
  successStatus: string;
}

export interface CloseGoalResult {
  goal: Goal;
}

export interface CloseProjectInput {
  projectId: Id;
  retrospective: string;
  successStatus: string;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
}

export interface CloseProjectResult {
  retrospective: ProjectRetrospective;
}

export interface CompleteCompanySetupInput {
  spaces: SpaceSetupInput[];
}

export interface CompleteCompanySetupResult {}

export interface ConvertCompanyMemberToGuestInput {
  personId: Id;
}

export interface ConvertCompanyMemberToGuestResult {
  person: Person;
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

export interface CreateCommentInput {
  entityId: Id;
  entityType: CommentParentType;
  content: string;
}

export interface CreateCommentResult {
  comment: Comment;
}

export interface CreateEmailActivationCodeInput {
  email?: string | null;
}

export interface CreateEmailActivationCodeResult {}

export interface CreateGoalInput {
  spaceId: Id;
  name: string;
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
  spaceId: Id;
  name: string;
  championId?: Id | null;
  reviewerId?: Id | null;
  goalId?: Id | null;
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

export interface DeleteCommentInput {
  commentId: Id;
  parentType: CommentParentType;
}

export interface DeleteCommentResult {
  comment: Comment;
}

export interface DeleteCompanyInput {}

export interface DeleteCompanyResult {
  success: boolean;
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

export interface DeleteSpaceInput {
  spaceId: Id;
}

export interface DeleteSpaceResult {
  space: Space;
}

export interface EditCommentInput {
  content: string;
  commentId: Id;
  parentType: CommentParentType;
}

export interface EditCommentResult {
  comment: Comment;
}

export interface EditCompanyInput {
  name?: string | null;
}

export interface EditCompanyResult {
  company?: Company | null;
}

export interface EditCompanyMembersPermissionsInput {
  members: EditCompanyMemberPermissionsInput[];
}

export interface EditCompanyMembersPermissionsResult {
  success: boolean;
}

export interface EditDiscussionInput {
  id: Id;
  title?: string | null;
  body?: string | null;
  state?: string | null;
}

export interface EditDiscussionResult {
  discussion: Discussion;
}

export interface EditGoalDiscussionInput {
  activityId?: Id | null;
  title?: string | null;
  message?: string | null;
}

export interface EditGoalDiscussionResult {}

export interface EditGoalProgressUpdateInput {
  id: Id;
  dueDate: ContextualDate | null;
  status?: string | null;
  content?: Json | null;
  newTargetValues?: string | null;
  checklist?: GoalCheckUpdate[];
}

export interface EditGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface EditKeyResourceInput {
  id: string;
  title: string;
  link: string;
}

export interface EditKeyResourceResult {
  keyResource: ProjectKeyResource;
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
  id: Id;
  content: string;
  successStatus: string;
}

export interface EditProjectRetrospectiveResult {
  retrospective: ProjectRetrospective;
}

export interface EditResourceHubDocumentInput {
  documentId: Id;
  name: string;
  content: Json;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
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
  id: Id;
  name: string;
  mission: string;
}

export interface EditSpaceResult {
  space: Space;
}

export interface EditSpaceMembersPermissionsInput {
  spaceId: Id;
  members: EditMemberPermissionsInput[];
}

export interface EditSpaceMembersPermissionsResult {
  success: boolean;
}

export interface EditSpacePermissionsInput {
  spaceId: string;
  accessLevels: AccessLevels;
}

export interface EditSpacePermissionsResult {
  success: boolean;
}

export interface EditSubscriptionsListInput {
  id?: string | null;
  type?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface EditSubscriptionsListResult {}

export interface GoalsAddAccessMembersInput {
  goalId: Id;
  members: AddMemberInput[];
}

export interface GoalsAddAccessMembersResult {
  success: boolean | null;
}

export interface GoalsAddCheckInput {
  goalId: Id;
  name: string;
}

export interface GoalsAddCheckResult {
  checkId: Id;
  success: boolean;
}

export interface GoalsAddTargetInput {
  goalId: Id;
  name: string;
  startValue: number;
  targetValue: number;
  unit: string;
}

export interface GoalsAddTargetResult {
  targetId: Id | null;
  success: boolean | null;
}

export interface GoalsDeleteCheckInput {
  goalId: Id;
  checkId: Id;
}

export interface GoalsDeleteCheckResult {
  success: boolean;
}

export interface GoalsDeleteTargetInput {
  goalId: Id;
  targetId: Id;
}

export interface GoalsDeleteTargetResult {
  success: boolean | null;
}

export interface GoalsRemoveAccessMemberInput {
  goalId: Id;
  personId: Id;
}

export interface GoalsRemoveAccessMemberResult {
  success: boolean | null;
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
  success: boolean | null;
}

export interface GoalsUpdateAccessMemberInput {
  goalId: Id;
  personId: Id;
  accessLevel: number;
}

export interface GoalsUpdateAccessMemberResult {
  success: boolean | null;
}

export interface GoalsUpdateChampionInput {
  goalId: Id;
  championId: Id | null;
}

export interface GoalsUpdateChampionResult {
  success: boolean | null;
}

export interface GoalsUpdateCheckInput {
  goalId: Id;
  checkId: Id;
  name: string;
}

export interface GoalsUpdateCheckResult {
  success: boolean;
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
  success: boolean | null;
}

export interface GoalsUpdateDueDateInput {
  goalId: Id;
  dueDate: ContextualDate | null;
}

export interface GoalsUpdateDueDateResult {
  success: boolean | null;
}

export interface GoalsUpdateNameInput {
  goalId: Id;
  name: string;
}

export interface GoalsUpdateNameResult {
  success: boolean | null;
}

export interface GoalsUpdateParentGoalInput {
  goalId: Id;
  parentGoalId: Id | null;
}

export interface GoalsUpdateParentGoalResult {
  success: boolean | null;
}

export interface GoalsUpdateReviewerInput {
  goalId: Id;
  reviewerId: Id | null;
}

export interface GoalsUpdateReviewerResult {
  success: boolean | null;
}

export interface GoalsUpdateSpaceInput {
  goalId: Id;
  spaceId: Id;
}

export interface GoalsUpdateSpaceResult {
  success: boolean | null;
}

export interface GoalsUpdateStartDateInput {
  goalId: Id;
  startDate: ContextualDate | null;
}

export interface GoalsUpdateStartDateResult {
  success: boolean | null;
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
  success: boolean | null;
}

export interface GoalsUpdateTargetIndexInput {
  goalId: Id;
  targetId: Id;
  index: number;
}

export interface GoalsUpdateTargetIndexResult {
  success: boolean | null;
}

export interface GoalsUpdateTargetValueInput {
  goalId: Id;
  targetId: Id;
  value: number;
}

export interface GoalsUpdateTargetValueResult {
  success: boolean | null;
}

export interface GrantResourceAccessInput {
  personId: string;
  resources: ResourceAccessInput[];
}

export interface GrantResourceAccessResult {
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

export interface InviteGuestInput {
  fullName: string;
  email: string;
  title: string;
}

export interface InviteGuestResult {
  inviteLink?: InviteLink | null;
  newAccount: boolean;
  personId?: string | null;
}

export interface JoinCompanyInput {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface JoinCompanyResult {
  result: string;
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

export interface PauseProjectInput {
  projectId?: string | null;
}

export interface PauseProjectResult {
  project?: Project | null;
}

export interface PostDiscussionInput {
  spaceId: Id;
  title: string;
  body?: string | null;
  postAsDraft?: boolean | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface PostDiscussionResult {
  discussion: Discussion;
}

export interface PostGoalProgressUpdateInput {
  goalId: Id;
  status: string;
  dueDate: ContextualDate | null;
  checklist: GoalCheckUpdate[];
  content?: Json | null;
  newTargetValues?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface PostGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface PostMilestoneCommentInput {
  milestoneId: Id;
  content: Json | null;
  action: string;
}

export interface PostMilestoneCommentResult {
  comment: MilestoneComment;
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

export interface ProjectDiscussionsCreateInput {
  projectId: Id;
  title: string;
  message: Json;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
}

export interface ProjectDiscussionsCreateResult {
  discussion: CommentThread;
}

export interface ProjectDiscussionsEditInput {
  id: Id;
  title: string;
  message: Json;
  subscriberIds?: Id[];
}

export interface ProjectDiscussionsEditResult {
  discussion: Update;
}

export interface ProjectMilestonesDeleteInput {
  milestoneId: Id;
}

export interface ProjectMilestonesDeleteResult {
  success: boolean;
}

export interface ProjectMilestonesUpdateDescriptionInput {
  milestoneId: Id;
  description: Json;
}

export interface ProjectMilestonesUpdateDescriptionResult {
  milestone: Milestone;
}

export interface ProjectMilestonesUpdateDueDateInput {
  milestoneId: Id;
  dueDate: ContextualDate | null;
}

export interface ProjectMilestonesUpdateDueDateResult {
  milestone: Milestone;
}

export interface ProjectMilestonesUpdateKanbanInput {
  milestoneId: Id;
  taskId: Id;
  status: TaskStatus;
  kanbanState: Json;
}

export interface ProjectMilestonesUpdateKanbanResult {
  task: Task;
}

export interface ProjectMilestonesUpdateOrderingInput {
  projectId: Id;
  orderingState: string[];
}

export interface ProjectMilestonesUpdateOrderingResult {
  project: Project;
}

export interface ProjectMilestonesUpdateTitleInput {
  milestoneId: Id;
  title: string;
}

export interface ProjectMilestonesUpdateTitleResult {
  milestone: Milestone;
}

export interface ProjectsCreateMilestoneInput {
  projectId: Id;
  name: string;
  dueDate: ContextualDate | null;
}

export interface ProjectsCreateMilestoneResult {
  milestone: Milestone;
}

export interface ProjectsDeleteInput {
  projectId: Id;
}

export interface ProjectsDeleteResult {
  project: Project;
}

export interface ProjectsUpdateChampionInput {
  projectId: Id;
  championId: Id | null;
}

export interface ProjectsUpdateChampionResult {
  success: boolean | null;
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

export interface ProjectsUpdateParentGoalInput {
  projectId: Id;
  goalId: Id | null;
  goalName: string | null;
}

export interface ProjectsUpdateParentGoalResult {
  success: boolean | null;
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

export interface PublishDiscussionInput {
  id?: Id | null;
}

export interface PublishDiscussionResult {
  discussion?: Discussion | null;
}

export interface PublishResourceHubDocumentInput {
  documentId: Id;
  name?: string | null;
  content?: Json | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
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
  personId: string;
}

export interface RemoveCompanyMemberResult {
  person: Person;
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
  groupId: Id;
  memberId: Id;
}

export interface RemoveGroupMemberResult {}

export interface RemoveKeyResourceInput {
  id: string;
}

export interface RemoveKeyResourceResult {
  keyResource: ProjectKeyResource;
}

export interface RemoveProjectContributorInput {
  contribId?: string | null;
}

export interface RemoveProjectContributorResult {
  projectContributor?: ProjectContributor | null;
}

export interface RemoveReactionInput {
  reactionId: Id;
}

export interface RemoveReactionResult {
  success: boolean;
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
  projectId: Id;
  message: Json;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface ResumeProjectResult {
  project: Project;
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

export interface SpacesUpdateTaskStatusesInput {
  spaceId: Id;
  taskStatuses: TaskStatus[];
  deletedStatusReplacements?: DeletedStatusReplacement[] | null;
}

export interface SpacesUpdateTaskStatusesResult {
  success: boolean | null;
}

export interface SpacesUpdateToolsInput {
  spaceId: Id;
  tools: UpdateSpaceToolsPayload;
}

export interface SpacesUpdateToolsResult {
  success: boolean | null;
  tools: SpaceTools | null;
}

export interface SubscribeToNotificationsInput {
  id: Id;
  type: SubscriptionParentType;
}

export interface SubscribeToNotificationsResult {}

export interface TasksCreateInput {
  type: TaskType;
  id: Id;
  milestoneId?: Id | null;
  name: string;
  assigneeId: Id | null;
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

export interface TasksUpdateAssigneeInput {
  taskId: Id;
  assigneeId: Id | null;
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
  milestonesOrderingState: EditMilestoneOrderingStateInput[];
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

export interface TasksUpdateStatusInput {
  taskId: Id;
  status: TaskStatus | null;
  type: TaskType;
}

export interface TasksUpdateStatusResult {
  task: Task;
  updatedMilestone: Milestone | null;
}

export interface UnsubscribeFromNotificationsInput {
  id: Id;
}

export interface UnsubscribeFromNotificationsResult {}

export interface UpdateProfileInput {
  id?: string | null;
  fullName?: string | null;
  title?: string | null;
  timezone?: string | null;
  managerId?: string | null;
  theme?: string | null;
  notifyAboutAssignments?: boolean;
  description?: Json | null;
}

export interface UpdateProfileResult {
  person?: Person | null;
}

export interface UpdateProfilePictureInput {
  personId: string;
  avatarBlobId?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfilePictureResult {
  person: Person | null;
}

export interface UpdateProjectContributorInput {
  contribId: string;
  personId?: Id | null;
  responsibility?: string | null;
  permissions?: AccessOptions | null;
  role?: string | null;
}

export interface UpdateProjectContributorResult {
  contributor: ProjectContributor;
}

export interface UpdateProjectDescriptionInput {
  projectId: Id;
  description: Json;
}

export interface UpdateProjectDescriptionResult {
  project: Project;
}

export interface UpdateThemeInput {
  theme: AccountTheme;
}

export interface UpdateThemeResult {
  success: boolean;
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

  async getFlatWorkMap(input: GetFlatWorkMapInput): Promise<GetFlatWorkMapResult> {
    return this.client.get("/get_flat_work_map", input);
  }

  async getGoal(input: GetGoalInput): Promise<GetGoalResult> {
    return this.client.get("/get_goal", input);
  }

  async getGoalProgressUpdate(input: GetGoalProgressUpdateInput): Promise<GetGoalProgressUpdateResult> {
    return this.client.get("/get_goal_progress_update", input);
  }

  async getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
    return this.client.get("/get_goals", input);
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

  async getTheme(input: GetThemeInput): Promise<GetThemeResult> {
    return this.client.get("/get_theme", input);
  }

  async getUnreadNotificationCount(input: GetUnreadNotificationCountInput): Promise<GetUnreadNotificationCountResult> {
    return this.client.get("/get_unread_notification_count", input);
  }

  async getWorkMap(input: GetWorkMapInput): Promise<GetWorkMapResult> {
    return this.client.get("/get_work_map", input);
  }

  async globalSearch(input: GlobalSearchInput): Promise<GlobalSearchResult> {
    return this.client.get("/global_search", input);
  }

  async isSubscribedToResource(input: IsSubscribedToResourceInput): Promise<IsSubscribedToResourceResult> {
    return this.client.get("/is_subscribed_to_resource", input);
  }

  async listGoalContributors(input: ListGoalContributorsInput): Promise<ListGoalContributorsResult> {
    return this.client.get("/list_goal_contributors", input);
  }

  async listPossibleManagers(input: ListPossibleManagersInput): Promise<ListPossibleManagersResult> {
    return this.client.get("/list_possible_managers", input);
  }

  async listResourceHubNodes(input: ListResourceHubNodesInput): Promise<ListResourceHubNodesResult> {
    return this.client.get("/list_resource_hub_nodes", input);
  }

  async listSpaceTools(input: ListSpaceToolsInput): Promise<ListSpaceToolsResult> {
    return this.client.get("/list_space_tools", input);
  }

  async listTaskAssignablePeople(input: ListTaskAssignablePeopleInput): Promise<ListTaskAssignablePeopleResult> {
    return this.client.get("/list_task_assignable_people", input);
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

  async archiveMessage(input: ArchiveMessageInput): Promise<ArchiveMessageResult> {
    return this.client.post("/archive_message", input);
  }

  async changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
    return this.client.post("/change_goal_parent", input);
  }

  async changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    return this.client.post("/change_password", input);
  }

  async closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
    return this.client.post("/close_goal", input);
  }

  async closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
    return this.client.post("/close_project", input);
  }

  async completeCompanySetup(input: CompleteCompanySetupInput): Promise<CompleteCompanySetupResult> {
    return this.client.post("/complete_company_setup", input);
  }

  async convertCompanyMemberToGuest(
    input: ConvertCompanyMemberToGuestInput,
  ): Promise<ConvertCompanyMemberToGuestResult> {
    return this.client.post("/convert_company_member_to_guest", input);
  }

  async copyResourceHubFolder(input: CopyResourceHubFolderInput): Promise<CopyResourceHubFolderResult> {
    return this.client.post("/copy_resource_hub_folder", input);
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

  async deleteComment(input: DeleteCommentInput): Promise<DeleteCommentResult> {
    return this.client.post("/delete_comment", input);
  }

  async deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
    return this.client.post("/delete_company", input);
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

  async deleteSpace(input: DeleteSpaceInput): Promise<DeleteSpaceResult> {
    return this.client.post("/delete_space", input);
  }

  async editComment(input: EditCommentInput): Promise<EditCommentResult> {
    return this.client.post("/edit_comment", input);
  }

  async editCompany(input: EditCompanyInput): Promise<EditCompanyResult> {
    return this.client.post("/edit_company", input);
  }

  async editCompanyMembersPermissions(
    input: EditCompanyMembersPermissionsInput,
  ): Promise<EditCompanyMembersPermissionsResult> {
    return this.client.post("/edit_company_members_permissions", input);
  }

  async editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
    return this.client.post("/edit_discussion", input);
  }

  async editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return this.client.post("/edit_goal_discussion", input);
  }

  async editGoalProgressUpdate(input: EditGoalProgressUpdateInput): Promise<EditGoalProgressUpdateResult> {
    return this.client.post("/edit_goal_progress_update", input);
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

  async grantResourceAccess(input: GrantResourceAccessInput): Promise<GrantResourceAccessResult> {
    return this.client.post("/grant_resource_access", input);
  }

  async inviteGuest(input: InviteGuestInput): Promise<InviteGuestResult> {
    return this.client.post("/invite_guest", input);
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

  async removeReaction(input: RemoveReactionInput): Promise<RemoveReactionResult> {
    return this.client.post("/remove_reaction", input);
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

  async updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    return this.client.post("/update_profile", input);
  }

  async updateProfilePicture(input: UpdateProfilePictureInput): Promise<UpdateProfilePictureResult> {
    return this.client.post("/update_profile_picture", input);
  }

  async updateProjectContributor(input: UpdateProjectContributorInput): Promise<UpdateProjectContributorResult> {
    return this.client.post("/update_project_contributor", input);
  }

  async updateProjectDescription(input: UpdateProjectDescriptionInput): Promise<UpdateProjectDescriptionResult> {
    return this.client.post("/update_project_description", input);
  }

  async updateTheme(input: UpdateThemeInput): Promise<UpdateThemeResult> {
    return this.client.post("/update_theme", input);
  }
}

class ApiNamespaceInvitations {
  constructor(private client: ApiClient) {}

  async getInvitation(input: InvitationsGetInvitationInput): Promise<InvitationsGetInvitationResult> {
    return this.client.get("/invitations/get_invitation", input);
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

class ApiNamespaceSpaces {
  constructor(private client: ApiClient) {}

  async countByAccessLevel(input: SpacesCountByAccessLevelInput): Promise<SpacesCountByAccessLevelResult> {
    return this.client.get("/spaces/count_by_access_level", input);
  }

  async listMembers(input: SpacesListMembersInput): Promise<SpacesListMembersResult> {
    return this.client.get("/spaces/list_members", input);
  }

  async listTasks(input: SpacesListTasksInput): Promise<SpacesListTasksResult> {
    return this.client.get("/spaces/list_tasks", input);
  }

  async search(input: SpacesSearchInput): Promise<SpacesSearchResult> {
    return this.client.get("/spaces/search", input);
  }

  async updateKanban(input: SpacesUpdateKanbanInput): Promise<SpacesUpdateKanbanResult> {
    return this.client.post("/spaces/update_kanban", input);
  }

  async updateTaskStatuses(input: SpacesUpdateTaskStatusesInput): Promise<SpacesUpdateTaskStatusesResult> {
    return this.client.post("/spaces/update_task_statuses", input);
  }

  async updateTools(input: SpacesUpdateToolsInput): Promise<SpacesUpdateToolsResult> {
    return this.client.post("/spaces/update_tools", input);
  }
}

class ApiNamespaceProjectDiscussions {
  constructor(private client: ApiClient) {}

  async get(input: ProjectDiscussionsGetInput): Promise<ProjectDiscussionsGetResult> {
    return this.client.get("/project_discussions/get", input);
  }

  async list(input: ProjectDiscussionsListInput): Promise<ProjectDiscussionsListResult> {
    return this.client.get("/project_discussions/list", input);
  }

  async create(input: ProjectDiscussionsCreateInput): Promise<ProjectDiscussionsCreateResult> {
    return this.client.post("/project_discussions/create", input);
  }

  async edit(input: ProjectDiscussionsEditInput): Promise<ProjectDiscussionsEditResult> {
    return this.client.post("/project_discussions/edit", input);
  }
}

class ApiNamespaceTasks {
  constructor(private client: ApiClient) {}

  async list(input: TasksListInput): Promise<TasksListResult> {
    return this.client.get("/tasks/list", input);
  }

  async create(input: TasksCreateInput): Promise<TasksCreateResult> {
    return this.client.post("/tasks/create", input);
  }

  async delete(input: TasksDeleteInput): Promise<TasksDeleteResult> {
    return this.client.post("/tasks/delete", input);
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

  async updateStatus(input: TasksUpdateStatusInput): Promise<TasksUpdateStatusResult> {
    return this.client.post("/tasks/update_status", input);
  }
}

class ApiNamespaceProjectMilestones {
  constructor(private client: ApiClient) {}

  async listTasks(input: ProjectMilestonesListTasksInput): Promise<ProjectMilestonesListTasksResult> {
    return this.client.get("/project_milestones/list_tasks", input);
  }

  async delete(input: ProjectMilestonesDeleteInput): Promise<ProjectMilestonesDeleteResult> {
    return this.client.post("/project_milestones/delete", input);
  }

  async updateDescription(
    input: ProjectMilestonesUpdateDescriptionInput,
  ): Promise<ProjectMilestonesUpdateDescriptionResult> {
    return this.client.post("/project_milestones/update_description", input);
  }

  async updateDueDate(input: ProjectMilestonesUpdateDueDateInput): Promise<ProjectMilestonesUpdateDueDateResult> {
    return this.client.post("/project_milestones/update_due_date", input);
  }

  async updateKanban(input: ProjectMilestonesUpdateKanbanInput): Promise<ProjectMilestonesUpdateKanbanResult> {
    return this.client.post("/project_milestones/update_kanban", input);
  }

  async updateOrdering(input: ProjectMilestonesUpdateOrderingInput): Promise<ProjectMilestonesUpdateOrderingResult> {
    return this.client.post("/project_milestones/update_ordering", input);
  }

  async updateTitle(input: ProjectMilestonesUpdateTitleInput): Promise<ProjectMilestonesUpdateTitleResult> {
    return this.client.post("/project_milestones/update_title", input);
  }
}

class ApiNamespaceProjects {
  constructor(private client: ApiClient) {}

  async countChildren(input: ProjectsCountChildrenInput): Promise<ProjectsCountChildrenResult> {
    return this.client.get("/projects/count_children", input);
  }

  async getContributors(input: ProjectsGetContributorsInput): Promise<ProjectsGetContributorsResult> {
    return this.client.get("/projects/get_contributors", input);
  }

  async getMilestones(input: ProjectsGetMilestonesInput): Promise<ProjectsGetMilestonesResult> {
    return this.client.get("/projects/get_milestones", input);
  }

  async parentGoalSearch(input: ProjectsParentGoalSearchInput): Promise<ProjectsParentGoalSearchResult> {
    return this.client.get("/projects/parent_goal_search", input);
  }

  async createMilestone(input: ProjectsCreateMilestoneInput): Promise<ProjectsCreateMilestoneResult> {
    return this.client.post("/projects/create_milestone", input);
  }

  async delete(input: ProjectsDeleteInput): Promise<ProjectsDeleteResult> {
    return this.client.post("/projects/delete", input);
  }

  async updateChampion(input: ProjectsUpdateChampionInput): Promise<ProjectsUpdateChampionResult> {
    return this.client.post("/projects/update_champion", input);
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

  async updateParentGoal(input: ProjectsUpdateParentGoalInput): Promise<ProjectsUpdateParentGoalResult> {
    return this.client.post("/projects/update_parent_goal", input);
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
}

class ApiNamespaceGoals {
  constructor(private client: ApiClient) {}

  async getCheckIns(input: GoalsGetCheckInsInput): Promise<GoalsGetCheckInsResult> {
    return this.client.get("/goals/get_check_ins", input);
  }

  async getDiscussions(input: GoalsGetDiscussionsInput): Promise<GoalsGetDiscussionsResult> {
    return this.client.get("/goals/get_discussions", input);
  }

  async listAccessMembers(input: GoalsListAccessMembersInput): Promise<GoalsListAccessMembersResult> {
    return this.client.get("/goals/list_access_members", input);
  }

  async parentGoalSearch(input: GoalsParentGoalSearchInput): Promise<GoalsParentGoalSearchResult> {
    return this.client.get("/goals/parent_goal_search", input);
  }

  async addAccessMembers(input: GoalsAddAccessMembersInput): Promise<GoalsAddAccessMembersResult> {
    return this.client.post("/goals/add_access_members", input);
  }

  async addCheck(input: GoalsAddCheckInput): Promise<GoalsAddCheckResult> {
    return this.client.post("/goals/add_check", input);
  }

  async addTarget(input: GoalsAddTargetInput): Promise<GoalsAddTargetResult> {
    return this.client.post("/goals/add_target", input);
  }

  async deleteCheck(input: GoalsDeleteCheckInput): Promise<GoalsDeleteCheckResult> {
    return this.client.post("/goals/delete_check", input);
  }

  async deleteTarget(input: GoalsDeleteTargetInput): Promise<GoalsDeleteTargetResult> {
    return this.client.post("/goals/delete_target", input);
  }

  async removeAccessMember(input: GoalsRemoveAccessMemberInput): Promise<GoalsRemoveAccessMemberResult> {
    return this.client.post("/goals/remove_access_member", input);
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

  async updateCheckIndex(input: GoalsUpdateCheckIndexInput): Promise<GoalsUpdateCheckIndexResult> {
    return this.client.post("/goals/update_check_index", input);
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

class ApiNamespaceAi {
  constructor(private client: ApiClient) {}

  async getAgent(input: AiGetAgentInput): Promise<AiGetAgentResult> {
    return this.client.get("/ai/get_agent", input);
  }

  async getAgentRun(input: AiGetAgentRunInput): Promise<AiGetAgentRunResult> {
    return this.client.get("/ai/get_agent_run", input);
  }

  async getConversationMessages(input: AiGetConversationMessagesInput): Promise<AiGetConversationMessagesResult> {
    return this.client.get("/ai/get_conversation_messages", input);
  }

  async getConversations(input: AiGetConversationsInput): Promise<AiGetConversationsResult> {
    return this.client.get("/ai/get_conversations", input);
  }

  async listAgentRuns(input: AiListAgentRunsInput): Promise<AiListAgentRunsResult> {
    return this.client.get("/ai/list_agent_runs", input);
  }

  async listAgents(input: AiListAgentsInput): Promise<AiListAgentsResult> {
    return this.client.get("/ai/list_agents", input);
  }

  async prompt(input: AiPromptInput): Promise<AiPromptResult> {
    return this.client.get("/ai/prompt", input);
  }

  async addAgent(input: AiAddAgentInput): Promise<AiAddAgentResult> {
    return this.client.post("/ai/add_agent", input);
  }

  async createConversation(input: AiCreateConversationInput): Promise<AiCreateConversationResult> {
    return this.client.post("/ai/create_conversation", input);
  }

  async editAgentDailyRun(input: AiEditAgentDailyRunInput): Promise<AiEditAgentDailyRunResult> {
    return this.client.post("/ai/edit_agent_daily_run", input);
  }

  async editAgentDefinition(input: AiEditAgentDefinitionInput): Promise<AiEditAgentDefinitionResult> {
    return this.client.post("/ai/edit_agent_definition", input);
  }

  async editAgentPlanningInstructions(
    input: AiEditAgentPlanningInstructionsInput,
  ): Promise<AiEditAgentPlanningInstructionsResult> {
    return this.client.post("/ai/edit_agent_planning_instructions", input);
  }

  async editAgentProvider(input: AiEditAgentProviderInput): Promise<AiEditAgentProviderResult> {
    return this.client.post("/ai/edit_agent_provider", input);
  }

  async editAgentSandboxMode(input: AiEditAgentSandboxModeInput): Promise<AiEditAgentSandboxModeResult> {
    return this.client.post("/ai/edit_agent_sandbox_mode", input);
  }

  async editAgentTaskExecutionInstructions(
    input: AiEditAgentTaskExecutionInstructionsInput,
  ): Promise<AiEditAgentTaskExecutionInstructionsResult> {
    return this.client.post("/ai/edit_agent_task_execution_instructions", input);
  }

  async editAgentVerbosity(input: AiEditAgentVerbosityInput): Promise<AiEditAgentVerbosityResult> {
    return this.client.post("/ai/edit_agent_verbosity", input);
  }

  async runAgent(input: AiRunAgentInput): Promise<AiRunAgentResult> {
    return this.client.post("/ai/run_agent", input);
  }

  async sendMessage(input: AiSendMessageInput): Promise<AiSendMessageResult> {
    return this.client.post("/ai/send_message", input);
  }
}

export class ApiClient {
  private basePath: string;
  private headers: any;
  public apiNamespaceRoot: ApiNamespaceRoot;
  public apiNamespaceInvitations: ApiNamespaceInvitations;
  public apiNamespaceSpaces: ApiNamespaceSpaces;
  public apiNamespaceProjectDiscussions: ApiNamespaceProjectDiscussions;
  public apiNamespaceTasks: ApiNamespaceTasks;
  public apiNamespaceProjectMilestones: ApiNamespaceProjectMilestones;
  public apiNamespaceProjects: ApiNamespaceProjects;
  public apiNamespaceGoals: ApiNamespaceGoals;
  public apiNamespaceAi: ApiNamespaceAi;

  constructor() {
    this.apiNamespaceRoot = new ApiNamespaceRoot(this);
    this.apiNamespaceInvitations = new ApiNamespaceInvitations(this);
    this.apiNamespaceSpaces = new ApiNamespaceSpaces(this);
    this.apiNamespaceProjectDiscussions = new ApiNamespaceProjectDiscussions(this);
    this.apiNamespaceTasks = new ApiNamespaceTasks(this);
    this.apiNamespaceProjectMilestones = new ApiNamespaceProjectMilestones(this);
    this.apiNamespaceProjects = new ApiNamespaceProjects(this);
    this.apiNamespaceGoals = new ApiNamespaceGoals(this);
    this.apiNamespaceAi = new ApiNamespaceAi(this);
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

  getFlatWorkMap(input: GetFlatWorkMapInput): Promise<GetFlatWorkMapResult> {
    return this.apiNamespaceRoot.getFlatWorkMap(input);
  }

  getGoal(input: GetGoalInput): Promise<GetGoalResult> {
    return this.apiNamespaceRoot.getGoal(input);
  }

  getGoalProgressUpdate(input: GetGoalProgressUpdateInput): Promise<GetGoalProgressUpdateResult> {
    return this.apiNamespaceRoot.getGoalProgressUpdate(input);
  }

  getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
    return this.apiNamespaceRoot.getGoals(input);
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

  getTheme(input: GetThemeInput): Promise<GetThemeResult> {
    return this.apiNamespaceRoot.getTheme(input);
  }

  getUnreadNotificationCount(input: GetUnreadNotificationCountInput): Promise<GetUnreadNotificationCountResult> {
    return this.apiNamespaceRoot.getUnreadNotificationCount(input);
  }

  getWorkMap(input: GetWorkMapInput): Promise<GetWorkMapResult> {
    return this.apiNamespaceRoot.getWorkMap(input);
  }

  globalSearch(input: GlobalSearchInput): Promise<GlobalSearchResult> {
    return this.apiNamespaceRoot.globalSearch(input);
  }

  isSubscribedToResource(input: IsSubscribedToResourceInput): Promise<IsSubscribedToResourceResult> {
    return this.apiNamespaceRoot.isSubscribedToResource(input);
  }

  listGoalContributors(input: ListGoalContributorsInput): Promise<ListGoalContributorsResult> {
    return this.apiNamespaceRoot.listGoalContributors(input);
  }

  listPossibleManagers(input: ListPossibleManagersInput): Promise<ListPossibleManagersResult> {
    return this.apiNamespaceRoot.listPossibleManagers(input);
  }

  listResourceHubNodes(input: ListResourceHubNodesInput): Promise<ListResourceHubNodesResult> {
    return this.apiNamespaceRoot.listResourceHubNodes(input);
  }

  listSpaceTools(input: ListSpaceToolsInput): Promise<ListSpaceToolsResult> {
    return this.apiNamespaceRoot.listSpaceTools(input);
  }

  listTaskAssignablePeople(input: ListTaskAssignablePeopleInput): Promise<ListTaskAssignablePeopleResult> {
    return this.apiNamespaceRoot.listTaskAssignablePeople(input);
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

  archiveMessage(input: ArchiveMessageInput): Promise<ArchiveMessageResult> {
    return this.apiNamespaceRoot.archiveMessage(input);
  }

  changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
    return this.apiNamespaceRoot.changeGoalParent(input);
  }

  changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    return this.apiNamespaceRoot.changePassword(input);
  }

  closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
    return this.apiNamespaceRoot.closeGoal(input);
  }

  closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
    return this.apiNamespaceRoot.closeProject(input);
  }

  completeCompanySetup(input: CompleteCompanySetupInput): Promise<CompleteCompanySetupResult> {
    return this.apiNamespaceRoot.completeCompanySetup(input);
  }

  convertCompanyMemberToGuest(input: ConvertCompanyMemberToGuestInput): Promise<ConvertCompanyMemberToGuestResult> {
    return this.apiNamespaceRoot.convertCompanyMemberToGuest(input);
  }

  copyResourceHubFolder(input: CopyResourceHubFolderInput): Promise<CopyResourceHubFolderResult> {
    return this.apiNamespaceRoot.copyResourceHubFolder(input);
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

  deleteComment(input: DeleteCommentInput): Promise<DeleteCommentResult> {
    return this.apiNamespaceRoot.deleteComment(input);
  }

  deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
    return this.apiNamespaceRoot.deleteCompany(input);
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

  deleteSpace(input: DeleteSpaceInput): Promise<DeleteSpaceResult> {
    return this.apiNamespaceRoot.deleteSpace(input);
  }

  editComment(input: EditCommentInput): Promise<EditCommentResult> {
    return this.apiNamespaceRoot.editComment(input);
  }

  editCompany(input: EditCompanyInput): Promise<EditCompanyResult> {
    return this.apiNamespaceRoot.editCompany(input);
  }

  editCompanyMembersPermissions(
    input: EditCompanyMembersPermissionsInput,
  ): Promise<EditCompanyMembersPermissionsResult> {
    return this.apiNamespaceRoot.editCompanyMembersPermissions(input);
  }

  editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
    return this.apiNamespaceRoot.editDiscussion(input);
  }

  editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return this.apiNamespaceRoot.editGoalDiscussion(input);
  }

  editGoalProgressUpdate(input: EditGoalProgressUpdateInput): Promise<EditGoalProgressUpdateResult> {
    return this.apiNamespaceRoot.editGoalProgressUpdate(input);
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

  grantResourceAccess(input: GrantResourceAccessInput): Promise<GrantResourceAccessResult> {
    return this.apiNamespaceRoot.grantResourceAccess(input);
  }

  inviteGuest(input: InviteGuestInput): Promise<InviteGuestResult> {
    return this.apiNamespaceRoot.inviteGuest(input);
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

  removeReaction(input: RemoveReactionInput): Promise<RemoveReactionResult> {
    return this.apiNamespaceRoot.removeReaction(input);
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

  updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    return this.apiNamespaceRoot.updateProfile(input);
  }

  updateProfilePicture(input: UpdateProfilePictureInput): Promise<UpdateProfilePictureResult> {
    return this.apiNamespaceRoot.updateProfilePicture(input);
  }

  updateProjectContributor(input: UpdateProjectContributorInput): Promise<UpdateProjectContributorResult> {
    return this.apiNamespaceRoot.updateProjectContributor(input);
  }

  updateProjectDescription(input: UpdateProjectDescriptionInput): Promise<UpdateProjectDescriptionResult> {
    return this.apiNamespaceRoot.updateProjectDescription(input);
  }

  updateTheme(input: UpdateThemeInput): Promise<UpdateThemeResult> {
    return this.apiNamespaceRoot.updateTheme(input);
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
export async function getFlatWorkMap(input: GetFlatWorkMapInput): Promise<GetFlatWorkMapResult> {
  return defaultApiClient.getFlatWorkMap(input);
}
export async function getGoal(input: GetGoalInput): Promise<GetGoalResult> {
  return defaultApiClient.getGoal(input);
}
export async function getGoalProgressUpdate(input: GetGoalProgressUpdateInput): Promise<GetGoalProgressUpdateResult> {
  return defaultApiClient.getGoalProgressUpdate(input);
}
export async function getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
  return defaultApiClient.getGoals(input);
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
export async function getTheme(input: GetThemeInput): Promise<GetThemeResult> {
  return defaultApiClient.getTheme(input);
}
export async function getUnreadNotificationCount(
  input: GetUnreadNotificationCountInput,
): Promise<GetUnreadNotificationCountResult> {
  return defaultApiClient.getUnreadNotificationCount(input);
}
export async function getWorkMap(input: GetWorkMapInput): Promise<GetWorkMapResult> {
  return defaultApiClient.getWorkMap(input);
}
export async function globalSearch(input: GlobalSearchInput): Promise<GlobalSearchResult> {
  return defaultApiClient.globalSearch(input);
}
export async function isSubscribedToResource(
  input: IsSubscribedToResourceInput,
): Promise<IsSubscribedToResourceResult> {
  return defaultApiClient.isSubscribedToResource(input);
}
export async function listGoalContributors(input: ListGoalContributorsInput): Promise<ListGoalContributorsResult> {
  return defaultApiClient.listGoalContributors(input);
}
export async function listPossibleManagers(input: ListPossibleManagersInput): Promise<ListPossibleManagersResult> {
  return defaultApiClient.listPossibleManagers(input);
}
export async function listResourceHubNodes(input: ListResourceHubNodesInput): Promise<ListResourceHubNodesResult> {
  return defaultApiClient.listResourceHubNodes(input);
}
export async function listSpaceTools(input: ListSpaceToolsInput): Promise<ListSpaceToolsResult> {
  return defaultApiClient.listSpaceTools(input);
}
export async function listTaskAssignablePeople(
  input: ListTaskAssignablePeopleInput,
): Promise<ListTaskAssignablePeopleResult> {
  return defaultApiClient.listTaskAssignablePeople(input);
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
export async function archiveMessage(input: ArchiveMessageInput): Promise<ArchiveMessageResult> {
  return defaultApiClient.archiveMessage(input);
}
export async function changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
  return defaultApiClient.changeGoalParent(input);
}
export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  return defaultApiClient.changePassword(input);
}
export async function closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
  return defaultApiClient.closeGoal(input);
}
export async function closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
  return defaultApiClient.closeProject(input);
}
export async function completeCompanySetup(input: CompleteCompanySetupInput): Promise<CompleteCompanySetupResult> {
  return defaultApiClient.completeCompanySetup(input);
}
export async function convertCompanyMemberToGuest(
  input: ConvertCompanyMemberToGuestInput,
): Promise<ConvertCompanyMemberToGuestResult> {
  return defaultApiClient.convertCompanyMemberToGuest(input);
}
export async function copyResourceHubFolder(input: CopyResourceHubFolderInput): Promise<CopyResourceHubFolderResult> {
  return defaultApiClient.copyResourceHubFolder(input);
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
export async function deleteComment(input: DeleteCommentInput): Promise<DeleteCommentResult> {
  return defaultApiClient.deleteComment(input);
}
export async function deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
  return defaultApiClient.deleteCompany(input);
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
export async function deleteSpace(input: DeleteSpaceInput): Promise<DeleteSpaceResult> {
  return defaultApiClient.deleteSpace(input);
}
export async function editComment(input: EditCommentInput): Promise<EditCommentResult> {
  return defaultApiClient.editComment(input);
}
export async function editCompany(input: EditCompanyInput): Promise<EditCompanyResult> {
  return defaultApiClient.editCompany(input);
}
export async function editCompanyMembersPermissions(
  input: EditCompanyMembersPermissionsInput,
): Promise<EditCompanyMembersPermissionsResult> {
  return defaultApiClient.editCompanyMembersPermissions(input);
}
export async function editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
  return defaultApiClient.editDiscussion(input);
}
export async function editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
  return defaultApiClient.editGoalDiscussion(input);
}
export async function editGoalProgressUpdate(
  input: EditGoalProgressUpdateInput,
): Promise<EditGoalProgressUpdateResult> {
  return defaultApiClient.editGoalProgressUpdate(input);
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
export async function grantResourceAccess(input: GrantResourceAccessInput): Promise<GrantResourceAccessResult> {
  return defaultApiClient.grantResourceAccess(input);
}
export async function inviteGuest(input: InviteGuestInput): Promise<InviteGuestResult> {
  return defaultApiClient.inviteGuest(input);
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
export async function removeReaction(input: RemoveReactionInput): Promise<RemoveReactionResult> {
  return defaultApiClient.removeReaction(input);
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
export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  return defaultApiClient.updateProfile(input);
}
export async function updateProfilePicture(input: UpdateProfilePictureInput): Promise<UpdateProfilePictureResult> {
  return defaultApiClient.updateProfilePicture(input);
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
export async function updateTheme(input: UpdateThemeInput): Promise<UpdateThemeResult> {
  return defaultApiClient.updateTheme(input);
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

export function useGetFlatWorkMap(input: GetFlatWorkMapInput): UseQueryHookResult<GetFlatWorkMapResult> {
  return useQuery<GetFlatWorkMapResult>(() => defaultApiClient.getFlatWorkMap(input));
}

export function useGetGoal(input: GetGoalInput): UseQueryHookResult<GetGoalResult> {
  return useQuery<GetGoalResult>(() => defaultApiClient.getGoal(input));
}

export function useGetGoalProgressUpdate(
  input: GetGoalProgressUpdateInput,
): UseQueryHookResult<GetGoalProgressUpdateResult> {
  return useQuery<GetGoalProgressUpdateResult>(() => defaultApiClient.getGoalProgressUpdate(input));
}

export function useGetGoals(input: GetGoalsInput): UseQueryHookResult<GetGoalsResult> {
  return useQuery<GetGoalsResult>(() => defaultApiClient.getGoals(input));
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

export function useGetTheme(input: GetThemeInput): UseQueryHookResult<GetThemeResult> {
  return useQuery<GetThemeResult>(() => defaultApiClient.getTheme(input));
}

export function useGetUnreadNotificationCount(
  input: GetUnreadNotificationCountInput,
): UseQueryHookResult<GetUnreadNotificationCountResult> {
  return useQuery<GetUnreadNotificationCountResult>(() => defaultApiClient.getUnreadNotificationCount(input));
}

export function useGetWorkMap(input: GetWorkMapInput): UseQueryHookResult<GetWorkMapResult> {
  return useQuery<GetWorkMapResult>(() => defaultApiClient.getWorkMap(input));
}

export function useGlobalSearch(input: GlobalSearchInput): UseQueryHookResult<GlobalSearchResult> {
  return useQuery<GlobalSearchResult>(() => defaultApiClient.globalSearch(input));
}

export function useIsSubscribedToResource(
  input: IsSubscribedToResourceInput,
): UseQueryHookResult<IsSubscribedToResourceResult> {
  return useQuery<IsSubscribedToResourceResult>(() => defaultApiClient.isSubscribedToResource(input));
}

export function useListGoalContributors(
  input: ListGoalContributorsInput,
): UseQueryHookResult<ListGoalContributorsResult> {
  return useQuery<ListGoalContributorsResult>(() => defaultApiClient.listGoalContributors(input));
}

export function useListPossibleManagers(
  input: ListPossibleManagersInput,
): UseQueryHookResult<ListPossibleManagersResult> {
  return useQuery<ListPossibleManagersResult>(() => defaultApiClient.listPossibleManagers(input));
}

export function useListResourceHubNodes(
  input: ListResourceHubNodesInput,
): UseQueryHookResult<ListResourceHubNodesResult> {
  return useQuery<ListResourceHubNodesResult>(() => defaultApiClient.listResourceHubNodes(input));
}

export function useListSpaceTools(input: ListSpaceToolsInput): UseQueryHookResult<ListSpaceToolsResult> {
  return useQuery<ListSpaceToolsResult>(() => defaultApiClient.listSpaceTools(input));
}

export function useListTaskAssignablePeople(
  input: ListTaskAssignablePeopleInput,
): UseQueryHookResult<ListTaskAssignablePeopleResult> {
  return useQuery<ListTaskAssignablePeopleResult>(() => defaultApiClient.listTaskAssignablePeople(input));
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

export function useArchiveMessage(): UseMutationHookResult<ArchiveMessageInput, ArchiveMessageResult> {
  return useMutation<ArchiveMessageInput, ArchiveMessageResult>((input) => defaultApiClient.archiveMessage(input));
}

export function useChangeGoalParent(): UseMutationHookResult<ChangeGoalParentInput, ChangeGoalParentResult> {
  return useMutation<ChangeGoalParentInput, ChangeGoalParentResult>((input) =>
    defaultApiClient.changeGoalParent(input),
  );
}

export function useChangePassword(): UseMutationHookResult<ChangePasswordInput, ChangePasswordResult> {
  return useMutation<ChangePasswordInput, ChangePasswordResult>((input) => defaultApiClient.changePassword(input));
}

export function useCloseGoal(): UseMutationHookResult<CloseGoalInput, CloseGoalResult> {
  return useMutation<CloseGoalInput, CloseGoalResult>((input) => defaultApiClient.closeGoal(input));
}

export function useCloseProject(): UseMutationHookResult<CloseProjectInput, CloseProjectResult> {
  return useMutation<CloseProjectInput, CloseProjectResult>((input) => defaultApiClient.closeProject(input));
}

export function useCompleteCompanySetup(): UseMutationHookResult<
  CompleteCompanySetupInput,
  CompleteCompanySetupResult
> {
  return useMutation<CompleteCompanySetupInput, CompleteCompanySetupResult>((input) =>
    defaultApiClient.completeCompanySetup(input),
  );
}

export function useConvertCompanyMemberToGuest(): UseMutationHookResult<
  ConvertCompanyMemberToGuestInput,
  ConvertCompanyMemberToGuestResult
> {
  return useMutation<ConvertCompanyMemberToGuestInput, ConvertCompanyMemberToGuestResult>((input) =>
    defaultApiClient.convertCompanyMemberToGuest(input),
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

export function useCreateAvatarBlob(): UseMutationHookResult<CreateAvatarBlobInput, CreateAvatarBlobResult> {
  return useMutation<CreateAvatarBlobInput, CreateAvatarBlobResult>((input) =>
    defaultApiClient.createAvatarBlob(input),
  );
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

export function useDeleteComment(): UseMutationHookResult<DeleteCommentInput, DeleteCommentResult> {
  return useMutation<DeleteCommentInput, DeleteCommentResult>((input) => defaultApiClient.deleteComment(input));
}

export function useDeleteCompany(): UseMutationHookResult<DeleteCompanyInput, DeleteCompanyResult> {
  return useMutation<DeleteCompanyInput, DeleteCompanyResult>((input) => defaultApiClient.deleteCompany(input));
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

export function useDeleteSpace(): UseMutationHookResult<DeleteSpaceInput, DeleteSpaceResult> {
  return useMutation<DeleteSpaceInput, DeleteSpaceResult>((input) => defaultApiClient.deleteSpace(input));
}

export function useEditComment(): UseMutationHookResult<EditCommentInput, EditCommentResult> {
  return useMutation<EditCommentInput, EditCommentResult>((input) => defaultApiClient.editComment(input));
}

export function useEditCompany(): UseMutationHookResult<EditCompanyInput, EditCompanyResult> {
  return useMutation<EditCompanyInput, EditCompanyResult>((input) => defaultApiClient.editCompany(input));
}

export function useEditCompanyMembersPermissions(): UseMutationHookResult<
  EditCompanyMembersPermissionsInput,
  EditCompanyMembersPermissionsResult
> {
  return useMutation<EditCompanyMembersPermissionsInput, EditCompanyMembersPermissionsResult>((input) =>
    defaultApiClient.editCompanyMembersPermissions(input),
  );
}

export function useEditDiscussion(): UseMutationHookResult<EditDiscussionInput, EditDiscussionResult> {
  return useMutation<EditDiscussionInput, EditDiscussionResult>((input) => defaultApiClient.editDiscussion(input));
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

export function useGrantResourceAccess(): UseMutationHookResult<GrantResourceAccessInput, GrantResourceAccessResult> {
  return useMutation<GrantResourceAccessInput, GrantResourceAccessResult>((input) =>
    defaultApiClient.grantResourceAccess(input),
  );
}

export function useInviteGuest(): UseMutationHookResult<InviteGuestInput, InviteGuestResult> {
  return useMutation<InviteGuestInput, InviteGuestResult>((input) => defaultApiClient.inviteGuest(input));
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

export function useRemoveReaction(): UseMutationHookResult<RemoveReactionInput, RemoveReactionResult> {
  return useMutation<RemoveReactionInput, RemoveReactionResult>((input) => defaultApiClient.removeReaction(input));
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

export function useUpdateProfile(): UseMutationHookResult<UpdateProfileInput, UpdateProfileResult> {
  return useMutation<UpdateProfileInput, UpdateProfileResult>((input) => defaultApiClient.updateProfile(input));
}

export function useUpdateProfilePicture(): UseMutationHookResult<
  UpdateProfilePictureInput,
  UpdateProfilePictureResult
> {
  return useMutation<UpdateProfilePictureInput, UpdateProfilePictureResult>((input) =>
    defaultApiClient.updateProfilePicture(input),
  );
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

export function useUpdateTheme(): UseMutationHookResult<UpdateThemeInput, UpdateThemeResult> {
  return useMutation<UpdateThemeInput, UpdateThemeResult>((input) => defaultApiClient.updateTheme(input));
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
  getFlatWorkMap,
  useGetFlatWorkMap,
  getGoal,
  useGetGoal,
  getGoalProgressUpdate,
  useGetGoalProgressUpdate,
  getGoals,
  useGetGoals,
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
  getTheme,
  useGetTheme,
  getUnreadNotificationCount,
  useGetUnreadNotificationCount,
  getWorkMap,
  useGetWorkMap,
  globalSearch,
  useGlobalSearch,
  isSubscribedToResource,
  useIsSubscribedToResource,
  listGoalContributors,
  useListGoalContributors,
  listPossibleManagers,
  useListPossibleManagers,
  listResourceHubNodes,
  useListResourceHubNodes,
  listSpaceTools,
  useListSpaceTools,
  listTaskAssignablePeople,
  useListTaskAssignablePeople,
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
  archiveMessage,
  useArchiveMessage,
  changeGoalParent,
  useChangeGoalParent,
  changePassword,
  useChangePassword,
  closeGoal,
  useCloseGoal,
  closeProject,
  useCloseProject,
  completeCompanySetup,
  useCompleteCompanySetup,
  convertCompanyMemberToGuest,
  useConvertCompanyMemberToGuest,
  copyResourceHubFolder,
  useCopyResourceHubFolder,
  createAccount,
  useCreateAccount,
  createAvatarBlob,
  useCreateAvatarBlob,
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
  deleteComment,
  useDeleteComment,
  deleteCompany,
  useDeleteCompany,
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
  deleteSpace,
  useDeleteSpace,
  editComment,
  useEditComment,
  editCompany,
  useEditCompany,
  editCompanyMembersPermissions,
  useEditCompanyMembersPermissions,
  editDiscussion,
  useEditDiscussion,
  editGoalDiscussion,
  useEditGoalDiscussion,
  editGoalProgressUpdate,
  useEditGoalProgressUpdate,
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
  grantResourceAccess,
  useGrantResourceAccess,
  inviteGuest,
  useInviteGuest,
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
  removeReaction,
  useRemoveReaction,
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
  updateProfile,
  useUpdateProfile,
  updateProfilePicture,
  useUpdateProfilePicture,
  updateProjectContributor,
  useUpdateProjectContributor,
  updateProjectDescription,
  useUpdateProjectDescription,
  updateTheme,
  useUpdateTheme,

  invitations: {
    getInviteLinkByToken: (input: InvitationsGetInviteLinkByTokenInput) =>
      defaultApiClient.apiNamespaceInvitations.getInviteLinkByToken(input),
    useGetInviteLinkByToken: (input: InvitationsGetInviteLinkByTokenInput) =>
      useQuery<InvitationsGetInviteLinkByTokenResult>(() =>
        defaultApiClient.apiNamespaceInvitations.getInviteLinkByToken(input),
      ),

    getInvitation: (input: InvitationsGetInvitationInput) =>
      defaultApiClient.apiNamespaceInvitations.getInvitation(input),
    useGetInvitation: (input: InvitationsGetInvitationInput) =>
      useQuery<InvitationsGetInvitationResult>(() => defaultApiClient.apiNamespaceInvitations.getInvitation(input)),

    newInvitationToken: (input: InvitationsNewInvitationTokenInput) =>
      defaultApiClient.apiNamespaceInvitations.newInvitationToken(input),
    useNewInvitationToken: () =>
      useMutation<InvitationsNewInvitationTokenInput, InvitationsNewInvitationTokenResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.newInvitationToken(input),
      ),

    resetCompanyInviteLink: (input: InvitationsResetCompanyInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.resetCompanyInviteLink(input),
    useResetCompanyInviteLink: () =>
      useMutation<InvitationsResetCompanyInviteLinkInput, InvitationsResetCompanyInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.resetCompanyInviteLink(input),
      ),

    getCompanyInviteLink: (input: InvitationsGetCompanyInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.getCompanyInviteLink(input),
    useGetCompanyInviteLink: () =>
      useMutation<InvitationsGetCompanyInviteLinkInput, InvitationsGetCompanyInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.getCompanyInviteLink(input),
      ),

    updateCompanyInviteLink: (input: InvitationsUpdateCompanyInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.updateCompanyInviteLink(input),
    useUpdateCompanyInviteLink: () =>
      useMutation<InvitationsUpdateCompanyInviteLinkInput, InvitationsUpdateCompanyInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.updateCompanyInviteLink(input),
      ),

    joinCompanyViaInviteLink: (input: InvitationsJoinCompanyViaInviteLinkInput) =>
      defaultApiClient.apiNamespaceInvitations.joinCompanyViaInviteLink(input),
    useJoinCompanyViaInviteLink: () =>
      useMutation<InvitationsJoinCompanyViaInviteLinkInput, InvitationsJoinCompanyViaInviteLinkResult>((input) =>
        defaultApiClient.apiNamespaceInvitations.joinCompanyViaInviteLink(input),
      ),
  },

  spaces: {
    countByAccessLevel: (input: SpacesCountByAccessLevelInput) =>
      defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input),
    useCountByAccessLevel: (input: SpacesCountByAccessLevelInput) =>
      useQuery<SpacesCountByAccessLevelResult>(() => defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input)),

    search: (input: SpacesSearchInput) => defaultApiClient.apiNamespaceSpaces.search(input),
    useSearch: (input: SpacesSearchInput) =>
      useQuery<SpacesSearchResult>(() => defaultApiClient.apiNamespaceSpaces.search(input)),

    listMembers: (input: SpacesListMembersInput) => defaultApiClient.apiNamespaceSpaces.listMembers(input),
    useListMembers: (input: SpacesListMembersInput) =>
      useQuery<SpacesListMembersResult>(() => defaultApiClient.apiNamespaceSpaces.listMembers(input)),

    listTasks: (input: SpacesListTasksInput) => defaultApiClient.apiNamespaceSpaces.listTasks(input),
    useListTasks: (input: SpacesListTasksInput) =>
      useQuery<SpacesListTasksResult>(() => defaultApiClient.apiNamespaceSpaces.listTasks(input)),

    updateTools: (input: SpacesUpdateToolsInput) => defaultApiClient.apiNamespaceSpaces.updateTools(input),
    useUpdateTools: () =>
      useMutation<SpacesUpdateToolsInput, SpacesUpdateToolsResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateTools(input),
      ),

    updateKanban: (input: SpacesUpdateKanbanInput) => defaultApiClient.apiNamespaceSpaces.updateKanban(input),
    useUpdateKanban: () =>
      useMutation<SpacesUpdateKanbanInput, SpacesUpdateKanbanResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateKanban(input),
      ),

    updateTaskStatuses: (input: SpacesUpdateTaskStatusesInput) =>
      defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
    useUpdateTaskStatuses: () =>
      useMutation<SpacesUpdateTaskStatusesInput, SpacesUpdateTaskStatusesResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
      ),
  },

  project_discussions: {
    list: (input: ProjectDiscussionsListInput) => defaultApiClient.apiNamespaceProjectDiscussions.list(input),
    useList: (input: ProjectDiscussionsListInput) =>
      useQuery<ProjectDiscussionsListResult>(() => defaultApiClient.apiNamespaceProjectDiscussions.list(input)),

    get: (input: ProjectDiscussionsGetInput) => defaultApiClient.apiNamespaceProjectDiscussions.get(input),
    useGet: (input: ProjectDiscussionsGetInput) =>
      useQuery<ProjectDiscussionsGetResult>(() => defaultApiClient.apiNamespaceProjectDiscussions.get(input)),

    edit: (input: ProjectDiscussionsEditInput) => defaultApiClient.apiNamespaceProjectDiscussions.edit(input),
    useEdit: () =>
      useMutation<ProjectDiscussionsEditInput, ProjectDiscussionsEditResult>((input) =>
        defaultApiClient.apiNamespaceProjectDiscussions.edit(input),
      ),

    create: (input: ProjectDiscussionsCreateInput) => defaultApiClient.apiNamespaceProjectDiscussions.create(input),
    useCreate: () =>
      useMutation<ProjectDiscussionsCreateInput, ProjectDiscussionsCreateResult>((input) =>
        defaultApiClient.apiNamespaceProjectDiscussions.create(input),
      ),
  },

  tasks: {
    list: (input: TasksListInput) => defaultApiClient.apiNamespaceTasks.list(input),
    useList: (input: TasksListInput) => useQuery<TasksListResult>(() => defaultApiClient.apiNamespaceTasks.list(input)),

    updateAssignee: (input: TasksUpdateAssigneeInput) => defaultApiClient.apiNamespaceTasks.updateAssignee(input),
    useUpdateAssignee: () =>
      useMutation<TasksUpdateAssigneeInput, TasksUpdateAssigneeResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateAssignee(input),
      ),

    create: (input: TasksCreateInput) => defaultApiClient.apiNamespaceTasks.create(input),
    useCreate: () =>
      useMutation<TasksCreateInput, TasksCreateResult>((input) => defaultApiClient.apiNamespaceTasks.create(input)),

    updateMilestoneAndOrdering: (input: TasksUpdateMilestoneAndOrderingInput) =>
      defaultApiClient.apiNamespaceTasks.updateMilestoneAndOrdering(input),
    useUpdateMilestoneAndOrdering: () =>
      useMutation<TasksUpdateMilestoneAndOrderingInput, TasksUpdateMilestoneAndOrderingResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateMilestoneAndOrdering(input),
      ),

    updateMilestone: (input: TasksUpdateMilestoneInput) => defaultApiClient.apiNamespaceTasks.updateMilestone(input),
    useUpdateMilestone: () =>
      useMutation<TasksUpdateMilestoneInput, TasksUpdateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateMilestone(input),
      ),

    updateDescription: (input: TasksUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceTasks.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<TasksUpdateDescriptionInput, TasksUpdateDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateDescription(input),
      ),

    delete: (input: TasksDeleteInput) => defaultApiClient.apiNamespaceTasks.delete(input),
    useDelete: () =>
      useMutation<TasksDeleteInput, TasksDeleteResult>((input) => defaultApiClient.apiNamespaceTasks.delete(input)),

    updateStatus: (input: TasksUpdateStatusInput) => defaultApiClient.apiNamespaceTasks.updateStatus(input),
    useUpdateStatus: () =>
      useMutation<TasksUpdateStatusInput, TasksUpdateStatusResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateStatus(input),
      ),

    updateDueDate: (input: TasksUpdateDueDateInput) => defaultApiClient.apiNamespaceTasks.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<TasksUpdateDueDateInput, TasksUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateDueDate(input),
      ),

    updateName: (input: TasksUpdateNameInput) => defaultApiClient.apiNamespaceTasks.updateName(input),
    useUpdateName: () =>
      useMutation<TasksUpdateNameInput, TasksUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateName(input),
      ),
  },

  project_milestones: {
    listTasks: (input: ProjectMilestonesListTasksInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.listTasks(input),
    useListTasks: (input: ProjectMilestonesListTasksInput) =>
      useQuery<ProjectMilestonesListTasksResult>(() => defaultApiClient.apiNamespaceProjectMilestones.listTasks(input)),

    delete: (input: ProjectMilestonesDeleteInput) => defaultApiClient.apiNamespaceProjectMilestones.delete(input),
    useDelete: () =>
      useMutation<ProjectMilestonesDeleteInput, ProjectMilestonesDeleteResult>((input) =>
        defaultApiClient.apiNamespaceProjectMilestones.delete(input),
      ),

    updateDescription: (input: ProjectMilestonesUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<ProjectMilestonesUpdateDescriptionInput, ProjectMilestonesUpdateDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceProjectMilestones.updateDescription(input),
      ),

    updateDueDate: (input: ProjectMilestonesUpdateDueDateInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<ProjectMilestonesUpdateDueDateInput, ProjectMilestonesUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceProjectMilestones.updateDueDate(input),
      ),

    updateKanban: (input: ProjectMilestonesUpdateKanbanInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.updateKanban(input),
    useUpdateKanban: () =>
      useMutation<ProjectMilestonesUpdateKanbanInput, ProjectMilestonesUpdateKanbanResult>((input) =>
        defaultApiClient.apiNamespaceProjectMilestones.updateKanban(input),
      ),

    updateTitle: (input: ProjectMilestonesUpdateTitleInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.updateTitle(input),
    useUpdateTitle: () =>
      useMutation<ProjectMilestonesUpdateTitleInput, ProjectMilestonesUpdateTitleResult>((input) =>
        defaultApiClient.apiNamespaceProjectMilestones.updateTitle(input),
      ),

    updateOrdering: (input: ProjectMilestonesUpdateOrderingInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.updateOrdering(input),
    useUpdateOrdering: () =>
      useMutation<ProjectMilestonesUpdateOrderingInput, ProjectMilestonesUpdateOrderingResult>((input) =>
        defaultApiClient.apiNamespaceProjectMilestones.updateOrdering(input),
      ),
  },

  projects: {
    countChildren: (input: ProjectsCountChildrenInput) => defaultApiClient.apiNamespaceProjects.countChildren(input),
    useCountChildren: (input: ProjectsCountChildrenInput) =>
      useQuery<ProjectsCountChildrenResult>(() => defaultApiClient.apiNamespaceProjects.countChildren(input)),

    getContributors: (input: ProjectsGetContributorsInput) =>
      defaultApiClient.apiNamespaceProjects.getContributors(input),
    useGetContributors: (input: ProjectsGetContributorsInput) =>
      useQuery<ProjectsGetContributorsResult>(() => defaultApiClient.apiNamespaceProjects.getContributors(input)),

    parentGoalSearch: (input: ProjectsParentGoalSearchInput) =>
      defaultApiClient.apiNamespaceProjects.parentGoalSearch(input),
    useParentGoalSearch: (input: ProjectsParentGoalSearchInput) =>
      useQuery<ProjectsParentGoalSearchResult>(() => defaultApiClient.apiNamespaceProjects.parentGoalSearch(input)),

    getMilestones: (input: ProjectsGetMilestonesInput) => defaultApiClient.apiNamespaceProjects.getMilestones(input),
    useGetMilestones: (input: ProjectsGetMilestonesInput) =>
      useQuery<ProjectsGetMilestonesResult>(() => defaultApiClient.apiNamespaceProjects.getMilestones(input)),

    updateParentGoal: (input: ProjectsUpdateParentGoalInput) =>
      defaultApiClient.apiNamespaceProjects.updateParentGoal(input),
    useUpdateParentGoal: () =>
      useMutation<ProjectsUpdateParentGoalInput, ProjectsUpdateParentGoalResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateParentGoal(input),
      ),

    createMilestone: (input: ProjectsCreateMilestoneInput) =>
      defaultApiClient.apiNamespaceProjects.createMilestone(input),
    useCreateMilestone: () =>
      useMutation<ProjectsCreateMilestoneInput, ProjectsCreateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createMilestone(input),
      ),

    updateDueDate: (input: ProjectsUpdateDueDateInput) => defaultApiClient.apiNamespaceProjects.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<ProjectsUpdateDueDateInput, ProjectsUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateDueDate(input),
      ),

    updateStartDate: (input: ProjectsUpdateStartDateInput) =>
      defaultApiClient.apiNamespaceProjects.updateStartDate(input),
    useUpdateStartDate: () =>
      useMutation<ProjectsUpdateStartDateInput, ProjectsUpdateStartDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateStartDate(input),
      ),

    updateKanban: (input: ProjectsUpdateKanbanInput) => defaultApiClient.apiNamespaceProjects.updateKanban(input),
    useUpdateKanban: () =>
      useMutation<ProjectsUpdateKanbanInput, ProjectsUpdateKanbanResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateKanban(input),
      ),

    updateReviewer: (input: ProjectsUpdateReviewerInput) => defaultApiClient.apiNamespaceProjects.updateReviewer(input),
    useUpdateReviewer: () =>
      useMutation<ProjectsUpdateReviewerInput, ProjectsUpdateReviewerResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateReviewer(input),
      ),

    updateTaskStatuses: (input: ProjectsUpdateTaskStatusesInput) =>
      defaultApiClient.apiNamespaceProjects.updateTaskStatuses(input),
    useUpdateTaskStatuses: () =>
      useMutation<ProjectsUpdateTaskStatusesInput, ProjectsUpdateTaskStatusesResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateTaskStatuses(input),
      ),

    updateMilestone: (input: ProjectsUpdateMilestoneInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestone(input),
    useUpdateMilestone: () =>
      useMutation<ProjectsUpdateMilestoneInput, ProjectsUpdateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestone(input),
      ),

    updateChampion: (input: ProjectsUpdateChampionInput) => defaultApiClient.apiNamespaceProjects.updateChampion(input),
    useUpdateChampion: () =>
      useMutation<ProjectsUpdateChampionInput, ProjectsUpdateChampionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateChampion(input),
      ),

    delete: (input: ProjectsDeleteInput) => defaultApiClient.apiNamespaceProjects.delete(input),
    useDelete: () =>
      useMutation<ProjectsDeleteInput, ProjectsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceProjects.delete(input),
      ),
  },

  goals: {
    listAccessMembers: (input: GoalsListAccessMembersInput) =>
      defaultApiClient.apiNamespaceGoals.listAccessMembers(input),
    useListAccessMembers: (input: GoalsListAccessMembersInput) =>
      useQuery<GoalsListAccessMembersResult>(() => defaultApiClient.apiNamespaceGoals.listAccessMembers(input)),

    parentGoalSearch: (input: GoalsParentGoalSearchInput) => defaultApiClient.apiNamespaceGoals.parentGoalSearch(input),
    useParentGoalSearch: (input: GoalsParentGoalSearchInput) =>
      useQuery<GoalsParentGoalSearchResult>(() => defaultApiClient.apiNamespaceGoals.parentGoalSearch(input)),

    getDiscussions: (input: GoalsGetDiscussionsInput) => defaultApiClient.apiNamespaceGoals.getDiscussions(input),
    useGetDiscussions: (input: GoalsGetDiscussionsInput) =>
      useQuery<GoalsGetDiscussionsResult>(() => defaultApiClient.apiNamespaceGoals.getDiscussions(input)),

    getCheckIns: (input: GoalsGetCheckInsInput) => defaultApiClient.apiNamespaceGoals.getCheckIns(input),
    useGetCheckIns: (input: GoalsGetCheckInsInput) =>
      useQuery<GoalsGetCheckInsResult>(() => defaultApiClient.apiNamespaceGoals.getCheckIns(input)),

    updateName: (input: GoalsUpdateNameInput) => defaultApiClient.apiNamespaceGoals.updateName(input),
    useUpdateName: () =>
      useMutation<GoalsUpdateNameInput, GoalsUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateName(input),
      ),

    updateAccessMember: (input: GoalsUpdateAccessMemberInput) =>
      defaultApiClient.apiNamespaceGoals.updateAccessMember(input),
    useUpdateAccessMember: () =>
      useMutation<GoalsUpdateAccessMemberInput, GoalsUpdateAccessMemberResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateAccessMember(input),
      ),

    updateTargetIndex: (input: GoalsUpdateTargetIndexInput) =>
      defaultApiClient.apiNamespaceGoals.updateTargetIndex(input),
    useUpdateTargetIndex: () =>
      useMutation<GoalsUpdateTargetIndexInput, GoalsUpdateTargetIndexResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateTargetIndex(input),
      ),

    addTarget: (input: GoalsAddTargetInput) => defaultApiClient.apiNamespaceGoals.addTarget(input),
    useAddTarget: () =>
      useMutation<GoalsAddTargetInput, GoalsAddTargetResult>((input) =>
        defaultApiClient.apiNamespaceGoals.addTarget(input),
      ),

    updateAccessLevels: (input: GoalsUpdateAccessLevelsInput) =>
      defaultApiClient.apiNamespaceGoals.updateAccessLevels(input),
    useUpdateAccessLevels: () =>
      useMutation<GoalsUpdateAccessLevelsInput, GoalsUpdateAccessLevelsResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateAccessLevels(input),
      ),

    updateParentGoal: (input: GoalsUpdateParentGoalInput) => defaultApiClient.apiNamespaceGoals.updateParentGoal(input),
    useUpdateParentGoal: () =>
      useMutation<GoalsUpdateParentGoalInput, GoalsUpdateParentGoalResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateParentGoal(input),
      ),

    updateTarget: (input: GoalsUpdateTargetInput) => defaultApiClient.apiNamespaceGoals.updateTarget(input),
    useUpdateTarget: () =>
      useMutation<GoalsUpdateTargetInput, GoalsUpdateTargetResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateTarget(input),
      ),

    addCheck: (input: GoalsAddCheckInput) => defaultApiClient.apiNamespaceGoals.addCheck(input),
    useAddCheck: () =>
      useMutation<GoalsAddCheckInput, GoalsAddCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.addCheck(input),
      ),

    deleteTarget: (input: GoalsDeleteTargetInput) => defaultApiClient.apiNamespaceGoals.deleteTarget(input),
    useDeleteTarget: () =>
      useMutation<GoalsDeleteTargetInput, GoalsDeleteTargetResult>((input) =>
        defaultApiClient.apiNamespaceGoals.deleteTarget(input),
      ),

    updateCheckIndex: (input: GoalsUpdateCheckIndexInput) => defaultApiClient.apiNamespaceGoals.updateCheckIndex(input),
    useUpdateCheckIndex: () =>
      useMutation<GoalsUpdateCheckIndexInput, GoalsUpdateCheckIndexResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateCheckIndex(input),
      ),

    updateDueDate: (input: GoalsUpdateDueDateInput) => defaultApiClient.apiNamespaceGoals.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<GoalsUpdateDueDateInput, GoalsUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateDueDate(input),
      ),

    updateCheck: (input: GoalsUpdateCheckInput) => defaultApiClient.apiNamespaceGoals.updateCheck(input),
    useUpdateCheck: () =>
      useMutation<GoalsUpdateCheckInput, GoalsUpdateCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateCheck(input),
      ),

    updateStartDate: (input: GoalsUpdateStartDateInput) => defaultApiClient.apiNamespaceGoals.updateStartDate(input),
    useUpdateStartDate: () =>
      useMutation<GoalsUpdateStartDateInput, GoalsUpdateStartDateResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateStartDate(input),
      ),

    updateDescription: (input: GoalsUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceGoals.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<GoalsUpdateDescriptionInput, GoalsUpdateDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateDescription(input),
      ),

    updateSpace: (input: GoalsUpdateSpaceInput) => defaultApiClient.apiNamespaceGoals.updateSpace(input),
    useUpdateSpace: () =>
      useMutation<GoalsUpdateSpaceInput, GoalsUpdateSpaceResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateSpace(input),
      ),

    toggleCheck: (input: GoalsToggleCheckInput) => defaultApiClient.apiNamespaceGoals.toggleCheck(input),
    useToggleCheck: () =>
      useMutation<GoalsToggleCheckInput, GoalsToggleCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.toggleCheck(input),
      ),

    updateTargetValue: (input: GoalsUpdateTargetValueInput) =>
      defaultApiClient.apiNamespaceGoals.updateTargetValue(input),
    useUpdateTargetValue: () =>
      useMutation<GoalsUpdateTargetValueInput, GoalsUpdateTargetValueResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateTargetValue(input),
      ),

    deleteCheck: (input: GoalsDeleteCheckInput) => defaultApiClient.apiNamespaceGoals.deleteCheck(input),
    useDeleteCheck: () =>
      useMutation<GoalsDeleteCheckInput, GoalsDeleteCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.deleteCheck(input),
      ),

    updateChampion: (input: GoalsUpdateChampionInput) => defaultApiClient.apiNamespaceGoals.updateChampion(input),
    useUpdateChampion: () =>
      useMutation<GoalsUpdateChampionInput, GoalsUpdateChampionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateChampion(input),
      ),

    removeAccessMember: (input: GoalsRemoveAccessMemberInput) =>
      defaultApiClient.apiNamespaceGoals.removeAccessMember(input),
    useRemoveAccessMember: () =>
      useMutation<GoalsRemoveAccessMemberInput, GoalsRemoveAccessMemberResult>((input) =>
        defaultApiClient.apiNamespaceGoals.removeAccessMember(input),
      ),

    addAccessMembers: (input: GoalsAddAccessMembersInput) => defaultApiClient.apiNamespaceGoals.addAccessMembers(input),
    useAddAccessMembers: () =>
      useMutation<GoalsAddAccessMembersInput, GoalsAddAccessMembersResult>((input) =>
        defaultApiClient.apiNamespaceGoals.addAccessMembers(input),
      ),

    updateReviewer: (input: GoalsUpdateReviewerInput) => defaultApiClient.apiNamespaceGoals.updateReviewer(input),
    useUpdateReviewer: () =>
      useMutation<GoalsUpdateReviewerInput, GoalsUpdateReviewerResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateReviewer(input),
      ),
  },

  ai: {
    getConversations: (input: AiGetConversationsInput) => defaultApiClient.apiNamespaceAi.getConversations(input),
    useGetConversations: (input: AiGetConversationsInput) =>
      useQuery<AiGetConversationsResult>(() => defaultApiClient.apiNamespaceAi.getConversations(input)),

    listAgents: (input: AiListAgentsInput) => defaultApiClient.apiNamespaceAi.listAgents(input),
    useListAgents: (input: AiListAgentsInput) =>
      useQuery<AiListAgentsResult>(() => defaultApiClient.apiNamespaceAi.listAgents(input)),

    getAgent: (input: AiGetAgentInput) => defaultApiClient.apiNamespaceAi.getAgent(input),
    useGetAgent: (input: AiGetAgentInput) =>
      useQuery<AiGetAgentResult>(() => defaultApiClient.apiNamespaceAi.getAgent(input)),

    getAgentRun: (input: AiGetAgentRunInput) => defaultApiClient.apiNamespaceAi.getAgentRun(input),
    useGetAgentRun: (input: AiGetAgentRunInput) =>
      useQuery<AiGetAgentRunResult>(() => defaultApiClient.apiNamespaceAi.getAgentRun(input)),

    prompt: (input: AiPromptInput) => defaultApiClient.apiNamespaceAi.prompt(input),
    usePrompt: (input: AiPromptInput) => useQuery<AiPromptResult>(() => defaultApiClient.apiNamespaceAi.prompt(input)),

    listAgentRuns: (input: AiListAgentRunsInput) => defaultApiClient.apiNamespaceAi.listAgentRuns(input),
    useListAgentRuns: (input: AiListAgentRunsInput) =>
      useQuery<AiListAgentRunsResult>(() => defaultApiClient.apiNamespaceAi.listAgentRuns(input)),

    getConversationMessages: (input: AiGetConversationMessagesInput) =>
      defaultApiClient.apiNamespaceAi.getConversationMessages(input),
    useGetConversationMessages: (input: AiGetConversationMessagesInput) =>
      useQuery<AiGetConversationMessagesResult>(() => defaultApiClient.apiNamespaceAi.getConversationMessages(input)),

    addAgent: (input: AiAddAgentInput) => defaultApiClient.apiNamespaceAi.addAgent(input),
    useAddAgent: () =>
      useMutation<AiAddAgentInput, AiAddAgentResult>((input) => defaultApiClient.apiNamespaceAi.addAgent(input)),

    editAgentSandboxMode: (input: AiEditAgentSandboxModeInput) =>
      defaultApiClient.apiNamespaceAi.editAgentSandboxMode(input),
    useEditAgentSandboxMode: () =>
      useMutation<AiEditAgentSandboxModeInput, AiEditAgentSandboxModeResult>((input) =>
        defaultApiClient.apiNamespaceAi.editAgentSandboxMode(input),
      ),

    editAgentTaskExecutionInstructions: (input: AiEditAgentTaskExecutionInstructionsInput) =>
      defaultApiClient.apiNamespaceAi.editAgentTaskExecutionInstructions(input),
    useEditAgentTaskExecutionInstructions: () =>
      useMutation<AiEditAgentTaskExecutionInstructionsInput, AiEditAgentTaskExecutionInstructionsResult>((input) =>
        defaultApiClient.apiNamespaceAi.editAgentTaskExecutionInstructions(input),
      ),

    editAgentPlanningInstructions: (input: AiEditAgentPlanningInstructionsInput) =>
      defaultApiClient.apiNamespaceAi.editAgentPlanningInstructions(input),
    useEditAgentPlanningInstructions: () =>
      useMutation<AiEditAgentPlanningInstructionsInput, AiEditAgentPlanningInstructionsResult>((input) =>
        defaultApiClient.apiNamespaceAi.editAgentPlanningInstructions(input),
      ),

    createConversation: (input: AiCreateConversationInput) => defaultApiClient.apiNamespaceAi.createConversation(input),
    useCreateConversation: () =>
      useMutation<AiCreateConversationInput, AiCreateConversationResult>((input) =>
        defaultApiClient.apiNamespaceAi.createConversation(input),
      ),

    sendMessage: (input: AiSendMessageInput) => defaultApiClient.apiNamespaceAi.sendMessage(input),
    useSendMessage: () =>
      useMutation<AiSendMessageInput, AiSendMessageResult>((input) =>
        defaultApiClient.apiNamespaceAi.sendMessage(input),
      ),

    editAgentVerbosity: (input: AiEditAgentVerbosityInput) => defaultApiClient.apiNamespaceAi.editAgentVerbosity(input),
    useEditAgentVerbosity: () =>
      useMutation<AiEditAgentVerbosityInput, AiEditAgentVerbosityResult>((input) =>
        defaultApiClient.apiNamespaceAi.editAgentVerbosity(input),
      ),

    runAgent: (input: AiRunAgentInput) => defaultApiClient.apiNamespaceAi.runAgent(input),
    useRunAgent: () =>
      useMutation<AiRunAgentInput, AiRunAgentResult>((input) => defaultApiClient.apiNamespaceAi.runAgent(input)),

    editAgentDefinition: (input: AiEditAgentDefinitionInput) =>
      defaultApiClient.apiNamespaceAi.editAgentDefinition(input),
    useEditAgentDefinition: () =>
      useMutation<AiEditAgentDefinitionInput, AiEditAgentDefinitionResult>((input) =>
        defaultApiClient.apiNamespaceAi.editAgentDefinition(input),
      ),

    editAgentProvider: (input: AiEditAgentProviderInput) => defaultApiClient.apiNamespaceAi.editAgentProvider(input),
    useEditAgentProvider: () =>
      useMutation<AiEditAgentProviderInput, AiEditAgentProviderResult>((input) =>
        defaultApiClient.apiNamespaceAi.editAgentProvider(input),
      ),

    editAgentDailyRun: (input: AiEditAgentDailyRunInput) => defaultApiClient.apiNamespaceAi.editAgentDailyRun(input),
    useEditAgentDailyRun: () =>
      useMutation<AiEditAgentDailyRunInput, AiEditAgentDailyRunResult>((input) =>
        defaultApiClient.apiNamespaceAi.editAgentDailyRun(input),
      ),
  },
};
