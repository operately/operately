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

export interface ActivityContentTaskMoving {
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

export interface ApiToken {
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

export interface ApiTokensListInput {}

export interface ApiTokensListResult {
  apiTokens: ApiToken[];
}

export interface CommentsListInput {
  entityId: Id;
  entityType: CommentParentType;
}

export interface CommentsListResult {
  comments: Comment[];
}

export interface CompaniesGetInput {
  id?: CompanyId;
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

export interface CompaniesListInput {
  includeMemberCount?: boolean | null;
}

export interface CompaniesListResult {
  companies?: Company[] | null;
}

export interface DocumentsGetInput {
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

export interface DocumentsGetResult {
  document: ResourceHubDocument;
}

export interface FilesGetInput {
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

export interface FilesGetResult {
  file: ResourceHubFile;
}

export interface FoldersGetInput {
  id?: Id | null;
  includeNodes?: boolean | null;
  includeResourceHub?: boolean | null;
  includePathToFolder?: boolean | null;
  includePermissions?: boolean | null;
  includePotentialSubscribers?: boolean | null;
}

export interface FoldersGetResult {
  folder?: ResourceHubFolder | null;
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

export interface GetNotificationsInput {
  page?: number | null;
  perPage?: number | null;
}

export interface GetNotificationsResult {
  notifications?: Notification[] | null;
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

export interface GoalCheckInsGetInput {
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

export interface GoalCheckInsGetResult {
  update: GoalProgressUpdate;
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

export interface GoalsListInput {
  spaceId?: string | null;
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
  goalId?: Id | null;
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

export interface LinksGetInput {
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

export interface LinksGetResult {
  link: ResourceHubLink;
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
  person?: Person | null;
}

export interface PeopleGetAccountInput {}

export interface PeopleGetAccountResult {
  account?: Account | null;
}

export interface PeopleGetAssignmentsCountInput {}

export interface PeopleGetAssignmentsCountResult {
  count?: number | null;
}

export interface PeopleGetBindedInput {
  resourseType?: string | null;
  resourseId?: string | null;
}

export interface PeopleGetBindedResult {
  people?: Person[] | null;
}

export interface PeopleGetMeInput {
  includeManager?: boolean | null;
}

export interface PeopleGetMeResult {
  me?: Person | null;
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
  people?: Person[] | null;
}

export interface PeopleListAssignmentsInput {}

export interface PeopleListAssignmentsResult {
  assignments: ReviewAssignment[];
}

export interface PeopleListPossibleManagersInput {
  userId?: Id;
  query?: string | null;
}

export interface PeopleListPossibleManagersResult {
  people: Person[];
}

export interface PeopleSearchInput {
  query?: string | null;
  ignoredIds?: string[] | null;
  searchScopeType?: string | null;
  searchScopeId?: string | null;
}

export interface PeopleSearchResult {
  people?: Person[] | null;
}

export interface ProjectCheckInsGetInput {
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

export interface ProjectCheckInsGetResult {
  projectCheckIn: ProjectCheckIn;
}

export interface ProjectCheckInsListInput {
  projectId: string;
  includeAuthor?: boolean;
  includeProject?: boolean;
  includeReactions?: boolean;
}

export interface ProjectCheckInsListResult {
  projectCheckIns?: ProjectCheckIn[] | null;
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

export interface ProjectMilestonesGetInput {
  id: Id;
  includeComments?: boolean;
  includeProject?: boolean;
  includeCreator?: boolean;
  includePermissions?: boolean;
  includeSpace?: boolean;
  includeSubscriptionList?: boolean;
  includeAvailableStatuses?: boolean;
}

export interface ProjectMilestonesGetResult {
  milestone: Milestone;
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

export interface ProjectsGetInput {
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

export interface ProjectsGetResult {
  project: Project;
  markdown?: string;
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

export interface ProjectsGetKeyResourceInput {
  id?: string | null;
}

export interface ProjectsGetKeyResourceResult {
  keyResource?: ProjectKeyResource | null;
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

export interface ProjectsListResult {
  projects?: Project[] | null;
}

export interface ProjectsListContributorsInput {
  projectId: Id;
  query?: string | null;
  ignoredIds?: Id[] | null;
}

export interface ProjectsListContributorsResult {
  contributors: Person[] | null;
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
  projectId?: string | null;
  query?: string | null;
}

export interface ProjectsSearchPotentialContributorsResult {
  people?: Person[] | null;
}

export interface ResourceHubsGetInput {
  id?: Id | null;
  includeSpace?: boolean | null;
  includeNodes?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includePermissions?: boolean | null;
}

export interface ResourceHubsGetResult {
  resourceHub?: ResourceHub | null;
}

export interface ResourceHubsListNodesInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  includeCommentsCount?: boolean | null;
  includeChildrenCount?: boolean | null;
}

export interface ResourceHubsListNodesResult {
  nodes?: ResourceHubNode[] | null;
  draftNodes?: ResourceHubNode[] | null;
}

export interface SpaceDiscussionsGetInput {
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

export interface SpaceDiscussionsGetResult {
  discussion: Discussion;
}

export interface SpaceDiscussionsListInput {
  spaceId?: Id | null;
  includeAuthor?: boolean | null;
  includeCommentsCount?: boolean | null;
  includeMyDrafts?: boolean | null;
}

export interface SpaceDiscussionsListResult {
  discussions?: Discussion[] | null;
  myDrafts?: Discussion[] | null;
}

export interface SpacesCountByAccessLevelInput {
  accessLevel: AccessOptions;
}

export interface SpacesCountByAccessLevelResult {
  count: number;
}

export interface SpacesGetInput {
  id?: Id | null;
  includePermissions?: boolean | null;
  includeMembers?: boolean | null;
  includeAccessLevels?: boolean | null;
  includeMembersAccessLevels?: boolean | null;
  includePotentialSubscribers?: boolean | null;
  includeUnreadNotifications?: boolean | null;
}

export interface SpacesGetResult {
  space?: Space | null;
}

export interface SpacesListInput {
  accessLevel?: AccessOptions;
  includeAccessLevels?: boolean;
  includeMembers?: boolean;
}

export interface SpacesListResult {
  spaces?: Space[] | null;
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
  groupId?: string | null;
  query?: string | null;
  excludeIds?: string[] | null;
  limit?: number | null;
}

export interface SpacesSearchPotentialMembersResult {
  people?: Person[] | null;
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
}

export interface TasksGetResult {
  task?: Task | null;
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
  people: Person[] | null;
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

export interface ChangePasswordInput {
  currentPassword?: string | null;
  newPassword?: string | null;
  newPasswordConfirmation?: string | null;
}

export interface ChangePasswordResult {}

export interface CommentsCreateInput {
  entityId: Id;
  entityType: CommentParentType;
  content: string;
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
  content: string;
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
  companyName?: string | null;
  title?: string | null;
  isDemo?: boolean | null;
}

export interface CompaniesCreateResult {
  company?: Company | null;
}

export interface CompaniesCreateAdminsInput {
  peopleIds?: Id[] | null;
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

export interface CompaniesDeleteAdminInput {
  personId?: Id | null;
}

export interface CompaniesDeleteAdminResult {
  person?: Person | null;
}

export interface CompaniesDeleteMemberInput {
  personId: string;
}

export interface CompaniesDeleteMemberResult {
  person: Person;
}

export interface CompaniesDeleteOwnerInput {
  personId?: Id | null;
}

export interface CompaniesDeleteOwnerResult {}

export interface CompaniesDeleteTrustedEmailDomainInput {
  companyId?: string | null;
  domain?: string | null;
}

export interface CompaniesDeleteTrustedEmailDomainResult {
  company?: Company | null;
}

export interface CompaniesRestoreMemberInput {
  personId?: Id | null;
}

export interface CompaniesRestoreMemberResult {}

export interface CompaniesUpdateInput {
  name?: string | null;
}

export interface CompaniesUpdateResult {
  company?: Company | null;
}

export interface CompaniesUpdateMembersPermissionsInput {
  members: EditCompanyMemberPermissionsInput[];
}

export interface CompaniesUpdateMembersPermissionsResult {
  success: boolean;
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

export interface DeleteCompanyInput {}

export interface DeleteCompanyResult {
  success: boolean;
}

export interface DocumentsCreateInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  name?: string | null;
  content?: string | null;
  postAsDraft?: boolean | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
  copiedDocumentId?: Id | null;
}

export interface DocumentsCreateResult {
  document?: Document | null;
}

export interface DocumentsDeleteInput {
  documentId?: Id | null;
}

export interface DocumentsDeleteResult {
  document?: Document | null;
}

export interface DocumentsPublishInput {
  documentId: Id;
  name?: string | null;
  content?: Json | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface DocumentsPublishResult {
  document?: ResourceHubDocument | null;
}

export interface DocumentsUpdateInput {
  documentId: Id;
  name: string;
  content: Json;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface DocumentsUpdateResult {
  document?: ResourceHubDocument | null;
}

export interface EditGoalDiscussionInput {
  activityId?: Id | null;
  title?: string | null;
  message?: string | null;
}

export interface EditGoalDiscussionResult {}

export interface EditSubscriptionsListInput {
  id?: string | null;
  type?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface EditSubscriptionsListResult {}

export interface FilesCreateInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  files?: ResourceHubUploadedFile[] | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface FilesCreateResult {
  files?: ResourceHubFile[] | null;
}

export interface FilesDeleteInput {
  fileId?: Id | null;
}

export interface FilesDeleteResult {
  file?: ResourceHubFile | null;
}

export interface FilesUpdateInput {
  fileId?: Id | null;
  name?: string | null;
  description?: string | null;
}

export interface FilesUpdateResult {
  file?: ResourceHubFile | null;
}

export interface FoldersCopyInput {
  folderName?: string | null;
  folderId?: Id | null;
  destResourceHubId?: Id | null;
  destParentFolderId?: Id | null;
}

export interface FoldersCopyResult {
  folderId?: Id | null;
}

export interface FoldersCreateInput {
  resourceHubId?: string | null;
  folderId?: string | null;
  name?: string | null;
}

export interface FoldersCreateResult {
  folder?: ResourceHubFolder | null;
}

export interface FoldersDeleteInput {
  folderId?: Id | null;
}

export interface FoldersDeleteResult {
  success?: boolean | null;
}

export interface FoldersRenameInput {
  folderId?: Id | null;
  newName?: string | null;
}

export interface FoldersRenameResult {
  success?: boolean | null;
}

export interface GoalCheckInsAcknowledgeInput {
  id?: string | null;
}

export interface GoalCheckInsAcknowledgeResult {
  update?: GoalProgressUpdate | null;
}

export interface GoalCheckInsCreateInput {
  goalId: Id;
  status: string;
  dueDate: ContextualDate | null;
  checklist: GoalCheckUpdate[];
  content?: Json | null;
  newTargetValues?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface GoalCheckInsCreateResult {
  update?: GoalProgressUpdate | null;
}

export interface GoalCheckInsUpdateInput {
  id: Id;
  dueDate: ContextualDate | null;
  status?: string | null;
  content?: Json | null;
  newTargetValues?: string | null;
  checklist?: GoalCheckUpdate[];
}

export interface GoalCheckInsUpdateResult {
  update?: GoalProgressUpdate | null;
}

export interface GoalsChangeParentInput {
  goalId?: string | null;
  parentGoalId?: string | null;
}

export interface GoalsChangeParentResult {
  goal?: Goal | null;
}

export interface GoalsCloseInput {
  goalId: Id;
  success: string;
  retrospective: string;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
  successStatus: string;
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
  description?: string | null;
  parentGoalId?: Id | null;
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
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
  goalId?: Id | null;
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

export interface GoalsDeleteTargetInput {
  goalId: Id;
  targetId: Id;
}

export interface GoalsDeleteTargetResult {
  success: boolean;
}

export interface GoalsReopenInput {
  id?: Id | null;
  message?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface GoalsReopenResult {
  goal?: Goal | null;
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
  accessLevel: number;
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

export interface LinksCreateInput {
  resourceHubId?: Id | null;
  folderId?: Id | null;
  name?: string | null;
  url?: string | null;
  description?: string | null;
  type?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface LinksCreateResult {
  link?: ResourceHubLink | null;
}

export interface LinksDeleteInput {
  linkId?: Id | null;
}

export interface LinksDeleteResult {
  success?: boolean | null;
}

export interface LinksUpdateInput {
  linkId?: Id | null;
  name?: string | null;
  type?: string | null;
  url?: string | null;
  description?: string | null;
}

export interface LinksUpdateResult {
  link?: ResourceHubLink | null;
}

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

export interface PeopleUpdateInput {
  id?: string | null;
  fullName?: string | null;
  title?: string | null;
  timezone?: string | null;
  managerId?: string | null;
  theme?: string | null;
  notifyAboutAssignments?: boolean;
  description?: Json | null;
}

export interface PeopleUpdateResult {
  person?: Person | null;
}

export interface PeopleUpdatePictureInput {
  personId: string;
  avatarBlobId?: string | null;
  avatarUrl?: string | null;
}

export interface PeopleUpdatePictureResult {
  person: Person | null;
}

export interface PeopleUpdateThemeInput {
  theme: AccountTheme;
}

export interface PeopleUpdateThemeResult {
  success: boolean;
}

export interface ProjectCheckInsAcknowledgeInput {
  id: Id;
}

export interface ProjectCheckInsAcknowledgeResult {
  checkIn?: ProjectCheckIn | null;
}

export interface ProjectCheckInsCreateInput {
  projectId?: string | null;
  status?: string | null;
  description?: string | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: string[] | null;
}

export interface ProjectCheckInsCreateResult {
  checkIn?: ProjectCheckIn | null;
}

export interface ProjectCheckInsUpdateInput {
  checkInId?: string | null;
  status?: string | null;
  description?: string | null;
}

export interface ProjectCheckInsUpdateResult {
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

export interface ProjectDiscussionsUpdateInput {
  id: Id;
  title: string;
  message: Json;
  subscriberIds?: Id[];
}

export interface ProjectDiscussionsUpdateResult {
  discussion: Update;
}

export interface ProjectMilestonesCreateCommentInput {
  milestoneId: Id;
  content: Json | null;
  action: string;
}

export interface ProjectMilestonesCreateCommentResult {
  comment: MilestoneComment;
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

export interface ProjectsCloseInput {
  projectId: Id;
  retrospective: string;
  successStatus: string;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
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
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
}

export interface ProjectsCreateResult {
  project?: Project | null;
}

export interface ProjectsCreateContributorInput {
  projectId: Id;
  personId: Id;
  responsibility: string;
  permissions: AccessOptions;
  role: string | null;
}

export interface ProjectsCreateContributorResult {
  projectContributor?: ProjectContributor | null;
}

export interface ProjectsCreateContributorsInput {
  projectId: string;
  contributors: ProjectContributorInput[];
}

export interface ProjectsCreateContributorsResult {
  success: boolean;
}

export interface ProjectsCreateKeyResourceInput {
  projectId: Id;
  title: string;
  link: string;
  resourceType?: string;
}

export interface ProjectsCreateKeyResourceResult {
  keyResource: ProjectKeyResource;
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

export interface ProjectsDeleteContributorInput {
  contribId?: string | null;
}

export interface ProjectsDeleteContributorResult {
  projectContributor?: ProjectContributor | null;
}

export interface ProjectsDeleteKeyResourceInput {
  id: string;
}

export interface ProjectsDeleteKeyResourceResult {
  keyResource: ProjectKeyResource;
}

export interface ProjectsMoveToSpaceInput {
  projectId?: string | null;
  spaceId?: string | null;
}

export interface ProjectsMoveToSpaceResult {}

export interface ProjectsPauseInput {
  projectId?: string | null;
}

export interface ProjectsPauseResult {
  project?: Project | null;
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

export interface ProjectsUpdateContributorInput {
  contribId: Id;
  personId?: Id | null;
  responsibility?: string | null;
  permissions?: AccessOptions | null;
  role?: string | null;
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

export interface ProjectsUpdateKeyResourceInput {
  id: string;
  title: string;
  link: string;
}

export interface ProjectsUpdateKeyResourceResult {
  keyResource: ProjectKeyResource;
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

export interface ProjectsUpdateNameInput {
  projectId?: string | null;
  name?: string | null;
}

export interface ProjectsUpdateNameResult {
  project?: Project | null;
}

export interface ProjectsUpdateParentGoalInput {
  projectId: Id;
  goalId: Id | null;
  goalName: string | null;
}

export interface ProjectsUpdateParentGoalResult {
  success: boolean | null;
}

export interface ProjectsUpdatePermissionsInput {
  projectId?: string | null;
  accessLevels?: AccessLevels | null;
}

export interface ProjectsUpdatePermissionsResult {
  success?: boolean | null;
}

export interface ProjectsUpdateRetrospectiveInput {
  id: Id;
  content: string;
  successStatus: string;
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

export interface ResourceHubsCreateInput {
  spaceId?: string | null;
  name?: string | null;
  description?: string | null;
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
}

export interface ResourceHubsCreateResult {
  resourceHub?: ResourceHub | null;
}

export interface ResourceHubsUpdateParentFolderInput {
  resourceId?: Id | null;
  resourceType?: string | null;
  newFolderId?: Id | null;
}

export interface ResourceHubsUpdateParentFolderResult {
  success?: boolean | null;
}

export interface SpaceDiscussionsArchiveInput {
  messageId?: Id | null;
}

export interface SpaceDiscussionsArchiveResult {}

export interface SpaceDiscussionsCreateInput {
  spaceId: Id;
  title: string;
  body?: string | null;
  postAsDraft?: boolean | null;
  sendNotificationsToEveryone?: boolean | null;
  subscriberIds?: Id[] | null;
}

export interface SpaceDiscussionsCreateResult {
  discussion: Discussion;
}

export interface SpaceDiscussionsPublishInput {
  id?: Id | null;
}

export interface SpaceDiscussionsPublishResult {
  discussion?: Discussion | null;
}

export interface SpaceDiscussionsUpdateInput {
  id: Id;
  title?: string | null;
  body?: string | null;
  state?: string | null;
}

export interface SpaceDiscussionsUpdateResult {
  discussion: Discussion;
}

export interface SpacesAddMembersInput {
  spaceId: Id;
  members: AddMemberInput[];
}

export interface SpacesAddMembersResult {
  success: boolean;
}

export interface SpacesCreateInput {
  name?: string | null;
  mission?: string | null;
  companyPermissions?: number | null;
  publicPermissions?: number | null;
}

export interface SpacesCreateResult {
  space?: Space | null;
}

export interface SpacesDeleteInput {
  spaceId: Id;
}

export interface SpacesDeleteResult {
  space: Space;
}

export interface SpacesDeleteMemberInput {
  groupId: Id;
  memberId: Id;
}

export interface SpacesDeleteMemberResult {}

export interface SpacesJoinInput {
  spaceId?: Id | null;
}

export interface SpacesJoinResult {}

export interface SpacesUpdateInput {
  id: Id;
  name: string;
  mission: string;
}

export interface SpacesUpdateResult {
  space: Space;
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
  spaceId: string;
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

class ApiNamespaceRoot {
  constructor(private client: ApiClient) {}

  async getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return this.client.get("/get_activities", input);
  }

  async getActivity(input: GetActivityInput): Promise<GetActivityResult> {
    return this.client.get("/get_activity", input);
  }

  async getFlatWorkMap(input: GetFlatWorkMapInput): Promise<GetFlatWorkMapResult> {
    return this.client.get("/get_flat_work_map", input);
  }

  async getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
    return this.client.get("/get_notifications", input);
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

  async createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
    return this.client.post("/create_goal_discussion", input);
  }

  async deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
    return this.client.post("/delete_company", input);
  }

  async editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return this.client.post("/edit_goal_discussion", input);
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

  async markAllNotificationsAsRead(input: MarkAllNotificationsAsReadInput): Promise<MarkAllNotificationsAsReadResult> {
    return this.client.post("/mark_all_notifications_as_read", input);
  }

  async markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadResult> {
    return this.client.post("/mark_notification_as_read", input);
  }

  async markNotificationsAsRead(input: MarkNotificationsAsReadInput): Promise<MarkNotificationsAsReadResult> {
    return this.client.post("/mark_notifications_as_read", input);
  }

  async requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    return this.client.post("/request_password_reset", input);
  }

  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    return this.client.post("/reset_password", input);
  }

  async subscribeToNotifications(input: SubscribeToNotificationsInput): Promise<SubscribeToNotificationsResult> {
    return this.client.post("/subscribe_to_notifications", input);
  }

  async unsubscribeFromNotifications(
    input: UnsubscribeFromNotificationsInput,
  ): Promise<UnsubscribeFromNotificationsResult> {
    return this.client.post("/unsubscribe_from_notifications", input);
  }
}

class ApiNamespaceFolders {
  constructor(private client: ApiClient) {}

  async get(input: FoldersGetInput): Promise<FoldersGetResult> {
    return this.client.get("/folders/get", input);
  }

  async copy(input: FoldersCopyInput): Promise<FoldersCopyResult> {
    return this.client.post("/folders/copy", input);
  }

  async create(input: FoldersCreateInput): Promise<FoldersCreateResult> {
    return this.client.post("/folders/create", input);
  }

  async delete(input: FoldersDeleteInput): Promise<FoldersDeleteResult> {
    return this.client.post("/folders/delete", input);
  }

  async rename(input: FoldersRenameInput): Promise<FoldersRenameResult> {
    return this.client.post("/folders/rename", input);
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

class ApiNamespaceDocuments {
  constructor(private client: ApiClient) {}

  async get(input: DocumentsGetInput): Promise<DocumentsGetResult> {
    return this.client.get("/documents/get", input);
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

  async update(input: DocumentsUpdateInput): Promise<DocumentsUpdateResult> {
    return this.client.post("/documents/update", input);
  }
}

class ApiNamespaceResourceHubs {
  constructor(private client: ApiClient) {}

  async get(input: ResourceHubsGetInput): Promise<ResourceHubsGetResult> {
    return this.client.get("/resource_hubs/get", input);
  }

  async listNodes(input: ResourceHubsListNodesInput): Promise<ResourceHubsListNodesResult> {
    return this.client.get("/resource_hubs/list_nodes", input);
  }

  async create(input: ResourceHubsCreateInput): Promise<ResourceHubsCreateResult> {
    return this.client.post("/resource_hubs/create", input);
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

  async list(input: CompaniesListInput): Promise<CompaniesListResult> {
    return this.client.get("/companies/list", input);
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

class ApiNamespaceSpaces {
  constructor(private client: ApiClient) {}

  async countByAccessLevel(input: SpacesCountByAccessLevelInput): Promise<SpacesCountByAccessLevelResult> {
    return this.client.get("/spaces/count_by_access_level", input);
  }

  async get(input: SpacesGetInput): Promise<SpacesGetResult> {
    return this.client.get("/spaces/get", input);
  }

  async list(input: SpacesListInput): Promise<SpacesListResult> {
    return this.client.get("/spaces/list", input);
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

  async create(input: SpacesCreateInput): Promise<SpacesCreateResult> {
    return this.client.post("/spaces/create", input);
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

  async update(input: SpacesUpdateInput): Promise<SpacesUpdateResult> {
    return this.client.post("/spaces/update", input);
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

class ApiNamespaceSpaceDiscussions {
  constructor(private client: ApiClient) {}

  async get(input: SpaceDiscussionsGetInput): Promise<SpaceDiscussionsGetResult> {
    return this.client.get("/space_discussions/get", input);
  }

  async list(input: SpaceDiscussionsListInput): Promise<SpaceDiscussionsListResult> {
    return this.client.get("/space_discussions/list", input);
  }

  async archive(input: SpaceDiscussionsArchiveInput): Promise<SpaceDiscussionsArchiveResult> {
    return this.client.post("/space_discussions/archive", input);
  }

  async create(input: SpaceDiscussionsCreateInput): Promise<SpaceDiscussionsCreateResult> {
    return this.client.post("/space_discussions/create", input);
  }

  async publish(input: SpaceDiscussionsPublishInput): Promise<SpaceDiscussionsPublishResult> {
    return this.client.post("/space_discussions/publish", input);
  }

  async update(input: SpaceDiscussionsUpdateInput): Promise<SpaceDiscussionsUpdateResult> {
    return this.client.post("/space_discussions/update", input);
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

  async update(input: ProjectDiscussionsUpdateInput): Promise<ProjectDiscussionsUpdateResult> {
    return this.client.post("/project_discussions/update", input);
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

  async updateStatus(input: TasksUpdateStatusInput): Promise<TasksUpdateStatusResult> {
    return this.client.post("/tasks/update_status", input);
  }
}

class ApiNamespaceProjectCheckIns {
  constructor(private client: ApiClient) {}

  async get(input: ProjectCheckInsGetInput): Promise<ProjectCheckInsGetResult> {
    return this.client.get("/project_check_ins/get", input);
  }

  async list(input: ProjectCheckInsListInput): Promise<ProjectCheckInsListResult> {
    return this.client.get("/project_check_ins/list", input);
  }

  async acknowledge(input: ProjectCheckInsAcknowledgeInput): Promise<ProjectCheckInsAcknowledgeResult> {
    return this.client.post("/project_check_ins/acknowledge", input);
  }

  async create(input: ProjectCheckInsCreateInput): Promise<ProjectCheckInsCreateResult> {
    return this.client.post("/project_check_ins/create", input);
  }

  async update(input: ProjectCheckInsUpdateInput): Promise<ProjectCheckInsUpdateResult> {
    return this.client.post("/project_check_ins/update", input);
  }
}

class ApiNamespaceProjectMilestones {
  constructor(private client: ApiClient) {}

  async get(input: ProjectMilestonesGetInput): Promise<ProjectMilestonesGetResult> {
    return this.client.get("/project_milestones/get", input);
  }

  async listTasks(input: ProjectMilestonesListTasksInput): Promise<ProjectMilestonesListTasksResult> {
    return this.client.get("/project_milestones/list_tasks", input);
  }

  async createComment(input: ProjectMilestonesCreateCommentInput): Promise<ProjectMilestonesCreateCommentResult> {
    return this.client.post("/project_milestones/create_comment", input);
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

  async get(input: ProjectsGetInput): Promise<ProjectsGetResult> {
    return this.client.get("/projects/get", input);
  }

  async getContributor(input: ProjectsGetContributorInput): Promise<ProjectsGetContributorResult> {
    return this.client.get("/projects/get_contributor", input);
  }

  async getKeyResource(input: ProjectsGetKeyResourceInput): Promise<ProjectsGetKeyResourceResult> {
    return this.client.get("/projects/get_key_resource", input);
  }

  async getRetrospective(input: ProjectsGetRetrospectiveInput): Promise<ProjectsGetRetrospectiveResult> {
    return this.client.get("/projects/get_retrospective", input);
  }

  async list(input: ProjectsListInput): Promise<ProjectsListResult> {
    return this.client.get("/projects/list", input);
  }

  async listContributors(input: ProjectsListContributorsInput): Promise<ProjectsListContributorsResult> {
    return this.client.get("/projects/list_contributors", input);
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

  async close(input: ProjectsCloseInput): Promise<ProjectsCloseResult> {
    return this.client.post("/projects/close", input);
  }

  async create(input: ProjectsCreateInput): Promise<ProjectsCreateResult> {
    return this.client.post("/projects/create", input);
  }

  async createContributor(input: ProjectsCreateContributorInput): Promise<ProjectsCreateContributorResult> {
    return this.client.post("/projects/create_contributor", input);
  }

  async createContributors(input: ProjectsCreateContributorsInput): Promise<ProjectsCreateContributorsResult> {
    return this.client.post("/projects/create_contributors", input);
  }

  async createKeyResource(input: ProjectsCreateKeyResourceInput): Promise<ProjectsCreateKeyResourceResult> {
    return this.client.post("/projects/create_key_resource", input);
  }

  async createMilestone(input: ProjectsCreateMilestoneInput): Promise<ProjectsCreateMilestoneResult> {
    return this.client.post("/projects/create_milestone", input);
  }

  async delete(input: ProjectsDeleteInput): Promise<ProjectsDeleteResult> {
    return this.client.post("/projects/delete", input);
  }

  async deleteContributor(input: ProjectsDeleteContributorInput): Promise<ProjectsDeleteContributorResult> {
    return this.client.post("/projects/delete_contributor", input);
  }

  async deleteKeyResource(input: ProjectsDeleteKeyResourceInput): Promise<ProjectsDeleteKeyResourceResult> {
    return this.client.post("/projects/delete_key_resource", input);
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

  async updateContributor(input: ProjectsUpdateContributorInput): Promise<ProjectsUpdateContributorResult> {
    return this.client.post("/projects/update_contributor", input);
  }

  async updateDescription(input: ProjectsUpdateDescriptionInput): Promise<ProjectsUpdateDescriptionResult> {
    return this.client.post("/projects/update_description", input);
  }

  async updateDueDate(input: ProjectsUpdateDueDateInput): Promise<ProjectsUpdateDueDateResult> {
    return this.client.post("/projects/update_due_date", input);
  }

  async updateKanban(input: ProjectsUpdateKanbanInput): Promise<ProjectsUpdateKanbanResult> {
    return this.client.post("/projects/update_kanban", input);
  }

  async updateKeyResource(input: ProjectsUpdateKeyResourceInput): Promise<ProjectsUpdateKeyResourceResult> {
    return this.client.post("/projects/update_key_resource", input);
  }

  async updateMilestone(input: ProjectsUpdateMilestoneInput): Promise<ProjectsUpdateMilestoneResult> {
    return this.client.post("/projects/update_milestone", input);
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
}

class ApiNamespaceGoalCheckIns {
  constructor(private client: ApiClient) {}

  async get(input: GoalCheckInsGetInput): Promise<GoalCheckInsGetResult> {
    return this.client.get("/goal_check_ins/get", input);
  }

  async acknowledge(input: GoalCheckInsAcknowledgeInput): Promise<GoalCheckInsAcknowledgeResult> {
    return this.client.post("/goal_check_ins/acknowledge", input);
  }

  async create(input: GoalCheckInsCreateInput): Promise<GoalCheckInsCreateResult> {
    return this.client.post("/goal_check_ins/create", input);
  }

  async update(input: GoalCheckInsUpdateInput): Promise<GoalCheckInsUpdateResult> {
    return this.client.post("/goal_check_ins/update", input);
  }
}

class ApiNamespaceGoals {
  constructor(private client: ApiClient) {}

  async get(input: GoalsGetInput): Promise<GoalsGetResult> {
    return this.client.get("/goals/get", input);
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
  public apiNamespaceApiTokens: ApiNamespaceApiTokens;
  public apiNamespaceInvitations: ApiNamespaceInvitations;
  public apiNamespaceAi: ApiNamespaceAi;
  public apiNamespaceRoot: ApiNamespaceRoot;
  public apiNamespaceFolders: ApiNamespaceFolders;
  public apiNamespaceLinks: ApiNamespaceLinks;
  public apiNamespaceFiles: ApiNamespaceFiles;
  public apiNamespaceDocuments: ApiNamespaceDocuments;
  public apiNamespaceResourceHubs: ApiNamespaceResourceHubs;
  public apiNamespaceComments: ApiNamespaceComments;
  public apiNamespaceCompanies: ApiNamespaceCompanies;
  public apiNamespacePeople: ApiNamespacePeople;
  public apiNamespaceSpaces: ApiNamespaceSpaces;
  public apiNamespaceSpaceDiscussions: ApiNamespaceSpaceDiscussions;
  public apiNamespaceProjectDiscussions: ApiNamespaceProjectDiscussions;
  public apiNamespaceTasks: ApiNamespaceTasks;
  public apiNamespaceProjectCheckIns: ApiNamespaceProjectCheckIns;
  public apiNamespaceProjectMilestones: ApiNamespaceProjectMilestones;
  public apiNamespaceProjects: ApiNamespaceProjects;
  public apiNamespaceGoalCheckIns: ApiNamespaceGoalCheckIns;
  public apiNamespaceGoals: ApiNamespaceGoals;
  public apiNamespaceReactions: ApiNamespaceReactions;

  constructor() {
    this.apiNamespaceApiTokens = new ApiNamespaceApiTokens(this);
    this.apiNamespaceInvitations = new ApiNamespaceInvitations(this);
    this.apiNamespaceAi = new ApiNamespaceAi(this);
    this.apiNamespaceRoot = new ApiNamespaceRoot(this);
    this.apiNamespaceFolders = new ApiNamespaceFolders(this);
    this.apiNamespaceLinks = new ApiNamespaceLinks(this);
    this.apiNamespaceFiles = new ApiNamespaceFiles(this);
    this.apiNamespaceDocuments = new ApiNamespaceDocuments(this);
    this.apiNamespaceResourceHubs = new ApiNamespaceResourceHubs(this);
    this.apiNamespaceComments = new ApiNamespaceComments(this);
    this.apiNamespaceCompanies = new ApiNamespaceCompanies(this);
    this.apiNamespacePeople = new ApiNamespacePeople(this);
    this.apiNamespaceSpaces = new ApiNamespaceSpaces(this);
    this.apiNamespaceSpaceDiscussions = new ApiNamespaceSpaceDiscussions(this);
    this.apiNamespaceProjectDiscussions = new ApiNamespaceProjectDiscussions(this);
    this.apiNamespaceTasks = new ApiNamespaceTasks(this);
    this.apiNamespaceProjectCheckIns = new ApiNamespaceProjectCheckIns(this);
    this.apiNamespaceProjectMilestones = new ApiNamespaceProjectMilestones(this);
    this.apiNamespaceProjects = new ApiNamespaceProjects(this);
    this.apiNamespaceGoalCheckIns = new ApiNamespaceGoalCheckIns(this);
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

  getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return this.apiNamespaceRoot.getActivities(input);
  }

  getActivity(input: GetActivityInput): Promise<GetActivityResult> {
    return this.apiNamespaceRoot.getActivity(input);
  }

  getFlatWorkMap(input: GetFlatWorkMapInput): Promise<GetFlatWorkMapResult> {
    return this.apiNamespaceRoot.getFlatWorkMap(input);
  }

  getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
    return this.apiNamespaceRoot.getNotifications(input);
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

  createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
    return this.apiNamespaceRoot.createGoalDiscussion(input);
  }

  deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
    return this.apiNamespaceRoot.deleteCompany(input);
  }

  editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return this.apiNamespaceRoot.editGoalDiscussion(input);
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

  markAllNotificationsAsRead(input: MarkAllNotificationsAsReadInput): Promise<MarkAllNotificationsAsReadResult> {
    return this.apiNamespaceRoot.markAllNotificationsAsRead(input);
  }

  markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadResult> {
    return this.apiNamespaceRoot.markNotificationAsRead(input);
  }

  markNotificationsAsRead(input: MarkNotificationsAsReadInput): Promise<MarkNotificationsAsReadResult> {
    return this.apiNamespaceRoot.markNotificationsAsRead(input);
  }

  requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    return this.apiNamespaceRoot.requestPasswordReset(input);
  }

  resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    return this.apiNamespaceRoot.resetPassword(input);
  }

  subscribeToNotifications(input: SubscribeToNotificationsInput): Promise<SubscribeToNotificationsResult> {
    return this.apiNamespaceRoot.subscribeToNotifications(input);
  }

  unsubscribeFromNotifications(input: UnsubscribeFromNotificationsInput): Promise<UnsubscribeFromNotificationsResult> {
    return this.apiNamespaceRoot.unsubscribeFromNotifications(input);
  }
}

const defaultApiClient = new ApiClient();

export async function getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
  return defaultApiClient.getActivities(input);
}
export async function getActivity(input: GetActivityInput): Promise<GetActivityResult> {
  return defaultApiClient.getActivity(input);
}
export async function getFlatWorkMap(input: GetFlatWorkMapInput): Promise<GetFlatWorkMapResult> {
  return defaultApiClient.getFlatWorkMap(input);
}
export async function getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
  return defaultApiClient.getNotifications(input);
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
export async function createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
  return defaultApiClient.createGoalDiscussion(input);
}
export async function deleteCompany(input: DeleteCompanyInput): Promise<DeleteCompanyResult> {
  return defaultApiClient.deleteCompany(input);
}
export async function editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
  return defaultApiClient.editGoalDiscussion(input);
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
export async function requestPasswordReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
  return defaultApiClient.requestPasswordReset(input);
}
export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  return defaultApiClient.resetPassword(input);
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

export function useGetActivities(input: GetActivitiesInput): UseQueryHookResult<GetActivitiesResult> {
  return useQuery<GetActivitiesResult>(() => defaultApiClient.getActivities(input));
}

export function useGetActivity(input: GetActivityInput): UseQueryHookResult<GetActivityResult> {
  return useQuery<GetActivityResult>(() => defaultApiClient.getActivity(input));
}

export function useGetFlatWorkMap(input: GetFlatWorkMapInput): UseQueryHookResult<GetFlatWorkMapResult> {
  return useQuery<GetFlatWorkMapResult>(() => defaultApiClient.getFlatWorkMap(input));
}

export function useGetNotifications(input: GetNotificationsInput): UseQueryHookResult<GetNotificationsResult> {
  return useQuery<GetNotificationsResult>(() => defaultApiClient.getNotifications(input));
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

export function useCreateGoalDiscussion(): UseMutationHookResult<
  CreateGoalDiscussionInput,
  CreateGoalDiscussionResult
> {
  return useMutation<CreateGoalDiscussionInput, CreateGoalDiscussionResult>((input) =>
    defaultApiClient.createGoalDiscussion(input),
  );
}

export function useDeleteCompany(): UseMutationHookResult<DeleteCompanyInput, DeleteCompanyResult> {
  return useMutation<DeleteCompanyInput, DeleteCompanyResult>((input) => defaultApiClient.deleteCompany(input));
}

export function useEditGoalDiscussion(): UseMutationHookResult<EditGoalDiscussionInput, EditGoalDiscussionResult> {
  return useMutation<EditGoalDiscussionInput, EditGoalDiscussionResult>((input) =>
    defaultApiClient.editGoalDiscussion(input),
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

export default {
  default: defaultApiClient,

  getActivities,
  useGetActivities,
  getActivity,
  useGetActivity,
  getFlatWorkMap,
  useGetFlatWorkMap,
  getNotifications,
  useGetNotifications,
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
  addCompanyOwners,
  useAddCompanyOwners,
  addCompanyTrustedEmailDomain,
  useAddCompanyTrustedEmailDomain,
  addFirstCompany,
  useAddFirstCompany,
  changePassword,
  useChangePassword,
  completeCompanySetup,
  useCompleteCompanySetup,
  createAccount,
  useCreateAccount,
  createAvatarBlob,
  useCreateAvatarBlob,
  createBlob,
  useCreateBlob,
  createEmailActivationCode,
  useCreateEmailActivationCode,
  createGoalDiscussion,
  useCreateGoalDiscussion,
  deleteCompany,
  useDeleteCompany,
  editGoalDiscussion,
  useEditGoalDiscussion,
  editSubscriptionsList,
  useEditSubscriptionsList,
  grantResourceAccess,
  useGrantResourceAccess,
  inviteGuest,
  useInviteGuest,
  joinCompany,
  useJoinCompany,
  markAllNotificationsAsRead,
  useMarkAllNotificationsAsRead,
  markNotificationAsRead,
  useMarkNotificationAsRead,
  markNotificationsAsRead,
  useMarkNotificationsAsRead,
  requestPasswordReset,
  useRequestPasswordReset,
  resetPassword,
  useResetPassword,
  subscribeToNotifications,
  useSubscribeToNotifications,
  unsubscribeFromNotifications,
  useUnsubscribeFromNotifications,

  api_tokens: {
    list: (input: ApiTokensListInput) => defaultApiClient.apiNamespaceApiTokens.list(input),
    useList: (input: ApiTokensListInput) =>
      useQuery<ApiTokensListResult>(() => defaultApiClient.apiNamespaceApiTokens.list(input)),

    create: (input: ApiTokensCreateInput) => defaultApiClient.apiNamespaceApiTokens.create(input),
    useCreate: () =>
      useMutation<ApiTokensCreateInput, ApiTokensCreateResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.create(input),
      ),

    setReadOnly: (input: ApiTokensSetReadOnlyInput) => defaultApiClient.apiNamespaceApiTokens.setReadOnly(input),
    useSetReadOnly: () =>
      useMutation<ApiTokensSetReadOnlyInput, ApiTokensSetReadOnlyResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.setReadOnly(input),
      ),

    updateName: (input: ApiTokensUpdateNameInput) => defaultApiClient.apiNamespaceApiTokens.updateName(input),
    useUpdateName: () =>
      useMutation<ApiTokensUpdateNameInput, ApiTokensUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.updateName(input),
      ),

    delete: (input: ApiTokensDeleteInput) => defaultApiClient.apiNamespaceApiTokens.delete(input),
    useDelete: () =>
      useMutation<ApiTokensDeleteInput, ApiTokensDeleteResult>((input) =>
        defaultApiClient.apiNamespaceApiTokens.delete(input),
      ),
  },

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

  folders: {
    get: (input: FoldersGetInput) => defaultApiClient.apiNamespaceFolders.get(input),
    useGet: (input: FoldersGetInput) =>
      useQuery<FoldersGetResult>(() => defaultApiClient.apiNamespaceFolders.get(input)),

    rename: (input: FoldersRenameInput) => defaultApiClient.apiNamespaceFolders.rename(input),
    useRename: () =>
      useMutation<FoldersRenameInput, FoldersRenameResult>((input) =>
        defaultApiClient.apiNamespaceFolders.rename(input),
      ),

    delete: (input: FoldersDeleteInput) => defaultApiClient.apiNamespaceFolders.delete(input),
    useDelete: () =>
      useMutation<FoldersDeleteInput, FoldersDeleteResult>((input) =>
        defaultApiClient.apiNamespaceFolders.delete(input),
      ),

    copy: (input: FoldersCopyInput) => defaultApiClient.apiNamespaceFolders.copy(input),
    useCopy: () =>
      useMutation<FoldersCopyInput, FoldersCopyResult>((input) => defaultApiClient.apiNamespaceFolders.copy(input)),

    create: (input: FoldersCreateInput) => defaultApiClient.apiNamespaceFolders.create(input),
    useCreate: () =>
      useMutation<FoldersCreateInput, FoldersCreateResult>((input) =>
        defaultApiClient.apiNamespaceFolders.create(input),
      ),
  },

  links: {
    get: (input: LinksGetInput) => defaultApiClient.apiNamespaceLinks.get(input),
    useGet: (input: LinksGetInput) => useQuery<LinksGetResult>(() => defaultApiClient.apiNamespaceLinks.get(input)),

    create: (input: LinksCreateInput) => defaultApiClient.apiNamespaceLinks.create(input),
    useCreate: () =>
      useMutation<LinksCreateInput, LinksCreateResult>((input) => defaultApiClient.apiNamespaceLinks.create(input)),

    update: (input: LinksUpdateInput) => defaultApiClient.apiNamespaceLinks.update(input),
    useUpdate: () =>
      useMutation<LinksUpdateInput, LinksUpdateResult>((input) => defaultApiClient.apiNamespaceLinks.update(input)),

    delete: (input: LinksDeleteInput) => defaultApiClient.apiNamespaceLinks.delete(input),
    useDelete: () =>
      useMutation<LinksDeleteInput, LinksDeleteResult>((input) => defaultApiClient.apiNamespaceLinks.delete(input)),
  },

  files: {
    get: (input: FilesGetInput) => defaultApiClient.apiNamespaceFiles.get(input),
    useGet: (input: FilesGetInput) => useQuery<FilesGetResult>(() => defaultApiClient.apiNamespaceFiles.get(input)),

    delete: (input: FilesDeleteInput) => defaultApiClient.apiNamespaceFiles.delete(input),
    useDelete: () =>
      useMutation<FilesDeleteInput, FilesDeleteResult>((input) => defaultApiClient.apiNamespaceFiles.delete(input)),

    update: (input: FilesUpdateInput) => defaultApiClient.apiNamespaceFiles.update(input),
    useUpdate: () =>
      useMutation<FilesUpdateInput, FilesUpdateResult>((input) => defaultApiClient.apiNamespaceFiles.update(input)),

    create: (input: FilesCreateInput) => defaultApiClient.apiNamespaceFiles.create(input),
    useCreate: () =>
      useMutation<FilesCreateInput, FilesCreateResult>((input) => defaultApiClient.apiNamespaceFiles.create(input)),
  },

  documents: {
    get: (input: DocumentsGetInput) => defaultApiClient.apiNamespaceDocuments.get(input),
    useGet: (input: DocumentsGetInput) =>
      useQuery<DocumentsGetResult>(() => defaultApiClient.apiNamespaceDocuments.get(input)),

    publish: (input: DocumentsPublishInput) => defaultApiClient.apiNamespaceDocuments.publish(input),
    usePublish: () =>
      useMutation<DocumentsPublishInput, DocumentsPublishResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.publish(input),
      ),

    update: (input: DocumentsUpdateInput) => defaultApiClient.apiNamespaceDocuments.update(input),
    useUpdate: () =>
      useMutation<DocumentsUpdateInput, DocumentsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.update(input),
      ),

    delete: (input: DocumentsDeleteInput) => defaultApiClient.apiNamespaceDocuments.delete(input),
    useDelete: () =>
      useMutation<DocumentsDeleteInput, DocumentsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.delete(input),
      ),

    create: (input: DocumentsCreateInput) => defaultApiClient.apiNamespaceDocuments.create(input),
    useCreate: () =>
      useMutation<DocumentsCreateInput, DocumentsCreateResult>((input) =>
        defaultApiClient.apiNamespaceDocuments.create(input),
      ),
  },

  resource_hubs: {
    listNodes: (input: ResourceHubsListNodesInput) => defaultApiClient.apiNamespaceResourceHubs.listNodes(input),
    useListNodes: (input: ResourceHubsListNodesInput) =>
      useQuery<ResourceHubsListNodesResult>(() => defaultApiClient.apiNamespaceResourceHubs.listNodes(input)),

    get: (input: ResourceHubsGetInput) => defaultApiClient.apiNamespaceResourceHubs.get(input),
    useGet: (input: ResourceHubsGetInput) =>
      useQuery<ResourceHubsGetResult>(() => defaultApiClient.apiNamespaceResourceHubs.get(input)),

    updateParentFolder: (input: ResourceHubsUpdateParentFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.updateParentFolder(input),
    useUpdateParentFolder: () =>
      useMutation<ResourceHubsUpdateParentFolderInput, ResourceHubsUpdateParentFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.updateParentFolder(input),
      ),

    create: (input: ResourceHubsCreateInput) => defaultApiClient.apiNamespaceResourceHubs.create(input),
    useCreate: () =>
      useMutation<ResourceHubsCreateInput, ResourceHubsCreateResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.create(input),
      ),
  },

  comments: {
    list: (input: CommentsListInput) => defaultApiClient.apiNamespaceComments.list(input),
    useList: (input: CommentsListInput) =>
      useQuery<CommentsListResult>(() => defaultApiClient.apiNamespaceComments.list(input)),

    delete: (input: CommentsDeleteInput) => defaultApiClient.apiNamespaceComments.delete(input),
    useDelete: () =>
      useMutation<CommentsDeleteInput, CommentsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceComments.delete(input),
      ),

    update: (input: CommentsUpdateInput) => defaultApiClient.apiNamespaceComments.update(input),
    useUpdate: () =>
      useMutation<CommentsUpdateInput, CommentsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceComments.update(input),
      ),

    create: (input: CommentsCreateInput) => defaultApiClient.apiNamespaceComments.create(input),
    useCreate: () =>
      useMutation<CommentsCreateInput, CommentsCreateResult>((input) =>
        defaultApiClient.apiNamespaceComments.create(input),
      ),
  },

  companies: {
    list: (input: CompaniesListInput) => defaultApiClient.apiNamespaceCompanies.list(input),
    useList: (input: CompaniesListInput) =>
      useQuery<CompaniesListResult>(() => defaultApiClient.apiNamespaceCompanies.list(input)),

    get: (input: CompaniesGetInput) => defaultApiClient.apiNamespaceCompanies.get(input),
    useGet: (input: CompaniesGetInput) =>
      useQuery<CompaniesGetResult>(() => defaultApiClient.apiNamespaceCompanies.get(input)),

    deleteOwner: (input: CompaniesDeleteOwnerInput) => defaultApiClient.apiNamespaceCompanies.deleteOwner(input),
    useDeleteOwner: () =>
      useMutation<CompaniesDeleteOwnerInput, CompaniesDeleteOwnerResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteOwner(input),
      ),

    createAdmins: (input: CompaniesCreateAdminsInput) => defaultApiClient.apiNamespaceCompanies.createAdmins(input),
    useCreateAdmins: () =>
      useMutation<CompaniesCreateAdminsInput, CompaniesCreateAdminsResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.createAdmins(input),
      ),

    deleteMember: (input: CompaniesDeleteMemberInput) => defaultApiClient.apiNamespaceCompanies.deleteMember(input),
    useDeleteMember: () =>
      useMutation<CompaniesDeleteMemberInput, CompaniesDeleteMemberResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteMember(input),
      ),

    createMember: (input: CompaniesCreateMemberInput) => defaultApiClient.apiNamespaceCompanies.createMember(input),
    useCreateMember: () =>
      useMutation<CompaniesCreateMemberInput, CompaniesCreateMemberResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.createMember(input),
      ),

    create: (input: CompaniesCreateInput) => defaultApiClient.apiNamespaceCompanies.create(input),
    useCreate: () =>
      useMutation<CompaniesCreateInput, CompaniesCreateResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.create(input),
      ),

    updateMembersPermissions: (input: CompaniesUpdateMembersPermissionsInput) =>
      defaultApiClient.apiNamespaceCompanies.updateMembersPermissions(input),
    useUpdateMembersPermissions: () =>
      useMutation<CompaniesUpdateMembersPermissionsInput, CompaniesUpdateMembersPermissionsResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.updateMembersPermissions(input),
      ),

    convertMemberToGuest: (input: CompaniesConvertMemberToGuestInput) =>
      defaultApiClient.apiNamespaceCompanies.convertMemberToGuest(input),
    useConvertMemberToGuest: () =>
      useMutation<CompaniesConvertMemberToGuestInput, CompaniesConvertMemberToGuestResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.convertMemberToGuest(input),
      ),

    deleteAdmin: (input: CompaniesDeleteAdminInput) => defaultApiClient.apiNamespaceCompanies.deleteAdmin(input),
    useDeleteAdmin: () =>
      useMutation<CompaniesDeleteAdminInput, CompaniesDeleteAdminResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteAdmin(input),
      ),

    deleteTrustedEmailDomain: (input: CompaniesDeleteTrustedEmailDomainInput) =>
      defaultApiClient.apiNamespaceCompanies.deleteTrustedEmailDomain(input),
    useDeleteTrustedEmailDomain: () =>
      useMutation<CompaniesDeleteTrustedEmailDomainInput, CompaniesDeleteTrustedEmailDomainResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteTrustedEmailDomain(input),
      ),

    update: (input: CompaniesUpdateInput) => defaultApiClient.apiNamespaceCompanies.update(input),
    useUpdate: () =>
      useMutation<CompaniesUpdateInput, CompaniesUpdateResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.update(input),
      ),

    restoreMember: (input: CompaniesRestoreMemberInput) => defaultApiClient.apiNamespaceCompanies.restoreMember(input),
    useRestoreMember: () =>
      useMutation<CompaniesRestoreMemberInput, CompaniesRestoreMemberResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.restoreMember(input),
      ),
  },

  people: {
    search: (input: PeopleSearchInput) => defaultApiClient.apiNamespacePeople.search(input),
    useSearch: (input: PeopleSearchInput) =>
      useQuery<PeopleSearchResult>(() => defaultApiClient.apiNamespacePeople.search(input)),

    list: (input: PeopleListInput) => defaultApiClient.apiNamespacePeople.list(input),
    useList: (input: PeopleListInput) =>
      useQuery<PeopleListResult>(() => defaultApiClient.apiNamespacePeople.list(input)),

    getAccount: (input: PeopleGetAccountInput) => defaultApiClient.apiNamespacePeople.getAccount(input),
    useGetAccount: (input: PeopleGetAccountInput) =>
      useQuery<PeopleGetAccountResult>(() => defaultApiClient.apiNamespacePeople.getAccount(input)),

    get: (input: PeopleGetInput) => defaultApiClient.apiNamespacePeople.get(input),
    useGet: (input: PeopleGetInput) => useQuery<PeopleGetResult>(() => defaultApiClient.apiNamespacePeople.get(input)),

    getBinded: (input: PeopleGetBindedInput) => defaultApiClient.apiNamespacePeople.getBinded(input),
    useGetBinded: (input: PeopleGetBindedInput) =>
      useQuery<PeopleGetBindedResult>(() => defaultApiClient.apiNamespacePeople.getBinded(input)),

    listAssignments: (input: PeopleListAssignmentsInput) => defaultApiClient.apiNamespacePeople.listAssignments(input),
    useListAssignments: (input: PeopleListAssignmentsInput) =>
      useQuery<PeopleListAssignmentsResult>(() => defaultApiClient.apiNamespacePeople.listAssignments(input)),

    listPossibleManagers: (input: PeopleListPossibleManagersInput) =>
      defaultApiClient.apiNamespacePeople.listPossibleManagers(input),
    useListPossibleManagers: (input: PeopleListPossibleManagersInput) =>
      useQuery<PeopleListPossibleManagersResult>(() => defaultApiClient.apiNamespacePeople.listPossibleManagers(input)),

    getAssignmentsCount: (input: PeopleGetAssignmentsCountInput) =>
      defaultApiClient.apiNamespacePeople.getAssignmentsCount(input),
    useGetAssignmentsCount: (input: PeopleGetAssignmentsCountInput) =>
      useQuery<PeopleGetAssignmentsCountResult>(() => defaultApiClient.apiNamespacePeople.getAssignmentsCount(input)),

    getMe: (input: PeopleGetMeInput) => defaultApiClient.apiNamespacePeople.getMe(input),
    useGetMe: (input: PeopleGetMeInput) =>
      useQuery<PeopleGetMeResult>(() => defaultApiClient.apiNamespacePeople.getMe(input)),

    update: (input: PeopleUpdateInput) => defaultApiClient.apiNamespacePeople.update(input),
    useUpdate: () =>
      useMutation<PeopleUpdateInput, PeopleUpdateResult>((input) => defaultApiClient.apiNamespacePeople.update(input)),

    updatePicture: (input: PeopleUpdatePictureInput) => defaultApiClient.apiNamespacePeople.updatePicture(input),
    useUpdatePicture: () =>
      useMutation<PeopleUpdatePictureInput, PeopleUpdatePictureResult>((input) =>
        defaultApiClient.apiNamespacePeople.updatePicture(input),
      ),

    updateTheme: (input: PeopleUpdateThemeInput) => defaultApiClient.apiNamespacePeople.updateTheme(input),
    useUpdateTheme: () =>
      useMutation<PeopleUpdateThemeInput, PeopleUpdateThemeResult>((input) =>
        defaultApiClient.apiNamespacePeople.updateTheme(input),
      ),
  },

  spaces: {
    countByAccessLevel: (input: SpacesCountByAccessLevelInput) =>
      defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input),
    useCountByAccessLevel: (input: SpacesCountByAccessLevelInput) =>
      useQuery<SpacesCountByAccessLevelResult>(() => defaultApiClient.apiNamespaceSpaces.countByAccessLevel(input)),

    get: (input: SpacesGetInput) => defaultApiClient.apiNamespaceSpaces.get(input),
    useGet: (input: SpacesGetInput) => useQuery<SpacesGetResult>(() => defaultApiClient.apiNamespaceSpaces.get(input)),

    search: (input: SpacesSearchInput) => defaultApiClient.apiNamespaceSpaces.search(input),
    useSearch: (input: SpacesSearchInput) =>
      useQuery<SpacesSearchResult>(() => defaultApiClient.apiNamespaceSpaces.search(input)),

    list: (input: SpacesListInput) => defaultApiClient.apiNamespaceSpaces.list(input),
    useList: (input: SpacesListInput) =>
      useQuery<SpacesListResult>(() => defaultApiClient.apiNamespaceSpaces.list(input)),

    listTools: (input: SpacesListToolsInput) => defaultApiClient.apiNamespaceSpaces.listTools(input),
    useListTools: (input: SpacesListToolsInput) =>
      useQuery<SpacesListToolsResult>(() => defaultApiClient.apiNamespaceSpaces.listTools(input)),

    listMembers: (input: SpacesListMembersInput) => defaultApiClient.apiNamespaceSpaces.listMembers(input),
    useListMembers: (input: SpacesListMembersInput) =>
      useQuery<SpacesListMembersResult>(() => defaultApiClient.apiNamespaceSpaces.listMembers(input)),

    searchPotentialMembers: (input: SpacesSearchPotentialMembersInput) =>
      defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
    useSearchPotentialMembers: (input: SpacesSearchPotentialMembersInput) =>
      useQuery<SpacesSearchPotentialMembersResult>(() =>
        defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
      ),

    listTasks: (input: SpacesListTasksInput) => defaultApiClient.apiNamespaceSpaces.listTasks(input),
    useListTasks: (input: SpacesListTasksInput) =>
      useQuery<SpacesListTasksResult>(() => defaultApiClient.apiNamespaceSpaces.listTasks(input)),

    updateMembersPermissions: (input: SpacesUpdateMembersPermissionsInput) =>
      defaultApiClient.apiNamespaceSpaces.updateMembersPermissions(input),
    useUpdateMembersPermissions: () =>
      useMutation<SpacesUpdateMembersPermissionsInput, SpacesUpdateMembersPermissionsResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateMembersPermissions(input),
      ),

    updatePermissions: (input: SpacesUpdatePermissionsInput) =>
      defaultApiClient.apiNamespaceSpaces.updatePermissions(input),
    useUpdatePermissions: () =>
      useMutation<SpacesUpdatePermissionsInput, SpacesUpdatePermissionsResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updatePermissions(input),
      ),

    updateTools: (input: SpacesUpdateToolsInput) => defaultApiClient.apiNamespaceSpaces.updateTools(input),
    useUpdateTools: () =>
      useMutation<SpacesUpdateToolsInput, SpacesUpdateToolsResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateTools(input),
      ),

    update: (input: SpacesUpdateInput) => defaultApiClient.apiNamespaceSpaces.update(input),
    useUpdate: () =>
      useMutation<SpacesUpdateInput, SpacesUpdateResult>((input) => defaultApiClient.apiNamespaceSpaces.update(input)),

    create: (input: SpacesCreateInput) => defaultApiClient.apiNamespaceSpaces.create(input),
    useCreate: () =>
      useMutation<SpacesCreateInput, SpacesCreateResult>((input) => defaultApiClient.apiNamespaceSpaces.create(input)),

    delete: (input: SpacesDeleteInput) => defaultApiClient.apiNamespaceSpaces.delete(input),
    useDelete: () =>
      useMutation<SpacesDeleteInput, SpacesDeleteResult>((input) => defaultApiClient.apiNamespaceSpaces.delete(input)),

    updateKanban: (input: SpacesUpdateKanbanInput) => defaultApiClient.apiNamespaceSpaces.updateKanban(input),
    useUpdateKanban: () =>
      useMutation<SpacesUpdateKanbanInput, SpacesUpdateKanbanResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateKanban(input),
      ),

    addMembers: (input: SpacesAddMembersInput) => defaultApiClient.apiNamespaceSpaces.addMembers(input),
    useAddMembers: () =>
      useMutation<SpacesAddMembersInput, SpacesAddMembersResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.addMembers(input),
      ),

    join: (input: SpacesJoinInput) => defaultApiClient.apiNamespaceSpaces.join(input),
    useJoin: () =>
      useMutation<SpacesJoinInput, SpacesJoinResult>((input) => defaultApiClient.apiNamespaceSpaces.join(input)),

    deleteMember: (input: SpacesDeleteMemberInput) => defaultApiClient.apiNamespaceSpaces.deleteMember(input),
    useDeleteMember: () =>
      useMutation<SpacesDeleteMemberInput, SpacesDeleteMemberResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.deleteMember(input),
      ),

    updateTaskStatuses: (input: SpacesUpdateTaskStatusesInput) =>
      defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
    useUpdateTaskStatuses: () =>
      useMutation<SpacesUpdateTaskStatusesInput, SpacesUpdateTaskStatusesResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
      ),
  },

  space_discussions: {
    get: (input: SpaceDiscussionsGetInput) => defaultApiClient.apiNamespaceSpaceDiscussions.get(input),
    useGet: (input: SpaceDiscussionsGetInput) =>
      useQuery<SpaceDiscussionsGetResult>(() => defaultApiClient.apiNamespaceSpaceDiscussions.get(input)),

    list: (input: SpaceDiscussionsListInput) => defaultApiClient.apiNamespaceSpaceDiscussions.list(input),
    useList: (input: SpaceDiscussionsListInput) =>
      useQuery<SpaceDiscussionsListResult>(() => defaultApiClient.apiNamespaceSpaceDiscussions.list(input)),

    archive: (input: SpaceDiscussionsArchiveInput) => defaultApiClient.apiNamespaceSpaceDiscussions.archive(input),
    useArchive: () =>
      useMutation<SpaceDiscussionsArchiveInput, SpaceDiscussionsArchiveResult>((input) =>
        defaultApiClient.apiNamespaceSpaceDiscussions.archive(input),
      ),

    create: (input: SpaceDiscussionsCreateInput) => defaultApiClient.apiNamespaceSpaceDiscussions.create(input),
    useCreate: () =>
      useMutation<SpaceDiscussionsCreateInput, SpaceDiscussionsCreateResult>((input) =>
        defaultApiClient.apiNamespaceSpaceDiscussions.create(input),
      ),

    publish: (input: SpaceDiscussionsPublishInput) => defaultApiClient.apiNamespaceSpaceDiscussions.publish(input),
    usePublish: () =>
      useMutation<SpaceDiscussionsPublishInput, SpaceDiscussionsPublishResult>((input) =>
        defaultApiClient.apiNamespaceSpaceDiscussions.publish(input),
      ),

    update: (input: SpaceDiscussionsUpdateInput) => defaultApiClient.apiNamespaceSpaceDiscussions.update(input),
    useUpdate: () =>
      useMutation<SpaceDiscussionsUpdateInput, SpaceDiscussionsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceSpaceDiscussions.update(input),
      ),
  },

  project_discussions: {
    list: (input: ProjectDiscussionsListInput) => defaultApiClient.apiNamespaceProjectDiscussions.list(input),
    useList: (input: ProjectDiscussionsListInput) =>
      useQuery<ProjectDiscussionsListResult>(() => defaultApiClient.apiNamespaceProjectDiscussions.list(input)),

    get: (input: ProjectDiscussionsGetInput) => defaultApiClient.apiNamespaceProjectDiscussions.get(input),
    useGet: (input: ProjectDiscussionsGetInput) =>
      useQuery<ProjectDiscussionsGetResult>(() => defaultApiClient.apiNamespaceProjectDiscussions.get(input)),

    create: (input: ProjectDiscussionsCreateInput) => defaultApiClient.apiNamespaceProjectDiscussions.create(input),
    useCreate: () =>
      useMutation<ProjectDiscussionsCreateInput, ProjectDiscussionsCreateResult>((input) =>
        defaultApiClient.apiNamespaceProjectDiscussions.create(input),
      ),

    update: (input: ProjectDiscussionsUpdateInput) => defaultApiClient.apiNamespaceProjectDiscussions.update(input),
    useUpdate: () =>
      useMutation<ProjectDiscussionsUpdateInput, ProjectDiscussionsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceProjectDiscussions.update(input),
      ),
  },

  tasks: {
    listPotentialAssignees: (input: TasksListPotentialAssigneesInput) =>
      defaultApiClient.apiNamespaceTasks.listPotentialAssignees(input),
    useListPotentialAssignees: (input: TasksListPotentialAssigneesInput) =>
      useQuery<TasksListPotentialAssigneesResult>(() =>
        defaultApiClient.apiNamespaceTasks.listPotentialAssignees(input),
      ),

    get: (input: TasksGetInput) => defaultApiClient.apiNamespaceTasks.get(input),
    useGet: (input: TasksGetInput) => useQuery<TasksGetResult>(() => defaultApiClient.apiNamespaceTasks.get(input)),

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

    move: (input: TasksMoveInput) => defaultApiClient.apiNamespaceTasks.move(input),
    useMove: () =>
      useMutation<TasksMoveInput, TasksMoveResult>((input) => defaultApiClient.apiNamespaceTasks.move(input)),

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

  project_check_ins: {
    list: (input: ProjectCheckInsListInput) => defaultApiClient.apiNamespaceProjectCheckIns.list(input),
    useList: (input: ProjectCheckInsListInput) =>
      useQuery<ProjectCheckInsListResult>(() => defaultApiClient.apiNamespaceProjectCheckIns.list(input)),

    get: (input: ProjectCheckInsGetInput) => defaultApiClient.apiNamespaceProjectCheckIns.get(input),
    useGet: (input: ProjectCheckInsGetInput) =>
      useQuery<ProjectCheckInsGetResult>(() => defaultApiClient.apiNamespaceProjectCheckIns.get(input)),

    acknowledge: (input: ProjectCheckInsAcknowledgeInput) =>
      defaultApiClient.apiNamespaceProjectCheckIns.acknowledge(input),
    useAcknowledge: () =>
      useMutation<ProjectCheckInsAcknowledgeInput, ProjectCheckInsAcknowledgeResult>((input) =>
        defaultApiClient.apiNamespaceProjectCheckIns.acknowledge(input),
      ),

    create: (input: ProjectCheckInsCreateInput) => defaultApiClient.apiNamespaceProjectCheckIns.create(input),
    useCreate: () =>
      useMutation<ProjectCheckInsCreateInput, ProjectCheckInsCreateResult>((input) =>
        defaultApiClient.apiNamespaceProjectCheckIns.create(input),
      ),

    update: (input: ProjectCheckInsUpdateInput) => defaultApiClient.apiNamespaceProjectCheckIns.update(input),
    useUpdate: () =>
      useMutation<ProjectCheckInsUpdateInput, ProjectCheckInsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceProjectCheckIns.update(input),
      ),
  },

  project_milestones: {
    listTasks: (input: ProjectMilestonesListTasksInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.listTasks(input),
    useListTasks: (input: ProjectMilestonesListTasksInput) =>
      useQuery<ProjectMilestonesListTasksResult>(() => defaultApiClient.apiNamespaceProjectMilestones.listTasks(input)),

    get: (input: ProjectMilestonesGetInput) => defaultApiClient.apiNamespaceProjectMilestones.get(input),
    useGet: (input: ProjectMilestonesGetInput) =>
      useQuery<ProjectMilestonesGetResult>(() => defaultApiClient.apiNamespaceProjectMilestones.get(input)),

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

    createComment: (input: ProjectMilestonesCreateCommentInput) =>
      defaultApiClient.apiNamespaceProjectMilestones.createComment(input),
    useCreateComment: () =>
      useMutation<ProjectMilestonesCreateCommentInput, ProjectMilestonesCreateCommentResult>((input) =>
        defaultApiClient.apiNamespaceProjectMilestones.createComment(input),
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
    searchPotentialContributors: (input: ProjectsSearchPotentialContributorsInput) =>
      defaultApiClient.apiNamespaceProjects.searchPotentialContributors(input),
    useSearchPotentialContributors: (input: ProjectsSearchPotentialContributorsInput) =>
      useQuery<ProjectsSearchPotentialContributorsResult>(() =>
        defaultApiClient.apiNamespaceProjects.searchPotentialContributors(input),
      ),

    countChildren: (input: ProjectsCountChildrenInput) => defaultApiClient.apiNamespaceProjects.countChildren(input),
    useCountChildren: (input: ProjectsCountChildrenInput) =>
      useQuery<ProjectsCountChildrenResult>(() => defaultApiClient.apiNamespaceProjects.countChildren(input)),

    getKeyResource: (input: ProjectsGetKeyResourceInput) => defaultApiClient.apiNamespaceProjects.getKeyResource(input),
    useGetKeyResource: (input: ProjectsGetKeyResourceInput) =>
      useQuery<ProjectsGetKeyResourceResult>(() => defaultApiClient.apiNamespaceProjects.getKeyResource(input)),

    list: (input: ProjectsListInput) => defaultApiClient.apiNamespaceProjects.list(input),
    useList: (input: ProjectsListInput) =>
      useQuery<ProjectsListResult>(() => defaultApiClient.apiNamespaceProjects.list(input)),

    searchParentGoal: (input: ProjectsSearchParentGoalInput) =>
      defaultApiClient.apiNamespaceProjects.searchParentGoal(input),
    useSearchParentGoal: (input: ProjectsSearchParentGoalInput) =>
      useQuery<ProjectsSearchParentGoalResult>(() => defaultApiClient.apiNamespaceProjects.searchParentGoal(input)),

    listContributors: (input: ProjectsListContributorsInput) =>
      defaultApiClient.apiNamespaceProjects.listContributors(input),
    useListContributors: (input: ProjectsListContributorsInput) =>
      useQuery<ProjectsListContributorsResult>(() => defaultApiClient.apiNamespaceProjects.listContributors(input)),

    get: (input: ProjectsGetInput) => defaultApiClient.apiNamespaceProjects.get(input),
    useGet: (input: ProjectsGetInput) =>
      useQuery<ProjectsGetResult>(() => defaultApiClient.apiNamespaceProjects.get(input)),

    getContributor: (input: ProjectsGetContributorInput) => defaultApiClient.apiNamespaceProjects.getContributor(input),
    useGetContributor: (input: ProjectsGetContributorInput) =>
      useQuery<ProjectsGetContributorResult>(() => defaultApiClient.apiNamespaceProjects.getContributor(input)),

    listMilestones: (input: ProjectsListMilestonesInput) => defaultApiClient.apiNamespaceProjects.listMilestones(input),
    useListMilestones: (input: ProjectsListMilestonesInput) =>
      useQuery<ProjectsListMilestonesResult>(() => defaultApiClient.apiNamespaceProjects.listMilestones(input)),

    getRetrospective: (input: ProjectsGetRetrospectiveInput) =>
      defaultApiClient.apiNamespaceProjects.getRetrospective(input),
    useGetRetrospective: (input: ProjectsGetRetrospectiveInput) =>
      useQuery<ProjectsGetRetrospectiveResult>(() => defaultApiClient.apiNamespaceProjects.getRetrospective(input)),

    search: (input: ProjectsSearchInput) => defaultApiClient.apiNamespaceProjects.search(input),
    useSearch: (input: ProjectsSearchInput) =>
      useQuery<ProjectsSearchResult>(() => defaultApiClient.apiNamespaceProjects.search(input)),

    createKeyResource: (input: ProjectsCreateKeyResourceInput) =>
      defaultApiClient.apiNamespaceProjects.createKeyResource(input),
    useCreateKeyResource: () =>
      useMutation<ProjectsCreateKeyResourceInput, ProjectsCreateKeyResourceResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createKeyResource(input),
      ),

    updateParentGoal: (input: ProjectsUpdateParentGoalInput) =>
      defaultApiClient.apiNamespaceProjects.updateParentGoal(input),
    useUpdateParentGoal: () =>
      useMutation<ProjectsUpdateParentGoalInput, ProjectsUpdateParentGoalResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateParentGoal(input),
      ),

    updateName: (input: ProjectsUpdateNameInput) => defaultApiClient.apiNamespaceProjects.updateName(input),
    useUpdateName: () =>
      useMutation<ProjectsUpdateNameInput, ProjectsUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateName(input),
      ),

    createMilestone: (input: ProjectsCreateMilestoneInput) =>
      defaultApiClient.apiNamespaceProjects.createMilestone(input),
    useCreateMilestone: () =>
      useMutation<ProjectsCreateMilestoneInput, ProjectsCreateMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createMilestone(input),
      ),

    pause: (input: ProjectsPauseInput) => defaultApiClient.apiNamespaceProjects.pause(input),
    usePause: () =>
      useMutation<ProjectsPauseInput, ProjectsPauseResult>((input) =>
        defaultApiClient.apiNamespaceProjects.pause(input),
      ),

    updateDescription: (input: ProjectsUpdateDescriptionInput) =>
      defaultApiClient.apiNamespaceProjects.updateDescription(input),
    useUpdateDescription: () =>
      useMutation<ProjectsUpdateDescriptionInput, ProjectsUpdateDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateDescription(input),
      ),

    createContributors: (input: ProjectsCreateContributorsInput) =>
      defaultApiClient.apiNamespaceProjects.createContributors(input),
    useCreateContributors: () =>
      useMutation<ProjectsCreateContributorsInput, ProjectsCreateContributorsResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createContributors(input),
      ),

    deleteContributor: (input: ProjectsDeleteContributorInput) =>
      defaultApiClient.apiNamespaceProjects.deleteContributor(input),
    useDeleteContributor: () =>
      useMutation<ProjectsDeleteContributorInput, ProjectsDeleteContributorResult>((input) =>
        defaultApiClient.apiNamespaceProjects.deleteContributor(input),
      ),

    updateDueDate: (input: ProjectsUpdateDueDateInput) => defaultApiClient.apiNamespaceProjects.updateDueDate(input),
    useUpdateDueDate: () =>
      useMutation<ProjectsUpdateDueDateInput, ProjectsUpdateDueDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateDueDate(input),
      ),

    updateRetrospective: (input: ProjectsUpdateRetrospectiveInput) =>
      defaultApiClient.apiNamespaceProjects.updateRetrospective(input),
    useUpdateRetrospective: () =>
      useMutation<ProjectsUpdateRetrospectiveInput, ProjectsUpdateRetrospectiveResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateRetrospective(input),
      ),

    moveToSpace: (input: ProjectsMoveToSpaceInput) => defaultApiClient.apiNamespaceProjects.moveToSpace(input),
    useMoveToSpace: () =>
      useMutation<ProjectsMoveToSpaceInput, ProjectsMoveToSpaceResult>((input) =>
        defaultApiClient.apiNamespaceProjects.moveToSpace(input),
      ),

    close: (input: ProjectsCloseInput) => defaultApiClient.apiNamespaceProjects.close(input),
    useClose: () =>
      useMutation<ProjectsCloseInput, ProjectsCloseResult>((input) =>
        defaultApiClient.apiNamespaceProjects.close(input),
      ),

    updateContributor: (input: ProjectsUpdateContributorInput) =>
      defaultApiClient.apiNamespaceProjects.updateContributor(input),
    useUpdateContributor: () =>
      useMutation<ProjectsUpdateContributorInput, ProjectsUpdateContributorResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateContributor(input),
      ),

    updatePermissions: (input: ProjectsUpdatePermissionsInput) =>
      defaultApiClient.apiNamespaceProjects.updatePermissions(input),
    useUpdatePermissions: () =>
      useMutation<ProjectsUpdatePermissionsInput, ProjectsUpdatePermissionsResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updatePermissions(input),
      ),

    updateStartDate: (input: ProjectsUpdateStartDateInput) =>
      defaultApiClient.apiNamespaceProjects.updateStartDate(input),
    useUpdateStartDate: () =>
      useMutation<ProjectsUpdateStartDateInput, ProjectsUpdateStartDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateStartDate(input),
      ),

    resume: (input: ProjectsResumeInput) => defaultApiClient.apiNamespaceProjects.resume(input),
    useResume: () =>
      useMutation<ProjectsResumeInput, ProjectsResumeResult>((input) =>
        defaultApiClient.apiNamespaceProjects.resume(input),
      ),

    updateKanban: (input: ProjectsUpdateKanbanInput) => defaultApiClient.apiNamespaceProjects.updateKanban(input),
    useUpdateKanban: () =>
      useMutation<ProjectsUpdateKanbanInput, ProjectsUpdateKanbanResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateKanban(input),
      ),

    create: (input: ProjectsCreateInput) => defaultApiClient.apiNamespaceProjects.create(input),
    useCreate: () =>
      useMutation<ProjectsCreateInput, ProjectsCreateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.create(input),
      ),

    updateKeyResource: (input: ProjectsUpdateKeyResourceInput) =>
      defaultApiClient.apiNamespaceProjects.updateKeyResource(input),
    useUpdateKeyResource: () =>
      useMutation<ProjectsUpdateKeyResourceInput, ProjectsUpdateKeyResourceResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateKeyResource(input),
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

    deleteKeyResource: (input: ProjectsDeleteKeyResourceInput) =>
      defaultApiClient.apiNamespaceProjects.deleteKeyResource(input),
    useDeleteKeyResource: () =>
      useMutation<ProjectsDeleteKeyResourceInput, ProjectsDeleteKeyResourceResult>((input) =>
        defaultApiClient.apiNamespaceProjects.deleteKeyResource(input),
      ),

    createContributor: (input: ProjectsCreateContributorInput) =>
      defaultApiClient.apiNamespaceProjects.createContributor(input),
    useCreateContributor: () =>
      useMutation<ProjectsCreateContributorInput, ProjectsCreateContributorResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createContributor(input),
      ),
  },

  goal_check_ins: {
    get: (input: GoalCheckInsGetInput) => defaultApiClient.apiNamespaceGoalCheckIns.get(input),
    useGet: (input: GoalCheckInsGetInput) =>
      useQuery<GoalCheckInsGetResult>(() => defaultApiClient.apiNamespaceGoalCheckIns.get(input)),

    update: (input: GoalCheckInsUpdateInput) => defaultApiClient.apiNamespaceGoalCheckIns.update(input),
    useUpdate: () =>
      useMutation<GoalCheckInsUpdateInput, GoalCheckInsUpdateResult>((input) =>
        defaultApiClient.apiNamespaceGoalCheckIns.update(input),
      ),

    create: (input: GoalCheckInsCreateInput) => defaultApiClient.apiNamespaceGoalCheckIns.create(input),
    useCreate: () =>
      useMutation<GoalCheckInsCreateInput, GoalCheckInsCreateResult>((input) =>
        defaultApiClient.apiNamespaceGoalCheckIns.create(input),
      ),

    acknowledge: (input: GoalCheckInsAcknowledgeInput) => defaultApiClient.apiNamespaceGoalCheckIns.acknowledge(input),
    useAcknowledge: () =>
      useMutation<GoalCheckInsAcknowledgeInput, GoalCheckInsAcknowledgeResult>((input) =>
        defaultApiClient.apiNamespaceGoalCheckIns.acknowledge(input),
      ),
  },

  goals: {
    listAccessMembers: (input: GoalsListAccessMembersInput) =>
      defaultApiClient.apiNamespaceGoals.listAccessMembers(input),
    useListAccessMembers: (input: GoalsListAccessMembersInput) =>
      useQuery<GoalsListAccessMembersResult>(() => defaultApiClient.apiNamespaceGoals.listAccessMembers(input)),

    list: (input: GoalsListInput) => defaultApiClient.apiNamespaceGoals.list(input),
    useList: (input: GoalsListInput) => useQuery<GoalsListResult>(() => defaultApiClient.apiNamespaceGoals.list(input)),

    listContributors: (input: GoalsListContributorsInput) => defaultApiClient.apiNamespaceGoals.listContributors(input),
    useListContributors: (input: GoalsListContributorsInput) =>
      useQuery<GoalsListContributorsResult>(() => defaultApiClient.apiNamespaceGoals.listContributors(input)),

    listCheckIns: (input: GoalsListCheckInsInput) => defaultApiClient.apiNamespaceGoals.listCheckIns(input),
    useListCheckIns: (input: GoalsListCheckInsInput) =>
      useQuery<GoalsListCheckInsResult>(() => defaultApiClient.apiNamespaceGoals.listCheckIns(input)),

    searchParentGoal: (input: GoalsSearchParentGoalInput) => defaultApiClient.apiNamespaceGoals.searchParentGoal(input),
    useSearchParentGoal: (input: GoalsSearchParentGoalInput) =>
      useQuery<GoalsSearchParentGoalResult>(() => defaultApiClient.apiNamespaceGoals.searchParentGoal(input)),

    get: (input: GoalsGetInput) => defaultApiClient.apiNamespaceGoals.get(input),
    useGet: (input: GoalsGetInput) => useQuery<GoalsGetResult>(() => defaultApiClient.apiNamespaceGoals.get(input)),

    listDiscussions: (input: GoalsListDiscussionsInput) => defaultApiClient.apiNamespaceGoals.listDiscussions(input),
    useListDiscussions: (input: GoalsListDiscussionsInput) =>
      useQuery<GoalsListDiscussionsResult>(() => defaultApiClient.apiNamespaceGoals.listDiscussions(input)),

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

    updateAccessLevels: (input: GoalsUpdateAccessLevelsInput) =>
      defaultApiClient.apiNamespaceGoals.updateAccessLevels(input),
    useUpdateAccessLevels: () =>
      useMutation<GoalsUpdateAccessLevelsInput, GoalsUpdateAccessLevelsResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateAccessLevels(input),
      ),

    changeParent: (input: GoalsChangeParentInput) => defaultApiClient.apiNamespaceGoals.changeParent(input),
    useChangeParent: () =>
      useMutation<GoalsChangeParentInput, GoalsChangeParentResult>((input) =>
        defaultApiClient.apiNamespaceGoals.changeParent(input),
      ),

    create: (input: GoalsCreateInput) => defaultApiClient.apiNamespaceGoals.create(input),
    useCreate: () =>
      useMutation<GoalsCreateInput, GoalsCreateResult>((input) => defaultApiClient.apiNamespaceGoals.create(input)),

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

    close: (input: GoalsCloseInput) => defaultApiClient.apiNamespaceGoals.close(input),
    useClose: () =>
      useMutation<GoalsCloseInput, GoalsCloseResult>((input) => defaultApiClient.apiNamespaceGoals.close(input)),

    createTarget: (input: GoalsCreateTargetInput) => defaultApiClient.apiNamespaceGoals.createTarget(input),
    useCreateTarget: () =>
      useMutation<GoalsCreateTargetInput, GoalsCreateTargetResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createTarget(input),
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

    createAccessMembers: (input: GoalsCreateAccessMembersInput) =>
      defaultApiClient.apiNamespaceGoals.createAccessMembers(input),
    useCreateAccessMembers: () =>
      useMutation<GoalsCreateAccessMembersInput, GoalsCreateAccessMembersResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createAccessMembers(input),
      ),

    createCheck: (input: GoalsCreateCheckInput) => defaultApiClient.apiNamespaceGoals.createCheck(input),
    useCreateCheck: () =>
      useMutation<GoalsCreateCheckInput, GoalsCreateCheckResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createCheck(input),
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

    delete: (input: GoalsDeleteInput) => defaultApiClient.apiNamespaceGoals.delete(input),
    useDelete: () =>
      useMutation<GoalsDeleteInput, GoalsDeleteResult>((input) => defaultApiClient.apiNamespaceGoals.delete(input)),

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

    deleteAccessMember: (input: GoalsDeleteAccessMemberInput) =>
      defaultApiClient.apiNamespaceGoals.deleteAccessMember(input),
    useDeleteAccessMember: () =>
      useMutation<GoalsDeleteAccessMemberInput, GoalsDeleteAccessMemberResult>((input) =>
        defaultApiClient.apiNamespaceGoals.deleteAccessMember(input),
      ),

    reopen: (input: GoalsReopenInput) => defaultApiClient.apiNamespaceGoals.reopen(input),
    useReopen: () =>
      useMutation<GoalsReopenInput, GoalsReopenResult>((input) => defaultApiClient.apiNamespaceGoals.reopen(input)),

    updateReviewer: (input: GoalsUpdateReviewerInput) => defaultApiClient.apiNamespaceGoals.updateReviewer(input),
    useUpdateReviewer: () =>
      useMutation<GoalsUpdateReviewerInput, GoalsUpdateReviewerResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateReviewer(input),
      ),
  },

  reactions: {
    delete: (input: ReactionsDeleteInput) => defaultApiClient.apiNamespaceReactions.delete(input),
    useDelete: () =>
      useMutation<ReactionsDeleteInput, ReactionsDeleteResult>((input) =>
        defaultApiClient.apiNamespaceReactions.delete(input),
      ),

    create: (input: ReactionsCreateInput) => defaultApiClient.apiNamespaceReactions.create(input),
    useCreate: () =>
      useMutation<ReactionsCreateInput, ReactionsCreateResult>((input) =>
        defaultApiClient.apiNamespaceReactions.create(input),
      ),
  },
};
