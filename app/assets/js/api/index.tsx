import React from "react";
import axios from "axios";
import { handleStaleClientError } from "./staleClient";

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
  public?: AccessOptionsInt | null;
  company?: AccessOptionsInt | null;
  space?: AccessOptionsInt | null;
}

export interface Account {
  fullName: string;
  siteAdmin: boolean;
}

export interface Activity {
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

export interface ActivityContentCompanyMemberJoined {
  company: Company;
  person: Person;
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
  previousAccessLevel: AccessOptionsInt;
  previousAccessLevelLabel: string;
  updatedAccessLevel: AccessOptionsInt;
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
  addedAssignees: Person[];
  removedAssignees: Person[];
}

export interface ActivityContentTaskClosing {
  companyId?: string | null;
  spaceId?: string | null;
  taskId?: string | null;
}

export interface ActivityContentTaskCommentDeleting {
  space: Space;
  project?: Project | null;
  task: Task | null;
  taskName: string;
  commentId: string;
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
  id: Id;
  accessLevel: AccessOptionsInt;
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

export interface BillingAccessStateLimit {
  code: string;
  limitKey: string;
  planKey?: BillingLimitPlan | null;
  currentUsage: number;
  requestedDelta: number;
  projectedUsage: number;
  limit: number;
  remaining: number;
  nearLimit: boolean;
  blocked: boolean;
  enforced: boolean;
}

export interface BillingAccount {
  provider: string;
  planKey?: BillingPlan | null;
  billingInterval?: BillingInterval | null;
  status: BillingStatus;
  suggestedPlanKey?: BillingPlan | null;
  suggestedBillingInterval?: BillingInterval | null;
  suggestedPlanSource?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlanKey?: BillingPlan | null;
  pendingBillingInterval?: BillingInterval | null;
  pendingCheckoutStartedAt?: string | null;
  scheduledPlanKey?: BillingPlan | null;
  scheduledBillingInterval?: BillingInterval | null;
  scheduledChangeEffectiveAt?: string | null;
  lastSyncedAt?: string | null;
  accessState: BillingAccessState;
  accessStateReason?: BillingAccessStateReason | null;
  accessStateStartedAt?: string | null;
  accessStateEndsAt?: string | null;
}

export interface BillingCatalogProduct {
  id: string;
  provider: string;
  planFamily: BillingPlan;
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
  provider: string;
  url: string;
  returnUrl: string;
  expiresAt?: string | null;
}

export interface BillingLimitStatus {
  code: string;
  limitKey: string;
  planKey?: BillingLimitPlan | null;
  currentUsage: number;
  requestedDelta: number;
  projectedUsage: number;
  limit: number;
  remaining: number;
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
  account: BillingAccount;
  plans: BillingPlanDefinition[];
  catalogProducts: BillingCatalogProduct[];
  memberCount: number;
  storageUsageBytes: number;
  stale: boolean;
}

export interface BillingPlanDefinition {
  key: string;
  displayName: string;
  memberLimit: number;
  storageLimitBytes: number;
}

export interface BillingRecommendedUpgrade {
  planKey?: BillingPlan | null;
  billingInterval?: BillingInterval | null;
  source?: string | null;
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

export interface CompanyExportRun {
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
  insertedAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  state: string;
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
  activityId: Id;
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
  status?: GoalCheckInStatus | null;
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
  id: string;
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
  type: string;
  size?: number | null;
  blob?: Blob | null;
  pathToFile?: ResourceHubFolder[] | null;
}

export interface ResourceHubFolder {
  id: string;
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
  name: string;
  url: string;
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
  dueDate: string | null;
  dueStatus: ReviewAssignmentDueStatus | null;
  dueStatusLabel: string | null;
}

export interface ReviewAssignmentGroup {
  origin: ReviewAssignmentOrigin;
  assignments: ReviewAssignment[];
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
  type: TaskReminderType;
  days?: number | null;
  enabled: boolean;
}

export type TaskReminderType = "before_due" | "due_day" | "overdue";

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
  milestones: WorkMapItemMilestone[];
  children: WorkMapItem[];
  type: WorkMapItemType;
  itemPath: string;
  privacy: WorkMapItemPrivacy;
  assignees?: Person[] | null;
}

export interface WorkMapItemMilestone {
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

export type AgentMessageSender = "user" | "ai";

export type AgentMessageStatus = "pending" | "done";

export type BillingAccessState = "normal" | "payment_grace" | "over_limit_grace" | "read_only";

export type BillingAccessStateReason = "past_due" | "over_limit_after_downgrade";

export type BillingInterval = "monthly" | "yearly";

export type BillingLimitPlan = "free" | "team" | "business";

export type BillingPlan = "team" | "business";

export type BillingStatus = "free" | "active" | "past_due" | "canceled";

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
  | "milestone";

export type ContextualDateType = "day" | "month" | "quarter" | "year";

export type CreateConversationContextType = "goal" | "project";

export type DiscussionState = "draft" | "published";

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

export type MilestoneStatus = "pending" | "done";

export type ProjectCheckInStatus = "on_track" | "caution" | "off_track";

export type ProjectContributorRole = "champion" | "reviewer" | "contributor";

export type ProjectTaskStatusColor = "gray" | "blue" | "green" | "red";

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
  | "resource_hub_link";

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

export type ReviewAssignmentTypes = "check_in" | "goal_update" | "space_task" | "project_task" | "milestone";

export type SearchScopeOptions = "company" | "project" | "space" | "goal" | "resource_hub" | "none";

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
  | "space_task";

export type SuccessStatus = "achieved" | "missed";

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

export interface BillingGetInput {}

export interface BillingGetResult {
  billing: BillingOverview;
}

export interface BillingGetAccessStateInput {}

export interface BillingGetAccessStateResult {
  accessState: BillingCompanyAccessState;
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

export interface CompaniesGlobalSearchInput {
  query: string;
}

export interface CompaniesGlobalSearchResult {
  spaces: Space[];
  projects: Project[];
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  people: Person[];
}

export interface CompaniesListInput {
  includeMemberCount?: boolean | null;
  isCompanyOwner?: boolean;
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
  includeAuthor?: boolean;
  includeResourceHub?: boolean;
  includeSpace?: boolean;
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

export interface LinksGetInput {
  id: Id;
  includeAuthor?: boolean;
  includeSpace?: boolean;
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

export interface ProjectsGetKeyResourceInput {
  id: Id;
}

export interface ProjectsGetKeyResourceResult {
  keyResource: ProjectKeyResource;
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
}

export interface ProjectsGetMilestoneResult {
  milestone: Milestone;
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
}

export interface SpacesGetResult {
  space: Space;
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
  people: Person[];
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

export interface BillingCancelInput {}

export interface BillingCancelResult {
  billing: BillingOverview;
}

export interface BillingChangePlanInput {
  plan: BillingPlan;
  billingInterval: BillingInterval;
}

export interface BillingChangePlanResult {
  billing: BillingOverview;
}

export interface BillingCreateCheckoutSessionInput {
  plan: BillingPlan;
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
  plan?: BillingPlan;
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
  dueDate: ContextualDate | null;
  checklist?: GoalCheckUpdate[];
  content: Json;
  newTargetValues?: string;
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
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
  newTargetValues?: string | null;
  checklist?: GoalCheckUpdate[] | null;
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

export interface ProjectsAcknowledgeCheckInInput {
  id: Id;
}

export interface ProjectsAcknowledgeCheckInResult {
  checkIn: ProjectCheckIn;
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
  sendNotificationsToEveryone?: boolean;
  subscriberIds?: Id[];
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

export interface ProjectsCreateMilestoneCommentInput {
  milestoneId: Id;
  content: Json | null;
  action: string;
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

export interface ProjectsDeleteKeyResourceInput {
  id: Id;
}

export interface ProjectsDeleteKeyResourceResult {
  keyResource: ProjectKeyResource;
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

export interface ProjectsUpdateKeyResourceInput {
  id: Id;
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
  destResourceHubId: Id;
  destParentFolderId?: Id | null;
}

export interface ResourceHubsCopyFolderResult {
  folderId: Id;
}

export interface ResourceHubsCreateInput {
  spaceId: Id;
  name: string;
  description?: Json;
  anonymousAccessLevel: AccessOptionsInt;
  companyAccessLevel: AccessOptionsInt;
  spaceAccessLevel: AccessOptionsInt;
}

export interface ResourceHubsCreateResult {
  resourceHub: ResourceHub;
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

export interface TasksUpdateRemindersInput {
  taskId: Id;
  reminders: TaskReminder[];
  type: TaskType;
}

export interface TasksUpdateRemindersResult {
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

class ApiNamespaceBilling {
  constructor(private client: ApiClient) {}

  async get(input: BillingGetInput): Promise<BillingGetResult> {
    return this.client.get("/billing/get", input);
  }

  async getAccessState(input: BillingGetAccessStateInput): Promise<BillingGetAccessStateResult> {
    return this.client.get("/billing/get_access_state", input);
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

  async getFolder(input: ResourceHubsGetFolderInput): Promise<ResourceHubsGetFolderResult> {
    return this.client.get("/resource_hubs/get_folder", input);
  }

  async listNodes(input: ResourceHubsListNodesInput): Promise<ResourceHubsListNodesResult> {
    return this.client.get("/resource_hubs/list_nodes", input);
  }

  async copyFolder(input: ResourceHubsCopyFolderInput): Promise<ResourceHubsCopyFolderResult> {
    return this.client.post("/resource_hubs/copy_folder", input);
  }

  async create(input: ResourceHubsCreateInput): Promise<ResourceHubsCreateResult> {
    return this.client.post("/resource_hubs/create", input);
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

  async globalSearch(input: CompaniesGlobalSearchInput): Promise<CompaniesGlobalSearchResult> {
    return this.client.get("/companies/global_search", input);
  }

  async list(input: CompaniesListInput): Promise<CompaniesListResult> {
    return this.client.get("/companies/list", input);
  }

  async listActivities(input: CompaniesListActivitiesInput): Promise<CompaniesListActivitiesResult> {
    return this.client.get("/companies/list_activities", input);
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

  async updateReminders(input: TasksUpdateRemindersInput): Promise<TasksUpdateRemindersResult> {
    return this.client.post("/tasks/update_reminders", input);
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

  async getKeyResource(input: ProjectsGetKeyResourceInput): Promise<ProjectsGetKeyResourceResult> {
    return this.client.get("/projects/get_key_resource", input);
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

  async createKeyResource(input: ProjectsCreateKeyResourceInput): Promise<ProjectsCreateKeyResourceResult> {
    return this.client.post("/projects/create_key_resource", input);
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

  async deleteKeyResource(input: ProjectsDeleteKeyResourceInput): Promise<ProjectsDeleteKeyResourceResult> {
    return this.client.post("/projects/delete_key_resource", input);
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

  async updateKeyResource(input: ProjectsUpdateKeyResourceInput): Promise<ProjectsUpdateKeyResourceResult> {
    return this.client.post("/projects/update_key_resource", input);
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
}

class ApiNamespaceGoals {
  constructor(private client: ApiClient) {}

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
  public apiNamespaceApiTokens: ApiNamespaceApiTokens;
  public apiNamespaceInvitations: ApiNamespaceInvitations;
  public apiNamespaceBilling: ApiNamespaceBilling;
  public apiNamespaceAi: ApiNamespaceAi;
  public apiNamespaceRoot: ApiNamespaceRoot;
  public apiNamespaceNotifications: ApiNamespaceNotifications;
  public apiNamespaceFiles: ApiNamespaceFiles;
  public apiNamespaceLinks: ApiNamespaceLinks;
  public apiNamespaceDocuments: ApiNamespaceDocuments;
  public apiNamespaceResourceHubs: ApiNamespaceResourceHubs;
  public apiNamespaceComments: ApiNamespaceComments;
  public apiNamespaceCompanies: ApiNamespaceCompanies;
  public apiNamespacePeople: ApiNamespacePeople;
  public apiNamespaceSpaces: ApiNamespaceSpaces;
  public apiNamespaceTasks: ApiNamespaceTasks;
  public apiNamespaceProjects: ApiNamespaceProjects;
  public apiNamespaceGoals: ApiNamespaceGoals;
  public apiNamespaceReactions: ApiNamespaceReactions;

  constructor() {
    this.apiNamespaceCompanyTransfers = new ApiNamespaceCompanyTransfers(this);
    this.apiNamespaceCliAuth = new ApiNamespaceCliAuth(this);
    this.apiNamespaceApiTokens = new ApiNamespaceApiTokens(this);
    this.apiNamespaceInvitations = new ApiNamespaceInvitations(this);
    this.apiNamespaceBilling = new ApiNamespaceBilling(this);
    this.apiNamespaceAi = new ApiNamespaceAi(this);
    this.apiNamespaceRoot = new ApiNamespaceRoot(this);
    this.apiNamespaceNotifications = new ApiNamespaceNotifications(this);
    this.apiNamespaceFiles = new ApiNamespaceFiles(this);
    this.apiNamespaceLinks = new ApiNamespaceLinks(this);
    this.apiNamespaceDocuments = new ApiNamespaceDocuments(this);
    this.apiNamespaceResourceHubs = new ApiNamespaceResourceHubs(this);
    this.apiNamespaceComments = new ApiNamespaceComments(this);
    this.apiNamespaceCompanies = new ApiNamespaceCompanies(this);
    this.apiNamespacePeople = new ApiNamespacePeople(this);
    this.apiNamespaceSpaces = new ApiNamespaceSpaces(this);
    this.apiNamespaceTasks = new ApiNamespaceTasks(this);
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
  deleteCompany,
  useDeleteCompany,
  joinCompany,
  useJoinCompany,
  markBlobUploaded,
  useMarkBlobUploaded,
  requestPasswordReset,
  useRequestPasswordReset,
  resetPassword,
  useResetPassword,

  company_transfers: {
    listExportRuns: (input: CompanyTransfersListExportRunsInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.listExportRuns(input),
    useListExportRuns: (input: CompanyTransfersListExportRunsInput) =>
      useQuery<CompanyTransfersListExportRunsResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.listExportRuns(input),
      ),

    getImportRun: (input: CompanyTransfersGetImportRunInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.getImportRun(input),
    useGetImportRun: (input: CompanyTransfersGetImportRunInput) =>
      useQuery<CompanyTransfersGetImportRunResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.getImportRun(input),
      ),

    listImportRuns: (input: CompanyTransfersListImportRunsInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.listImportRuns(input),
    useListImportRuns: (input: CompanyTransfersListImportRunsInput) =>
      useQuery<CompanyTransfersListImportRunsResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.listImportRuns(input),
      ),

    getExportRun: (input: CompanyTransfersGetExportRunInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.getExportRun(input),
    useGetExportRun: (input: CompanyTransfersGetExportRunInput) =>
      useQuery<CompanyTransfersGetExportRunResult>(() =>
        defaultApiClient.apiNamespaceCompanyTransfers.getExportRun(input),
      ),

    createImportArtifactBlobs: (input: CompanyTransfersCreateImportArtifactBlobsInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.createImportArtifactBlobs(input),
    useCreateImportArtifactBlobs: () =>
      useMutation<CompanyTransfersCreateImportArtifactBlobsInput, CompanyTransfersCreateImportArtifactBlobsResult>(
        (input) => defaultApiClient.apiNamespaceCompanyTransfers.createImportArtifactBlobs(input),
      ),

    startImport: (input: CompanyTransfersStartImportInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.startImport(input),
    useStartImport: () =>
      useMutation<CompanyTransfersStartImportInput, CompanyTransfersStartImportResult>((input) =>
        defaultApiClient.apiNamespaceCompanyTransfers.startImport(input),
      ),

    startExport: (input: CompanyTransfersStartExportInput) =>
      defaultApiClient.apiNamespaceCompanyTransfers.startExport(input),
    useStartExport: () =>
      useMutation<CompanyTransfersStartExportInput, CompanyTransfersStartExportResult>((input) =>
        defaultApiClient.apiNamespaceCompanyTransfers.startExport(input),
      ),
  },

  cli_auth: {
    status: (input: CliAuthStatusInput) => defaultApiClient.apiNamespaceCliAuth.status(input),
    useStatus: (input: CliAuthStatusInput) =>
      useQuery<CliAuthStatusResult>(() => defaultApiClient.apiNamespaceCliAuth.status(input)),

    companyCreationStatus: (input: CliAuthCompanyCreationStatusInput) =>
      defaultApiClient.apiNamespaceCliAuth.companyCreationStatus(input),
    useCompanyCreationStatus: (input: CliAuthCompanyCreationStatusInput) =>
      useQuery<CliAuthCompanyCreationStatusResult>(() =>
        defaultApiClient.apiNamespaceCliAuth.companyCreationStatus(input),
      ),

    startGoogleSignup: (input: CliAuthStartGoogleSignupInput) =>
      defaultApiClient.apiNamespaceCliAuth.startGoogleSignup(input),
    useStartGoogleSignup: () =>
      useMutation<CliAuthStartGoogleSignupInput, CliAuthStartGoogleSignupResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.startGoogleSignup(input),
      ),

    requestEmailCode: (input: CliAuthRequestEmailCodeInput) =>
      defaultApiClient.apiNamespaceCliAuth.requestEmailCode(input),
    useRequestEmailCode: () =>
      useMutation<CliAuthRequestEmailCodeInput, CliAuthRequestEmailCodeResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.requestEmailCode(input),
      ),

    createToken: (input: CliAuthCreateTokenInput) => defaultApiClient.apiNamespaceCliAuth.createToken(input),
    useCreateToken: () =>
      useMutation<CliAuthCreateTokenInput, CliAuthCreateTokenResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.createToken(input),
      ),

    setupCompany: (input: CliAuthSetupCompanyInput) => defaultApiClient.apiNamespaceCliAuth.setupCompany(input),
    useSetupCompany: () =>
      useMutation<CliAuthSetupCompanyInput, CliAuthSetupCompanyResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.setupCompany(input),
      ),

    authEmailCode: (input: CliAuthAuthEmailCodeInput) => defaultApiClient.apiNamespaceCliAuth.authEmailCode(input),
    useAuthEmailCode: () =>
      useMutation<CliAuthAuthEmailCodeInput, CliAuthAuthEmailCodeResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.authEmailCode(input),
      ),

    createCompany: (input: CliAuthCreateCompanyInput) => defaultApiClient.apiNamespaceCliAuth.createCompany(input),
    useCreateCompany: () =>
      useMutation<CliAuthCreateCompanyInput, CliAuthCreateCompanyResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.createCompany(input),
      ),

    joinWithInvite: (input: CliAuthJoinWithInviteInput) => defaultApiClient.apiNamespaceCliAuth.joinWithInvite(input),
    useJoinWithInvite: () =>
      useMutation<CliAuthJoinWithInviteInput, CliAuthJoinWithInviteResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.joinWithInvite(input),
      ),

    joinCompany: (input: CliAuthJoinCompanyInput) => defaultApiClient.apiNamespaceCliAuth.joinCompany(input),
    useJoinCompany: () =>
      useMutation<CliAuthJoinCompanyInput, CliAuthJoinCompanyResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.joinCompany(input),
      ),

    startGoogle: (input: CliAuthStartGoogleInput) => defaultApiClient.apiNamespaceCliAuth.startGoogle(input),
    useStartGoogle: () =>
      useMutation<CliAuthStartGoogleInput, CliAuthStartGoogleResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.startGoogle(input),
      ),

    checkAccount: (input: CliAuthCheckAccountInput) => defaultApiClient.apiNamespaceCliAuth.checkAccount(input),
    useCheckAccount: () =>
      useMutation<CliAuthCheckAccountInput, CliAuthCheckAccountResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.checkAccount(input),
      ),

    authPassword: (input: CliAuthAuthPasswordInput) => defaultApiClient.apiNamespaceCliAuth.authPassword(input),
    useAuthPassword: () =>
      useMutation<CliAuthAuthPasswordInput, CliAuthAuthPasswordResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.authPassword(input),
      ),

    signup: (input: CliAuthSignupInput) => defaultApiClient.apiNamespaceCliAuth.signup(input),
    useSignup: () =>
      useMutation<CliAuthSignupInput, CliAuthSignupResult>((input) =>
        defaultApiClient.apiNamespaceCliAuth.signup(input),
      ),
  },

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

    getInviteLinkAvailability: (input: InvitationsGetInviteLinkAvailabilityInput) =>
      defaultApiClient.apiNamespaceInvitations.getInviteLinkAvailability(input),
    useGetInviteLinkAvailability: (input: InvitationsGetInviteLinkAvailabilityInput) =>
      useQuery<InvitationsGetInviteLinkAvailabilityResult>(() =>
        defaultApiClient.apiNamespaceInvitations.getInviteLinkAvailability(input),
      ),

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

  billing: {
    get: (input: BillingGetInput) => defaultApiClient.apiNamespaceBilling.get(input),
    useGet: (input: BillingGetInput) =>
      useQuery<BillingGetResult>(() => defaultApiClient.apiNamespaceBilling.get(input)),

    getLimitWarnings: (input: BillingGetLimitWarningsInput) =>
      defaultApiClient.apiNamespaceBilling.getLimitWarnings(input),
    useGetLimitWarnings: (input: BillingGetLimitWarningsInput) =>
      useQuery<BillingGetLimitWarningsResult>(() => defaultApiClient.apiNamespaceBilling.getLimitWarnings(input)),

    getAccessState: (input: BillingGetAccessStateInput) => defaultApiClient.apiNamespaceBilling.getAccessState(input),
    useGetAccessState: (input: BillingGetAccessStateInput) =>
      useQuery<BillingGetAccessStateResult>(() => defaultApiClient.apiNamespaceBilling.getAccessState(input)),

    cancel: (input: BillingCancelInput) => defaultApiClient.apiNamespaceBilling.cancel(input),
    useCancel: () =>
      useMutation<BillingCancelInput, BillingCancelResult>((input) =>
        defaultApiClient.apiNamespaceBilling.cancel(input),
      ),

    createPaymentMethodSession: (input: BillingCreatePaymentMethodSessionInput) =>
      defaultApiClient.apiNamespaceBilling.createPaymentMethodSession(input),
    useCreatePaymentMethodSession: () =>
      useMutation<BillingCreatePaymentMethodSessionInput, BillingCreatePaymentMethodSessionResult>((input) =>
        defaultApiClient.apiNamespaceBilling.createPaymentMethodSession(input),
      ),

    changePlan: (input: BillingChangePlanInput) => defaultApiClient.apiNamespaceBilling.changePlan(input),
    useChangePlan: () =>
      useMutation<BillingChangePlanInput, BillingChangePlanResult>((input) =>
        defaultApiClient.apiNamespaceBilling.changePlan(input),
      ),

    createCustomerPortalSession: (input: BillingCreateCustomerPortalSessionInput) =>
      defaultApiClient.apiNamespaceBilling.createCustomerPortalSession(input),
    useCreateCustomerPortalSession: () =>
      useMutation<BillingCreateCustomerPortalSessionInput, BillingCreateCustomerPortalSessionResult>((input) =>
        defaultApiClient.apiNamespaceBilling.createCustomerPortalSession(input),
      ),

    createCheckoutSession: (input: BillingCreateCheckoutSessionInput) =>
      defaultApiClient.apiNamespaceBilling.createCheckoutSession(input),
    useCreateCheckoutSession: () =>
      useMutation<BillingCreateCheckoutSessionInput, BillingCreateCheckoutSessionResult>((input) =>
        defaultApiClient.apiNamespaceBilling.createCheckoutSession(input),
      ),

    reactivate: (input: BillingReactivateInput) => defaultApiClient.apiNamespaceBilling.reactivate(input),
    useReactivate: () =>
      useMutation<BillingReactivateInput, BillingReactivateResult>((input) =>
        defaultApiClient.apiNamespaceBilling.reactivate(input),
      ),

    refresh: (input: BillingRefreshInput) => defaultApiClient.apiNamespaceBilling.refresh(input),
    useRefresh: () =>
      useMutation<BillingRefreshInput, BillingRefreshResult>((input) =>
        defaultApiClient.apiNamespaceBilling.refresh(input),
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

  notifications: {
    isSubscribed: (input: NotificationsIsSubscribedInput) =>
      defaultApiClient.apiNamespaceNotifications.isSubscribed(input),
    useIsSubscribed: (input: NotificationsIsSubscribedInput) =>
      useQuery<NotificationsIsSubscribedResult>(() => defaultApiClient.apiNamespaceNotifications.isSubscribed(input)),

    getUnreadCount: (input: NotificationsGetUnreadCountInput) =>
      defaultApiClient.apiNamespaceNotifications.getUnreadCount(input),
    useGetUnreadCount: (input: NotificationsGetUnreadCountInput) =>
      useQuery<NotificationsGetUnreadCountResult>(() =>
        defaultApiClient.apiNamespaceNotifications.getUnreadCount(input),
      ),

    list: (input: NotificationsListInput) => defaultApiClient.apiNamespaceNotifications.list(input),
    useList: (input: NotificationsListInput) =>
      useQuery<NotificationsListResult>(() => defaultApiClient.apiNamespaceNotifications.list(input)),

    markAllAsRead: (input: NotificationsMarkAllAsReadInput) =>
      defaultApiClient.apiNamespaceNotifications.markAllAsRead(input),
    useMarkAllAsRead: () =>
      useMutation<NotificationsMarkAllAsReadInput, NotificationsMarkAllAsReadResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.markAllAsRead(input),
      ),

    unsubscribe: (input: NotificationsUnsubscribeInput) =>
      defaultApiClient.apiNamespaceNotifications.unsubscribe(input),
    useUnsubscribe: () =>
      useMutation<NotificationsUnsubscribeInput, NotificationsUnsubscribeResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.unsubscribe(input),
      ),

    markAsRead: (input: NotificationsMarkAsReadInput) => defaultApiClient.apiNamespaceNotifications.markAsRead(input),
    useMarkAsRead: () =>
      useMutation<NotificationsMarkAsReadInput, NotificationsMarkAsReadResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.markAsRead(input),
      ),

    markManyAsRead: (input: NotificationsMarkManyAsReadInput) =>
      defaultApiClient.apiNamespaceNotifications.markManyAsRead(input),
    useMarkManyAsRead: () =>
      useMutation<NotificationsMarkManyAsReadInput, NotificationsMarkManyAsReadResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.markManyAsRead(input),
      ),

    subscribe: (input: NotificationsSubscribeInput) => defaultApiClient.apiNamespaceNotifications.subscribe(input),
    useSubscribe: () =>
      useMutation<NotificationsSubscribeInput, NotificationsSubscribeResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.subscribe(input),
      ),

    updateSubscriptionsList: (input: NotificationsUpdateSubscriptionsListInput) =>
      defaultApiClient.apiNamespaceNotifications.updateSubscriptionsList(input),
    useUpdateSubscriptionsList: () =>
      useMutation<NotificationsUpdateSubscriptionsListInput, NotificationsUpdateSubscriptionsListResult>((input) =>
        defaultApiClient.apiNamespaceNotifications.updateSubscriptionsList(input),
      ),
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

    getFolder: (input: ResourceHubsGetFolderInput) => defaultApiClient.apiNamespaceResourceHubs.getFolder(input),
    useGetFolder: (input: ResourceHubsGetFolderInput) =>
      useQuery<ResourceHubsGetFolderResult>(() => defaultApiClient.apiNamespaceResourceHubs.getFolder(input)),

    deleteFolder: (input: ResourceHubsDeleteFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.deleteFolder(input),
    useDeleteFolder: () =>
      useMutation<ResourceHubsDeleteFolderInput, ResourceHubsDeleteFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.deleteFolder(input),
      ),

    updateParentFolder: (input: ResourceHubsUpdateParentFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.updateParentFolder(input),
    useUpdateParentFolder: () =>
      useMutation<ResourceHubsUpdateParentFolderInput, ResourceHubsUpdateParentFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.updateParentFolder(input),
      ),

    renameFolder: (input: ResourceHubsRenameFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.renameFolder(input),
    useRenameFolder: () =>
      useMutation<ResourceHubsRenameFolderInput, ResourceHubsRenameFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.renameFolder(input),
      ),

    copyFolder: (input: ResourceHubsCopyFolderInput) => defaultApiClient.apiNamespaceResourceHubs.copyFolder(input),
    useCopyFolder: () =>
      useMutation<ResourceHubsCopyFolderInput, ResourceHubsCopyFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.copyFolder(input),
      ),

    createFolder: (input: ResourceHubsCreateFolderInput) =>
      defaultApiClient.apiNamespaceResourceHubs.createFolder(input),
    useCreateFolder: () =>
      useMutation<ResourceHubsCreateFolderInput, ResourceHubsCreateFolderResult>((input) =>
        defaultApiClient.apiNamespaceResourceHubs.createFolder(input),
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
    getActivity: (input: CompaniesGetActivityInput) => defaultApiClient.apiNamespaceCompanies.getActivity(input),
    useGetActivity: (input: CompaniesGetActivityInput) =>
      useQuery<CompaniesGetActivityResult>(() => defaultApiClient.apiNamespaceCompanies.getActivity(input)),

    getFlatWorkMap: (input: CompaniesGetFlatWorkMapInput) =>
      defaultApiClient.apiNamespaceCompanies.getFlatWorkMap(input),
    useGetFlatWorkMap: (input: CompaniesGetFlatWorkMapInput) =>
      useQuery<CompaniesGetFlatWorkMapResult>(() => defaultApiClient.apiNamespaceCompanies.getFlatWorkMap(input)),

    list: (input: CompaniesListInput) => defaultApiClient.apiNamespaceCompanies.list(input),
    useList: (input: CompaniesListInput) =>
      useQuery<CompaniesListResult>(() => defaultApiClient.apiNamespaceCompanies.list(input)),

    globalSearch: (input: CompaniesGlobalSearchInput) => defaultApiClient.apiNamespaceCompanies.globalSearch(input),
    useGlobalSearch: (input: CompaniesGlobalSearchInput) =>
      useQuery<CompaniesGlobalSearchResult>(() => defaultApiClient.apiNamespaceCompanies.globalSearch(input)),

    getWorkMap: (input: CompaniesGetWorkMapInput) => defaultApiClient.apiNamespaceCompanies.getWorkMap(input),
    useGetWorkMap: (input: CompaniesGetWorkMapInput) =>
      useQuery<CompaniesGetWorkMapResult>(() => defaultApiClient.apiNamespaceCompanies.getWorkMap(input)),

    get: (input: CompaniesGetInput) => defaultApiClient.apiNamespaceCompanies.get(input),
    useGet: (input: CompaniesGetInput) =>
      useQuery<CompaniesGetResult>(() => defaultApiClient.apiNamespaceCompanies.get(input)),

    listActivities: (input: CompaniesListActivitiesInput) =>
      defaultApiClient.apiNamespaceCompanies.listActivities(input),
    useListActivities: (input: CompaniesListActivitiesInput) =>
      useQuery<CompaniesListActivitiesResult>(() => defaultApiClient.apiNamespaceCompanies.listActivities(input)),

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

    deleteActivity: (input: CompaniesDeleteActivityInput) =>
      defaultApiClient.apiNamespaceCompanies.deleteActivity(input),
    useDeleteActivity: () =>
      useMutation<CompaniesDeleteActivityInput, CompaniesDeleteActivityResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.deleteActivity(input),
      ),

    inviteGuest: (input: CompaniesInviteGuestInput) => defaultApiClient.apiNamespaceCompanies.inviteGuest(input),
    useInviteGuest: () =>
      useMutation<CompaniesInviteGuestInput, CompaniesInviteGuestResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.inviteGuest(input),
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

    grantResourceAccess: (input: CompaniesGrantResourceAccessInput) =>
      defaultApiClient.apiNamespaceCompanies.grantResourceAccess(input),
    useGrantResourceAccess: () =>
      useMutation<CompaniesGrantResourceAccessInput, CompaniesGrantResourceAccessResult>((input) =>
        defaultApiClient.apiNamespaceCompanies.grantResourceAccess(input),
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

    listDiscussions: (input: SpacesListDiscussionsInput) => defaultApiClient.apiNamespaceSpaces.listDiscussions(input),
    useListDiscussions: (input: SpacesListDiscussionsInput) =>
      useQuery<SpacesListDiscussionsResult>(() => defaultApiClient.apiNamespaceSpaces.listDiscussions(input)),

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

    getDiscussion: (input: SpacesGetDiscussionInput) => defaultApiClient.apiNamespaceSpaces.getDiscussion(input),
    useGetDiscussion: (input: SpacesGetDiscussionInput) =>
      useQuery<SpacesGetDiscussionResult>(() => defaultApiClient.apiNamespaceSpaces.getDiscussion(input)),

    searchPotentialMembers: (input: SpacesSearchPotentialMembersInput) =>
      defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
    useSearchPotentialMembers: (input: SpacesSearchPotentialMembersInput) =>
      useQuery<SpacesSearchPotentialMembersResult>(() =>
        defaultApiClient.apiNamespaceSpaces.searchPotentialMembers(input),
      ),

    listTasks: (input: SpacesListTasksInput) => defaultApiClient.apiNamespaceSpaces.listTasks(input),
    useListTasks: (input: SpacesListTasksInput) =>
      useQuery<SpacesListTasksResult>(() => defaultApiClient.apiNamespaceSpaces.listTasks(input)),

    publishDiscussion: (input: SpacesPublishDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.publishDiscussion(input),
    usePublishDiscussion: () =>
      useMutation<SpacesPublishDiscussionInput, SpacesPublishDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.publishDiscussion(input),
      ),

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

    archiveDiscussion: (input: SpacesArchiveDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.archiveDiscussion(input),
    useArchiveDiscussion: () =>
      useMutation<SpacesArchiveDiscussionInput, SpacesArchiveDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.archiveDiscussion(input),
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

    createDiscussion: (input: SpacesCreateDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.createDiscussion(input),
    useCreateDiscussion: () =>
      useMutation<SpacesCreateDiscussionInput, SpacesCreateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.createDiscussion(input),
      ),

    updateTaskStatuses: (input: SpacesUpdateTaskStatusesInput) =>
      defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
    useUpdateTaskStatuses: () =>
      useMutation<SpacesUpdateTaskStatusesInput, SpacesUpdateTaskStatusesResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateTaskStatuses(input),
      ),

    updateDiscussion: (input: SpacesUpdateDiscussionInput) =>
      defaultApiClient.apiNamespaceSpaces.updateDiscussion(input),
    useUpdateDiscussion: () =>
      useMutation<SpacesUpdateDiscussionInput, SpacesUpdateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceSpaces.updateDiscussion(input),
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

    updateReminders: (input: TasksUpdateRemindersInput) => defaultApiClient.apiNamespaceTasks.updateReminders(input),
    useUpdateReminders: () =>
      useMutation<TasksUpdateRemindersInput, TasksUpdateRemindersResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateReminders(input),
      ),

    updateName: (input: TasksUpdateNameInput) => defaultApiClient.apiNamespaceTasks.updateName(input),
    useUpdateName: () =>
      useMutation<TasksUpdateNameInput, TasksUpdateNameResult>((input) =>
        defaultApiClient.apiNamespaceTasks.updateName(input),
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

    listMilestoneTasks: (input: ProjectsListMilestoneTasksInput) =>
      defaultApiClient.apiNamespaceProjects.listMilestoneTasks(input),
    useListMilestoneTasks: (input: ProjectsListMilestoneTasksInput) =>
      useQuery<ProjectsListMilestoneTasksResult>(() => defaultApiClient.apiNamespaceProjects.listMilestoneTasks(input)),

    getMilestone: (input: ProjectsGetMilestoneInput) => defaultApiClient.apiNamespaceProjects.getMilestone(input),
    useGetMilestone: (input: ProjectsGetMilestoneInput) =>
      useQuery<ProjectsGetMilestoneResult>(() => defaultApiClient.apiNamespaceProjects.getMilestone(input)),

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

    getDiscussion: (input: ProjectsGetDiscussionInput) => defaultApiClient.apiNamespaceProjects.getDiscussion(input),
    useGetDiscussion: (input: ProjectsGetDiscussionInput) =>
      useQuery<ProjectsGetDiscussionResult>(() => defaultApiClient.apiNamespaceProjects.getDiscussion(input)),

    listCheckIns: (input: ProjectsListCheckInsInput) => defaultApiClient.apiNamespaceProjects.listCheckIns(input),
    useListCheckIns: (input: ProjectsListCheckInsInput) =>
      useQuery<ProjectsListCheckInsResult>(() => defaultApiClient.apiNamespaceProjects.listCheckIns(input)),

    listMilestones: (input: ProjectsListMilestonesInput) => defaultApiClient.apiNamespaceProjects.listMilestones(input),
    useListMilestones: (input: ProjectsListMilestonesInput) =>
      useQuery<ProjectsListMilestonesResult>(() => defaultApiClient.apiNamespaceProjects.listMilestones(input)),

    getRetrospective: (input: ProjectsGetRetrospectiveInput) =>
      defaultApiClient.apiNamespaceProjects.getRetrospective(input),
    useGetRetrospective: (input: ProjectsGetRetrospectiveInput) =>
      useQuery<ProjectsGetRetrospectiveResult>(() => defaultApiClient.apiNamespaceProjects.getRetrospective(input)),

    listDiscussions: (input: ProjectsListDiscussionsInput) =>
      defaultApiClient.apiNamespaceProjects.listDiscussions(input),
    useListDiscussions: (input: ProjectsListDiscussionsInput) =>
      useQuery<ProjectsListDiscussionsResult>(() => defaultApiClient.apiNamespaceProjects.listDiscussions(input)),

    search: (input: ProjectsSearchInput) => defaultApiClient.apiNamespaceProjects.search(input),
    useSearch: (input: ProjectsSearchInput) =>
      useQuery<ProjectsSearchResult>(() => defaultApiClient.apiNamespaceProjects.search(input)),

    getCheckIn: (input: ProjectsGetCheckInInput) => defaultApiClient.apiNamespaceProjects.getCheckIn(input),
    useGetCheckIn: (input: ProjectsGetCheckInInput) =>
      useQuery<ProjectsGetCheckInResult>(() => defaultApiClient.apiNamespaceProjects.getCheckIn(input)),

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

    createCheckIn: (input: ProjectsCreateCheckInInput) => defaultApiClient.apiNamespaceProjects.createCheckIn(input),
    useCreateCheckIn: () =>
      useMutation<ProjectsCreateCheckInInput, ProjectsCreateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createCheckIn(input),
      ),

    createDiscussion: (input: ProjectsCreateDiscussionInput) =>
      defaultApiClient.apiNamespaceProjects.createDiscussion(input),
    useCreateDiscussion: () =>
      useMutation<ProjectsCreateDiscussionInput, ProjectsCreateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createDiscussion(input),
      ),

    updateRetrospective: (input: ProjectsUpdateRetrospectiveInput) =>
      defaultApiClient.apiNamespaceProjects.updateRetrospective(input),
    useUpdateRetrospective: () =>
      useMutation<ProjectsUpdateRetrospectiveInput, ProjectsUpdateRetrospectiveResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateRetrospective(input),
      ),

    deleteCheckIn: (input: ProjectsDeleteCheckInInput) => defaultApiClient.apiNamespaceProjects.deleteCheckIn(input),
    useDeleteCheckIn: () =>
      useMutation<ProjectsDeleteCheckInInput, ProjectsDeleteCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.deleteCheckIn(input),
      ),

    moveToSpace: (input: ProjectsMoveToSpaceInput) => defaultApiClient.apiNamespaceProjects.moveToSpace(input),
    useMoveToSpace: () =>
      useMutation<ProjectsMoveToSpaceInput, ProjectsMoveToSpaceResult>((input) =>
        defaultApiClient.apiNamespaceProjects.moveToSpace(input),
      ),

    updateMilestoneOrdering: (input: ProjectsUpdateMilestoneOrderingInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneOrdering(input),
    useUpdateMilestoneOrdering: () =>
      useMutation<ProjectsUpdateMilestoneOrderingInput, ProjectsUpdateMilestoneOrderingResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneOrdering(input),
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

    updateMilestoneDueDate: (input: ProjectsUpdateMilestoneDueDateInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneDueDate(input),
    useUpdateMilestoneDueDate: () =>
      useMutation<ProjectsUpdateMilestoneDueDateInput, ProjectsUpdateMilestoneDueDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneDueDate(input),
      ),

    updateStartDate: (input: ProjectsUpdateStartDateInput) =>
      defaultApiClient.apiNamespaceProjects.updateStartDate(input),
    useUpdateStartDate: () =>
      useMutation<ProjectsUpdateStartDateInput, ProjectsUpdateStartDateResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateStartDate(input),
      ),

    updateMilestoneDescription: (input: ProjectsUpdateMilestoneDescriptionInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneDescription(input),
    useUpdateMilestoneDescription: () =>
      useMutation<ProjectsUpdateMilestoneDescriptionInput, ProjectsUpdateMilestoneDescriptionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneDescription(input),
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

    createMilestoneComment: (input: ProjectsCreateMilestoneCommentInput) =>
      defaultApiClient.apiNamespaceProjects.createMilestoneComment(input),
    useCreateMilestoneComment: () =>
      useMutation<ProjectsCreateMilestoneCommentInput, ProjectsCreateMilestoneCommentResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createMilestoneComment(input),
      ),

    updateMilestoneTitle: (input: ProjectsUpdateMilestoneTitleInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneTitle(input),
    useUpdateMilestoneTitle: () =>
      useMutation<ProjectsUpdateMilestoneTitleInput, ProjectsUpdateMilestoneTitleResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneTitle(input),
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

    acknowledgeCheckIn: (input: ProjectsAcknowledgeCheckInInput) =>
      defaultApiClient.apiNamespaceProjects.acknowledgeCheckIn(input),
    useAcknowledgeCheckIn: () =>
      useMutation<ProjectsAcknowledgeCheckInInput, ProjectsAcknowledgeCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.acknowledgeCheckIn(input),
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

    deleteMilestone: (input: ProjectsDeleteMilestoneInput) =>
      defaultApiClient.apiNamespaceProjects.deleteMilestone(input),
    useDeleteMilestone: () =>
      useMutation<ProjectsDeleteMilestoneInput, ProjectsDeleteMilestoneResult>((input) =>
        defaultApiClient.apiNamespaceProjects.deleteMilestone(input),
      ),

    updateDiscussion: (input: ProjectsUpdateDiscussionInput) =>
      defaultApiClient.apiNamespaceProjects.updateDiscussion(input),
    useUpdateDiscussion: () =>
      useMutation<ProjectsUpdateDiscussionInput, ProjectsUpdateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateDiscussion(input),
      ),

    updateCheckIn: (input: ProjectsUpdateCheckInInput) => defaultApiClient.apiNamespaceProjects.updateCheckIn(input),
    useUpdateCheckIn: () =>
      useMutation<ProjectsUpdateCheckInInput, ProjectsUpdateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateCheckIn(input),
      ),

    updateMilestoneKanban: (input: ProjectsUpdateMilestoneKanbanInput) =>
      defaultApiClient.apiNamespaceProjects.updateMilestoneKanban(input),
    useUpdateMilestoneKanban: () =>
      useMutation<ProjectsUpdateMilestoneKanbanInput, ProjectsUpdateMilestoneKanbanResult>((input) =>
        defaultApiClient.apiNamespaceProjects.updateMilestoneKanban(input),
      ),

    createContributor: (input: ProjectsCreateContributorInput) =>
      defaultApiClient.apiNamespaceProjects.createContributor(input),
    useCreateContributor: () =>
      useMutation<ProjectsCreateContributorInput, ProjectsCreateContributorResult>((input) =>
        defaultApiClient.apiNamespaceProjects.createContributor(input),
      ),
  },

  goals: {
    listAccessMembers: (input: GoalsListAccessMembersInput) =>
      defaultApiClient.apiNamespaceGoals.listAccessMembers(input),
    useListAccessMembers: (input: GoalsListAccessMembersInput) =>
      useQuery<GoalsListAccessMembersResult>(() => defaultApiClient.apiNamespaceGoals.listAccessMembers(input)),

    getCheckIn: (input: GoalsGetCheckInInput) => defaultApiClient.apiNamespaceGoals.getCheckIn(input),
    useGetCheckIn: (input: GoalsGetCheckInInput) =>
      useQuery<GoalsGetCheckInResult>(() => defaultApiClient.apiNamespaceGoals.getCheckIn(input)),

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

    createDiscussion: (input: GoalsCreateDiscussionInput) => defaultApiClient.apiNamespaceGoals.createDiscussion(input),
    useCreateDiscussion: () =>
      useMutation<GoalsCreateDiscussionInput, GoalsCreateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createDiscussion(input),
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

    createCheckIn: (input: GoalsCreateCheckInInput) => defaultApiClient.apiNamespaceGoals.createCheckIn(input),
    useCreateCheckIn: () =>
      useMutation<GoalsCreateCheckInInput, GoalsCreateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceGoals.createCheckIn(input),
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

    updateCheckIn: (input: GoalsUpdateCheckInInput) => defaultApiClient.apiNamespaceGoals.updateCheckIn(input),
    useUpdateCheckIn: () =>
      useMutation<GoalsUpdateCheckInInput, GoalsUpdateCheckInResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateCheckIn(input),
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

    updateDiscussion: (input: GoalsUpdateDiscussionInput) => defaultApiClient.apiNamespaceGoals.updateDiscussion(input),
    useUpdateDiscussion: () =>
      useMutation<GoalsUpdateDiscussionInput, GoalsUpdateDiscussionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateDiscussion(input),
      ),

    updateChampion: (input: GoalsUpdateChampionInput) => defaultApiClient.apiNamespaceGoals.updateChampion(input),
    useUpdateChampion: () =>
      useMutation<GoalsUpdateChampionInput, GoalsUpdateChampionResult>((input) =>
        defaultApiClient.apiNamespaceGoals.updateChampion(input),
      ),

    acknowledgeCheckIn: (input: GoalsAcknowledgeCheckInInput) =>
      defaultApiClient.apiNamespaceGoals.acknowledgeCheckIn(input),
    useAcknowledgeCheckIn: () =>
      useMutation<GoalsAcknowledgeCheckInInput, GoalsAcknowledgeCheckInResult>((input) =>
        defaultApiClient.apiNamespaceGoals.acknowledgeCheckIn(input),
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
