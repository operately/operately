import React from "react";
import axios from "axios";

function toCamel(o : any) {
  var newO : any, origKey : any, newKey : any, value : any;

  if (o instanceof Array) {
    return o.map(function(value) {
        if (typeof value === "object") {
          value = toCamel(value)
        }
        return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = origKey.replace(/_([a-z])/g, function(_a : string, b : string) { return b.toUpperCase() })
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value)
        }
        newO[newKey] = value
      }
    }
  }
  return newO
}

function toSnake(o : any) {
  var newO : any, origKey : any, newKey : any, value : any;

  if (o instanceof Array) {
    return o.map(function(value) {
        if (typeof value === "object") {
          value = toSnake(value)
        }
        return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = origKey.replace(/([A-Z])/g, function(a : string) { return "_" + a.toLowerCase() })
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toSnake(value)
        }
        newO[newKey] = value
      }
    }
  }
  return newO
}

type UseQueryHookResult<ResultT> = { data: ResultT | null, loading: boolean, error: Error | null };

export function useQuery<ResultT>(fn: () => Promise<ResultT>) : UseQueryHookResult<ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    fn().then(setData).catch(setError).finally(() => setLoading(false));
  }, [fn]);

  return { data, loading, error };
}

type UseMutationHookResult<InputT, ResultT> = [
  (input: InputT) => Promise<ResultT | any>,
  { data: ResultT | null, loading: boolean, error: Error | null }
];

export function useMutation<InputT, ResultT>(fn: (input: InputT) => Promise<ResultT>) : UseMutationHookResult<InputT, ResultT> {
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
    } finally {
      setLoading(false);
    }
  };

  return [execute, { data, loading, error }];
}

export interface Activity {
  id: string;
  scopeType: string;
  scopeId: string;
  resourceId: string;
  resourceType: string;
  actionType: string;
  insertedAt: Date;
  updatedAt: Date;
  commentThread: CommentThread;
  author: Person;
  resource: ActivityResourceUnion;
  person: Person;
  eventData: ActivityDataUnion;
  content: ActivityContent;
}

export interface ActivityContentCommentAdded {
  comment: Comment;
  activity: Activity;
}

export interface ActivityContentDiscussionCommentSubmitted {
  spaceId: string;
  discussionId: string;
  title: string;
  space: Group;
}

export interface ActivityContentDiscussionEditing {
  companyId: string;
  spaceId: string;
  discussionId: string;
}

export interface ActivityContentDiscussionPosting {
  companyId: string;
  spaceId: string;
  title: string;
  discussionId: string;
  space: Group;
  discussion: Discussion;
}

export interface ActivityContentGoalArchived {
  goal: Goal;
}

export interface ActivityContentGoalCheckIn {
  goal: Goal;
  update: Update;
}

export interface ActivityContentGoalCheckInAcknowledgement {
  goal: Goal;
  update: Update;
}

export interface ActivityContentGoalCheckInEdit {
  companyId: string;
  goalId: string;
  checkInId: string;
}

export interface ActivityContentGoalClosing {
  companyId: string;
  spaceId: string;
  goalId: string;
  success: string;
  goal: Goal;
}

export interface ActivityContentGoalCreated {
  goal: Goal;
}

export interface ActivityContentGoalDiscussionCreation {
  companyId: string;
  goalId: string;
  goal: Goal;
}

export interface ActivityContentGoalDiscussionEditing {
  companyId: string;
  spaceId: string;
  goalId: string;
  activityId: string;
}

export interface ActivityContentGoalEditing {
  goal: Goal;
  companyId: string;
  goalId: string;
  oldName: string;
  newName: string;
  oldTimeframe: Timeframe;
  newTimeframe: Timeframe;
  oldChampionId: string;
  newChampionId: string;
  oldReviewerId: string;
  newReviewerId: string;
  newChampion: Person;
  newReviewer: Person;
  addedTargets: Target[];
  updatedTargets: GoalEditingUpdatedTarget[];
  deletedTargets: Target[];
}

export interface ActivityContentGoalReopening {
  companyId: string;
  goalId: string;
  message: string;
  goal: Goal;
}

export interface ActivityContentGoalReparent {
  companyId: string;
  oldParentGoalId: string;
  newParentGoalId: string;
}

export interface ActivityContentGoalTimeframeEditing {
  goal: Goal;
  oldTimeframe: Timeframe;
  newTimeframe: Timeframe;
}

export interface ActivityContentGroupEdited {
  exampleField: string;
}

export interface ActivityContentProjectArchived {
  projectId: string;
  project: Project;
}

export interface ActivityContentProjectCheckInAcknowledged {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
}

export interface ActivityContentProjectCheckInCommented {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
  comment: Comment;
}

export interface ActivityContentProjectCheckInEdit {
  companyId: string;
  projectId: string;
  checkInId: string;
}

export interface ActivityContentProjectCheckInSubmitted {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
}

export interface ActivityContentProjectClosed {
  project: Project;
}

export interface ActivityContentProjectContributorAddition {
  companyId: string;
  projectId: string;
  personId: string;
  person: Person;
  project: Project;
}

export interface ActivityContentProjectCreated {
  projectId: string;
  project: Project;
}

export interface ActivityContentProjectDiscussionSubmitted {
  projectId: string;
  discussionId: string;
  title: string;
  project: Project;
}

export interface ActivityContentProjectGoalConnection {
  project: Project;
  goal: Goal;
}

export interface ActivityContentProjectGoalDisconnection {
  project: Project;
  goal: Goal;
}

export interface ActivityContentProjectMilestoneCommented {
  projectId: string;
  project: Project;
  milestone: Milestone;
  commentAction: string;
  comment: Comment;
}

export interface ActivityContentProjectMoved {
  project: Project;
  oldSpace: Group;
  newSpace: Group;
}

export interface ActivityContentProjectPausing {
  companyId: string;
  projectId: string;
  project: Project;
}

export interface ActivityContentProjectRenamed {
  project: Project;
  oldName: string;
  newName: string;
}

export interface ActivityContentProjectResuming {
  companyId: string;
  projectId: string;
  project: Project;
}

export interface ActivityContentProjectReviewAcknowledged {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface ActivityContentProjectReviewCommented {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface ActivityContentProjectReviewRequestSubmitted {
  projectId: string;
  requestId: string;
  project: Project;
}

export interface ActivityContentProjectReviewSubmitted {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface ActivityContentProjectTimelineEdited {
  project: Project;
  oldStartDate: Date;
  newStartDate: Date;
  oldEndDate: Date;
  newEndDate: Date;
  newMilestones: Milestone[];
  updatedMilestones: Milestone[];
}

export interface ActivityContentSpaceJoining {
  companyId: string;
  spaceId: string;
  space: Group;
}

export interface ActivityContentTaskAdding {
  name: string;
  taskId: string;
  companyId: string;
  spaceId: string;
}

export interface ActivityContentTaskAssigneeAssignment {
  companyId: string;
  spaceId: string;
  taskId: string;
  personId: string;
}

export interface ActivityContentTaskClosing {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface ActivityContentTaskDescriptionChange {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface ActivityContentTaskNameEditing {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldName: string;
  newName: string;
}

export interface ActivityContentTaskPriorityChange {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldPriority: string;
  newPriority: string;
}

export interface ActivityContentTaskReopening {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface ActivityContentTaskSizeChange {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldSize: string;
  newSize: string;
}

export interface ActivityContentTaskStatusChange {
  companyId: string;
  taskId: string;
  status: string;
}

export interface ActivityContentTaskUpdate {
  companyId: string;
  taskId: string;
  name: string;
}

export interface ActivityEventDataCommentPost {
  updateId: string;
}

export interface ActivityEventDataMilestoneCreate {
  title: string;
}

export interface ActivityEventDataProjectCreate {
  champion: Person;
}

export interface Assignment {
  type: string;
  due: Date;
  resource: AssignmentResource;
}

export interface Assignments {
  assignments: Assignment[];
}

export interface Blob {
  author: Person;
  status: string;
  filename: string;
  url: string;
  signedUploadUrl: string;
  storageType: string;
}

export interface Comment {
  id: string;
  insertedAt: Date;
  content: string;
  author: Person;
  reactions: Reaction[];
}

export interface CommentThread {
  id: string;
  insertedAt: Date;
  title: string;
  message: string;
  reactions: Reaction[];
  comments: Comment[];
  commentsCount: number;
  author: Person;
}

export interface Company {
  id: string;
  name: string;
  mission: string;
  trustedEmailDomains: string[];
  enabledExperimentalFeatures: string[];
  companySpaceId: string;
  tenets: Tenet[];
  admins: Person[];
  people: Person[];
}

export interface Dashboard {
  id: string;
  panels: Panel[];
}

export interface Discussion {
  id: string;
  name: string;
  insertedAt: Date;
  updatedAt: Date;
  author: Person;
  title: string;
  body: string;
  space: Group;
  reactions: Reaction[];
  comments: Comment[];
}

export interface Goal {
  id: string;
  name: string;
  insertedAt: Date;
  updatedAt: Date;
  nextUpdateScheduledAt: Date;
  parentGoalId: string;
  closedAt: Date;
  timeframe: Timeframe;
  description: string;
  champion: Person;
  reviewer: Person;
  closedBy: Person;
  targets: Target[];
  projects: Project[];
  parentGoal: Goal;
  progressPercentage: number;
  lastCheckIn: Update;
  permissions: GoalPermissions;
  isArchived: boolean;
  isClosed: boolean;
  archivedAt: Date;
  space: Group;
  myRole: string;
}

export interface GoalEditingUpdatedTarget {
  id: string;
  oldName: string;
  newName: string;
}

export interface GoalPermissions {
  canEdit: boolean;
  canCheckIn: boolean;
  canAcknowledgeCheckIn: boolean;
  canClose: boolean;
  canArchive: boolean;
}

export interface Group {
  id: string;
  name: string;
  mission: string;
  isMember: boolean;
  isCompanySpace: boolean;
  privateSpace: boolean;
  icon: string;
  color: string;
  members: Person[];
  pointsOfContact: GroupContact[];
}

export interface GroupContact {
  id: string;
  name: string;
  type: string;
  value: string;
}

export interface Invitation {
  id: string;
  adminName: string;
  admin: Person;
  member: Person;
  token: string;
}

export interface KeyResult {
  id: string;
  name: string;
  status: string;
  updatedAt: Date;
  stepsCompleted: number;
  stepsTotal: number;
  owner: Person;
  group: Group;
}

export interface Kpi {
  id: string;
  name: string;
  description: string;
  unit: string;
  target: number;
  targetDirection: string;
  metrics: KpiMetric[];
}

export interface KpiMetric {
  date: Date;
  value: number;
}

export interface Milestone {
  id: string;
  title: string;
  status: string;
  insertedAt: Date;
  deadlineAt: Date;
  completedAt: Date;
  description: string;
  comments: MilestoneComment[];
  tasksKanbanState: string;
}

export interface MilestoneComment {
  id: string;
  action: string;
  comment: Comment;
}

export interface Notification {
  id: string;
  read: boolean;
  readAt: Date;
  activity: Activity;
}

export interface Objective {
  id: string;
  name: string;
  description: string;
  owner: Person;
  keyResults: KeyResult[];
  group: Group;
  activities: Activity[];
}

export interface Panel {
  id: string;
  type: string;
  index: number;
  linkedResource: PanelLinkedResource;
}

export interface Person {
  id: string;
  managerId: string;
  fullName: string;
  title: string;
  avatarUrl: string;
  timezone: string;
  companyRole: string;
  email: string;
  sendDailySummary: boolean;
  notifyOnMention: boolean;
  notifyAboutAssignments: boolean;
  suspended: boolean;
  company: Company;
  manager: Person;
  reports: Person[];
  peers: Person[];
  theme: string;
}

export interface Project {
  id: string;
  name: string;
  insertedAt: Date;
  updatedAt: Date;
  startedAt: Date;
  deadline: Date;
  nextUpdateScheduledAt: Date;
  nextCheckInScheduledAt: Date;
  private: boolean;
  status: string;
  closedAt: Date;
  retrospective: string;
  description: string;
  goal: Goal;
  lastCheckIn: ProjectCheckIn;
  milestones: Milestone[];
  contributors: ProjectContributor[];
  keyResources: ProjectKeyResource[];
  closedBy: Person;
  isOutdated: boolean;
  spaceId: string;
  space: Group;
  myRole: string;
  permissions: ProjectPermissions;
  nextMilestone: Milestone;
  isPinned: boolean;
  isArchived: boolean;
  archivedAt: Date;
  champion: Person;
  reviewer: Person;
}

export interface ProjectCheckIn {
  id: string;
  status: string;
  insertedAt: Date;
  description: string;
  author: Person;
  project: Project;
  acknowledgedAt: Date;
  acknowledgedBy: Person;
  reactions: Reaction[];
}

export interface ProjectContributor {
  id: string;
  responsibility: string;
  role: string;
  person: Person;
}

export interface ProjectHealth {
  status: string;
  statusComments: string;
  schedule: string;
  scheduleComments: string;
  budget: string;
  budgetComments: string;
  team: string;
  teamComments: string;
  risks: string;
  risksComments: string;
}

export interface ProjectKeyResource {
  id: string;
  title: string;
  link: string;
  resourceType: string;
}

export interface ProjectPermissions {
  canView: boolean;
  canCreateMilestone: boolean;
  canDeleteMilestone: boolean;
  canEditContributors: boolean;
  canEditMilestone: boolean;
  canEditDescription: boolean;
  canEditTimeline: boolean;
  canEditResources: boolean;
  canEditGoal: boolean;
  canEditName: boolean;
  canEditSpace: boolean;
  canPause: boolean;
  canCheckIn: boolean;
  canAcknowledgeCheckIn: boolean;
}

export interface ProjectReviewRequest {
  id: string;
  insertedAt: Date;
  updatedAt: Date;
  status: string;
  reviewId: string;
  content: string;
  author: Person;
}

export interface Reaction {
  id: string;
  emoji: string;
  reactionType: string;
  person: Person;
}

export interface Target {
  id: string;
  index: number;
  name: string;
  from: number;
  to: number;
  unit: string;
  value: number;
}

export interface Task {
  id: string;
  name: string;
  insertedAt: Date;
  updatedAt: Date;
  dueDate: Date;
  size: string;
  priority: string;
  status: string;
  milestone: Milestone;
  project: Project;
  description: string;
  assignees: Person[];
  creator: Person;
}

export interface Tenet {
  id: string;
  name: string;
  description: string;
  kpis: Kpi[];
  company: Company;
  objectives: Objective[];
}

export interface Timeframe {
  startDate: Date;
  endDate: Date;
  type: string;
}

export interface Update {
  id: string;
  title: string;
  insertedAt: Date;
  updatedAt: Date;
  acknowledged: boolean;
  acknowledgedAt: Date;
  updatableId: string;
  project: Project;
  acknowledgingPerson: Person;
  message: string;
  messageType: string;
  comments: Comment[];
  author: Person;
  reactions: Reaction[];
  content: UpdateContent;
  commentsCount: number;
}

export interface UpdateContentGoalCheckIn {
  message: string;
  targets: UpdateContentGoalCheckInTarget[];
}

export interface UpdateContentGoalCheckInTarget {
  id: string;
  name: string;
  value: number;
  unit: string;
  previousValue: number;
  index: number;
  from: number;
  to: number;
}

export interface UpdateContentMessage {
  message: string;
}

export interface UpdateContentProjectContributorAdded {
  contributorId: string;
  contributorRole: string;
  contributor: Person;
}

export interface UpdateContentProjectContributorRemoved {
  contributor: Person;
  contributorId: string;
  contributorRole: string;
}

export interface UpdateContentProjectCreated {
  creatorRole: string;
  creator: Person;
  champion: Person;
}

export interface UpdateContentProjectDiscussion {
  title: string;
  body: string;
}

export interface UpdateContentProjectEndTimeChanged {
  oldEndTime: string;
  newEndTime: string;
}

export interface UpdateContentProjectMilestoneCompleted {
  milestone: Milestone;
}

export interface UpdateContentProjectMilestoneCreated {
  milestone: Milestone;
}

export interface UpdateContentProjectMilestoneDeadlineChanged {
  oldDeadline: string;
  newDeadline: string;
  milestone: Milestone;
}

export interface UpdateContentProjectMilestoneDeleted {
  milestone: Milestone;
}

export interface UpdateContentProjectStartTimeChanged {
  oldStartTime: string;
  newStartTime: string;
}

export interface UpdateContentReview {
  survey: string;
  previousPhase: string;
  newPhase: string;
  reviewReason: string;
  reviewRequestId: string;
}

export interface UpdateContentStatusUpdate {
  message: string;
  oldHealth: string;
  newHealth: string;
  nextMilestoneId: string;
  nextMilestoneTitle: string;
  nextMilestoneDueDate: string;
  phase: string;
  phaseStart: string;
  phaseEnd: string;
  projectStartTime: string;
  projectEndTime: string;
  health: ProjectHealth;
}

export type ActivityContent = ActivityContentCommentAdded | ActivityContentDiscussionCommentSubmitted | ActivityContentDiscussionEditing | ActivityContentDiscussionPosting | ActivityContentGoalArchived | ActivityContentGoalCheckIn | ActivityContentGoalCheckInAcknowledgement | ActivityContentGoalCheckInEdit | ActivityContentGoalClosing | ActivityContentGoalCreated | ActivityContentGoalDiscussionCreation | ActivityContentGoalDiscussionEditing | ActivityContentGoalEditing | ActivityContentGoalReopening | ActivityContentGoalReparent | ActivityContentGoalTimeframeEditing | ActivityContentGroupEdited | ActivityContentProjectArchived | ActivityContentProjectCheckInAcknowledged | ActivityContentProjectCheckInCommented | ActivityContentProjectCheckInEdit | ActivityContentProjectCheckInSubmitted | ActivityContentProjectClosed | ActivityContentProjectContributorAddition | ActivityContentProjectCreated | ActivityContentProjectDiscussionSubmitted | ActivityContentProjectGoalConnection | ActivityContentProjectGoalDisconnection | ActivityContentProjectMilestoneCommented | ActivityContentProjectMoved | ActivityContentProjectPausing | ActivityContentProjectRenamed | ActivityContentProjectResuming | ActivityContentProjectReviewAcknowledged | ActivityContentProjectReviewCommented | ActivityContentProjectReviewRequestSubmitted | ActivityContentProjectReviewSubmitted | ActivityContentProjectTimelineEdited | ActivityContentSpaceJoining | ActivityContentTaskAdding | ActivityContentTaskAssigneeAssignment | ActivityContentTaskClosing | ActivityContentTaskDescriptionChange | ActivityContentTaskNameEditing | ActivityContentTaskPriorityChange | ActivityContentTaskReopening | ActivityContentTaskSizeChange | ActivityContentTaskStatusChange | ActivityContentTaskUpdate;

export type ActivityDataUnion = ActivityEventDataProjectCreate | ActivityEventDataMilestoneCreate | ActivityEventDataCommentPost;

export type ActivityResourceUnion = Project | Update | Milestone | Comment;

export type AssignmentResource = Project | Milestone;

export type PanelLinkedResource = Project;

export type UpdateContent = UpdateContentProjectCreated | UpdateContentProjectStartTimeChanged | UpdateContentProjectEndTimeChanged | UpdateContentProjectContributorAdded | UpdateContentProjectContributorRemoved | UpdateContentProjectMilestoneCreated | UpdateContentProjectMilestoneCompleted | UpdateContentProjectMilestoneDeadlineChanged | UpdateContentProjectMilestoneDeleted | UpdateContentStatusUpdate | UpdateContentGoalCheckIn | UpdateContentReview | UpdateContentProjectDiscussion | UpdateContentMessage;

export interface GetActivitiesInput {

}

export interface GetActivitiesResult {

}


export interface GetActivityInput {

}

export interface GetActivityResult {

}


export interface GetCommentsInput {

}

export interface GetCommentsResult {

}


export interface GetCompanyInput {

}

export interface GetCompanyResult {

}


export interface GetDiscussionInput {

}

export interface GetDiscussionResult {

}


export interface GetDiscussionsInput {

}

export interface GetDiscussionsResult {

}


export interface GetGoalInput {

}

export interface GetGoalResult {

}


export interface GetGoalCheckInInput {

}

export interface GetGoalCheckInResult {

}


export interface GetGoalCheckInsInput {

}

export interface GetGoalCheckInsResult {

}


export interface GetGoalsInput {

}

export interface GetGoalsResult {

}


export interface GetGroupInput {

}

export interface GetGroupResult {

}


export interface GetGroupsInput {

}

export interface GetGroupsResult {

}


export interface GetInvitationInput {

}

export interface GetInvitationResult {

}


export interface GetKeyResourcesInput {

}

export interface GetKeyResourcesResult {

}


export interface GetMeInput {
  includeManager: boolean;
}

export interface GetMeResult {
  me: Person;
}


export interface GetMilestoneInput {

}

export interface GetMilestoneResult {

}


export interface GetNotificationsInput {

}

export interface GetNotificationsResult {

}


export interface GetPeopleInput {

}

export interface GetPeopleResult {

}


export interface GetPersonInput {

}

export interface GetPersonResult {

}


export interface GetProjectInput {

}

export interface GetProjectResult {

}


export interface GetProjectCheckInInput {

}

export interface GetProjectCheckInResult {

}


export interface GetProjectsInput {

}

export interface GetProjectsResult {

}


export interface GetSpacesInput {

}

export interface GetSpacesResult {

}


export interface GetTaskInput {

}

export interface GetTaskResult {

}


export interface GetTasksInput {

}

export interface GetTasksResult {

}


export interface GetUnreadNotificationCountInput {

}

export interface GetUnreadNotificationCountResult {

}


export interface SearchPeopleInput {
  query: string;
  ignoredIds: string[];
}

export interface SearchPeopleResult {
  people: Person[];
}


export interface SearchProjectContributorCandidatesInput {

}

export interface SearchProjectContributorCandidatesResult {

}

export interface AcknowledgeGoalCheckInInput {

}

export interface AcknowledgeGoalCheckInResult {

}


export interface AcknowledgeProjectCheckInInput {

}

export interface AcknowledgeProjectCheckInResult {

}


export interface AddCompanyAdminsInput {

}

export interface AddCompanyAdminsResult {

}


export interface AddCompanyMemberInput {

}

export interface AddCompanyMemberResult {

}


export interface AddCompanyTrustedEmailDomainInput {

}

export interface AddCompanyTrustedEmailDomainResult {

}


export interface AddFirstCompanyInput {

}

export interface AddFirstCompanyResult {

}


export interface AddGroupMembersInput {

}

export interface AddGroupMembersResult {

}


export interface AddKeyResourceInput {

}

export interface AddKeyResourceResult {

}


export interface AddProjectContributorInput {

}

export interface AddProjectContributorResult {

}


export interface AddReactionInput {

}

export interface AddReactionResult {

}


export interface ArchiveGoalInput {

}

export interface ArchiveGoalResult {

}


export interface ArchiveProjectInput {

}

export interface ArchiveProjectResult {

}


export interface ChangeGoalParentInput {

}

export interface ChangeGoalParentResult {

}


export interface ChangePasswordFirstTimeInput {

}

export interface ChangePasswordFirstTimeResult {

}


export interface ChangeTaskDescriptionInput {

}

export interface ChangeTaskDescriptionResult {

}


export interface CloseGoalInput {

}

export interface CloseGoalResult {

}


export interface CloseProjectInput {

}

export interface CloseProjectResult {

}


export interface ConnectGoalToProjectInput {

}

export interface ConnectGoalToProjectResult {

}


export interface CreateBlobInput {

}

export interface CreateBlobResult {

}


export interface CreateCommentInput {

}

export interface CreateCommentResult {

}


export interface CreateGoalInput {

}

export interface CreateGoalResult {

}


export interface CreateGoalDiscussionInput {

}

export interface CreateGoalDiscussionResult {

}


export interface CreateGoalUpdateInput {

}

export interface CreateGoalUpdateResult {

}


export interface CreateGroupInput {

}

export interface CreateGroupResult {

}


export interface CreateProjectInput {

}

export interface CreateProjectResult {

}


export interface CreateTaskInput {

}

export interface CreateTaskResult {

}


export interface DisconnectGoalFromProjectInput {

}

export interface DisconnectGoalFromProjectResult {

}


export interface EditCommentInput {

}

export interface EditCommentResult {

}


export interface EditDiscussionInput {

}

export interface EditDiscussionResult {

}


export interface EditGoalDiscussionInput {

}

export interface EditGoalDiscussionResult {

}


export interface EditGoalTimeframeInput {

}

export interface EditGoalTimeframeResult {

}


export interface EditGoalUpdateInput {

}

export interface EditGoalUpdateResult {

}


export interface EditGroupInput {

}

export interface EditGroupResult {

}


export interface EditProjectNameInput {

}

export interface EditProjectNameResult {

}


export interface EditProjectTimelineInput {

}

export interface EditProjectTimelineResult {

}


export interface JoinSpaceInput {

}

export interface JoinSpaceResult {

}


export interface MarkAllNotificationsAsReadInput {

}

export interface MarkAllNotificationsAsReadResult {

}


export interface MarkNotificationAsReadInput {

}

export interface MarkNotificationAsReadResult {

}


export interface MoveProjectToSpaceInput {

}

export interface MoveProjectToSpaceResult {

}


export interface NewInvitationTokenInput {

}

export interface NewInvitationTokenResult {

}


export interface PauseProjectInput {

}

export interface PauseProjectResult {

}


export interface PostDiscussionInput {

}

export interface PostDiscussionResult {

}


export interface PostMilestoneCommentInput {

}

export interface PostMilestoneCommentResult {

}


export interface PostProjectCheckInInput {

}

export interface PostProjectCheckInResult {

}


export interface RemoveCompanyAdminInput {

}

export interface RemoveCompanyAdminResult {

}


export interface RemoveCompanyMemberInput {

}

export interface RemoveCompanyMemberResult {

}


export interface RemoveCompanyTrustedEmailDomainInput {

}

export interface RemoveCompanyTrustedEmailDomainResult {

}


export interface RemoveGroupMemberInput {

}

export interface RemoveGroupMemberResult {

}


export interface RemoveKeyResourceInput {

}

export interface RemoveKeyResourceResult {

}


export interface RemoveProjectContributorInput {

}

export interface RemoveProjectContributorResult {

}


export interface RemoveProjectMilestoneInput {

}

export interface RemoveProjectMilestoneResult {

}


export interface ReopenGoalInput {

}

export interface ReopenGoalResult {

}


export interface ResumeProjectInput {

}

export interface ResumeProjectResult {

}


export interface SetMilestoneDeadlineInput {

}

export interface SetMilestoneDeadlineResult {

}


export interface UpdateGroupAppearanceInput {

}

export interface UpdateGroupAppearanceResult {

}


export interface UpdateMilestoneInput {

}

export interface UpdateMilestoneResult {

}


export interface UpdateMilestoneDescriptionInput {

}

export interface UpdateMilestoneDescriptionResult {

}


export interface UpdateMyAppearanceInput {

}

export interface UpdateMyAppearanceResult {

}


export interface UpdateMyNotificationSettingsInput {

}

export interface UpdateMyNotificationSettingsResult {

}


export interface UpdateMyProfileInput {

}

export interface UpdateMyProfileResult {

}


export interface UpdateProjectContributorInput {

}

export interface UpdateProjectContributorResult {

}


export interface UpdateProjectDescriptionInput {

}

export interface UpdateProjectDescriptionResult {

}


export interface UpdateTaskInput {

}

export interface UpdateTaskResult {

}


export interface UpdateTaskStatusInput {

}

export interface UpdateTaskStatusResult {

}

interface ApiClientConfig {
  basePath: string;
}

export class ApiClient {
  private basePath: string;

  configure(config: ApiClientConfig) {
    this.basePath = config.basePath;
  }

  async getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return axios.get(this.basePath + "/get_activities", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getActivity(input: GetActivityInput): Promise<GetActivityResult> {
    return axios.get(this.basePath + "/get_activity", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getComments(input: GetCommentsInput): Promise<GetCommentsResult> {
    return axios.get(this.basePath + "/get_comments", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
    return axios.get(this.basePath + "/get_company", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getDiscussion(input: GetDiscussionInput): Promise<GetDiscussionResult> {
    return axios.get(this.basePath + "/get_discussion", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getDiscussions(input: GetDiscussionsInput): Promise<GetDiscussionsResult> {
    return axios.get(this.basePath + "/get_discussions", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoal(input: GetGoalInput): Promise<GetGoalResult> {
    return axios.get(this.basePath + "/get_goal", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoalCheckIn(input: GetGoalCheckInInput): Promise<GetGoalCheckInResult> {
    return axios.get(this.basePath + "/get_goal_check_in", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoalCheckIns(input: GetGoalCheckInsInput): Promise<GetGoalCheckInsResult> {
    return axios.get(this.basePath + "/get_goal_check_ins", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
    return axios.get(this.basePath + "/get_goals", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGroup(input: GetGroupInput): Promise<GetGroupResult> {
    return axios.get(this.basePath + "/get_group", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGroups(input: GetGroupsInput): Promise<GetGroupsResult> {
    return axios.get(this.basePath + "/get_groups", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getInvitation(input: GetInvitationInput): Promise<GetInvitationResult> {
    return axios.get(this.basePath + "/get_invitation", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getKeyResources(input: GetKeyResourcesInput): Promise<GetKeyResourcesResult> {
    return axios.get(this.basePath + "/get_key_resources", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getMe(input: GetMeInput): Promise<GetMeResult> {
    return axios.get(this.basePath + "/get_me", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getMilestone(input: GetMilestoneInput): Promise<GetMilestoneResult> {
    return axios.get(this.basePath + "/get_milestone", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
    return axios.get(this.basePath + "/get_notifications", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getPeople(input: GetPeopleInput): Promise<GetPeopleResult> {
    return axios.get(this.basePath + "/get_people", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getPerson(input: GetPersonInput): Promise<GetPersonResult> {
    return axios.get(this.basePath + "/get_person", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getProject(input: GetProjectInput): Promise<GetProjectResult> {
    return axios.get(this.basePath + "/get_project", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getProjectCheckIn(input: GetProjectCheckInInput): Promise<GetProjectCheckInResult> {
    return axios.get(this.basePath + "/get_project_check_in", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getProjects(input: GetProjectsInput): Promise<GetProjectsResult> {
    return axios.get(this.basePath + "/get_projects", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getSpaces(input: GetSpacesInput): Promise<GetSpacesResult> {
    return axios.get(this.basePath + "/get_spaces", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getTask(input: GetTaskInput): Promise<GetTaskResult> {
    return axios.get(this.basePath + "/get_task", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getTasks(input: GetTasksInput): Promise<GetTasksResult> {
    return axios.get(this.basePath + "/get_tasks", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getUnreadNotificationCount(input: GetUnreadNotificationCountInput): Promise<GetUnreadNotificationCountResult> {
    return axios.get(this.basePath + "/get_unread_notification_count", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async searchPeople(input: SearchPeopleInput): Promise<SearchPeopleResult> {
    return axios.get(this.basePath + "/search_people", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async searchProjectContributorCandidates(input: SearchProjectContributorCandidatesInput): Promise<SearchProjectContributorCandidatesResult> {
    return axios.get(this.basePath + "/search_project_contributor_candidates", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async acknowledgeGoalCheckIn(input: AcknowledgeGoalCheckInInput): Promise<AcknowledgeGoalCheckInResult> {
    return axios.post(this.basePath + "/acknowledge_goal_check_in", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async acknowledgeProjectCheckIn(input: AcknowledgeProjectCheckInInput): Promise<AcknowledgeProjectCheckInResult> {
    return axios.post(this.basePath + "/acknowledge_project_check_in", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addCompanyAdmins(input: AddCompanyAdminsInput): Promise<AddCompanyAdminsResult> {
    return axios.post(this.basePath + "/add_company_admins", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addCompanyMember(input: AddCompanyMemberInput): Promise<AddCompanyMemberResult> {
    return axios.post(this.basePath + "/add_company_member", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addCompanyTrustedEmailDomain(input: AddCompanyTrustedEmailDomainInput): Promise<AddCompanyTrustedEmailDomainResult> {
    return axios.post(this.basePath + "/add_company_trusted_email_domain", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addFirstCompany(input: AddFirstCompanyInput): Promise<AddFirstCompanyResult> {
    return axios.post(this.basePath + "/add_first_company", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addGroupMembers(input: AddGroupMembersInput): Promise<AddGroupMembersResult> {
    return axios.post(this.basePath + "/add_group_members", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addKeyResource(input: AddKeyResourceInput): Promise<AddKeyResourceResult> {
    return axios.post(this.basePath + "/add_key_resource", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addProjectContributor(input: AddProjectContributorInput): Promise<AddProjectContributorResult> {
    return axios.post(this.basePath + "/add_project_contributor", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addReaction(input: AddReactionInput): Promise<AddReactionResult> {
    return axios.post(this.basePath + "/add_reaction", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async archiveGoal(input: ArchiveGoalInput): Promise<ArchiveGoalResult> {
    return axios.post(this.basePath + "/archive_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async archiveProject(input: ArchiveProjectInput): Promise<ArchiveProjectResult> {
    return axios.post(this.basePath + "/archive_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
    return axios.post(this.basePath + "/change_goal_parent", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async changePasswordFirstTime(input: ChangePasswordFirstTimeInput): Promise<ChangePasswordFirstTimeResult> {
    return axios.post(this.basePath + "/change_password_first_time", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async changeTaskDescription(input: ChangeTaskDescriptionInput): Promise<ChangeTaskDescriptionResult> {
    return axios.post(this.basePath + "/change_task_description", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
    return axios.post(this.basePath + "/close_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
    return axios.post(this.basePath + "/close_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async connectGoalToProject(input: ConnectGoalToProjectInput): Promise<ConnectGoalToProjectResult> {
    return axios.post(this.basePath + "/connect_goal_to_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
    return axios.post(this.basePath + "/create_blob", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
    return axios.post(this.basePath + "/create_comment", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGoal(input: CreateGoalInput): Promise<CreateGoalResult> {
    return axios.post(this.basePath + "/create_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
    return axios.post(this.basePath + "/create_goal_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGoalUpdate(input: CreateGoalUpdateInput): Promise<CreateGoalUpdateResult> {
    return axios.post(this.basePath + "/create_goal_update", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGroup(input: CreateGroupInput): Promise<CreateGroupResult> {
    return axios.post(this.basePath + "/create_group", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
    return axios.post(this.basePath + "/create_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
    return axios.post(this.basePath + "/create_task", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async disconnectGoalFromProject(input: DisconnectGoalFromProjectInput): Promise<DisconnectGoalFromProjectResult> {
    return axios.post(this.basePath + "/disconnect_goal_from_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editComment(input: EditCommentInput): Promise<EditCommentResult> {
    return axios.post(this.basePath + "/edit_comment", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
    return axios.post(this.basePath + "/edit_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return axios.post(this.basePath + "/edit_goal_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGoalTimeframe(input: EditGoalTimeframeInput): Promise<EditGoalTimeframeResult> {
    return axios.post(this.basePath + "/edit_goal_timeframe", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGoalUpdate(input: EditGoalUpdateInput): Promise<EditGoalUpdateResult> {
    return axios.post(this.basePath + "/edit_goal_update", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGroup(input: EditGroupInput): Promise<EditGroupResult> {
    return axios.post(this.basePath + "/edit_group", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editProjectName(input: EditProjectNameInput): Promise<EditProjectNameResult> {
    return axios.post(this.basePath + "/edit_project_name", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editProjectTimeline(input: EditProjectTimelineInput): Promise<EditProjectTimelineResult> {
    return axios.post(this.basePath + "/edit_project_timeline", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async joinSpace(input: JoinSpaceInput): Promise<JoinSpaceResult> {
    return axios.post(this.basePath + "/join_space", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async markAllNotificationsAsRead(input: MarkAllNotificationsAsReadInput): Promise<MarkAllNotificationsAsReadResult> {
    return axios.post(this.basePath + "/mark_all_notifications_as_read", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadResult> {
    return axios.post(this.basePath + "/mark_notification_as_read", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async moveProjectToSpace(input: MoveProjectToSpaceInput): Promise<MoveProjectToSpaceResult> {
    return axios.post(this.basePath + "/move_project_to_space", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async newInvitationToken(input: NewInvitationTokenInput): Promise<NewInvitationTokenResult> {
    return axios.post(this.basePath + "/new_invitation_token", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async pauseProject(input: PauseProjectInput): Promise<PauseProjectResult> {
    return axios.post(this.basePath + "/pause_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async postDiscussion(input: PostDiscussionInput): Promise<PostDiscussionResult> {
    return axios.post(this.basePath + "/post_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async postMilestoneComment(input: PostMilestoneCommentInput): Promise<PostMilestoneCommentResult> {
    return axios.post(this.basePath + "/post_milestone_comment", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async postProjectCheckIn(input: PostProjectCheckInInput): Promise<PostProjectCheckInResult> {
    return axios.post(this.basePath + "/post_project_check_in", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeCompanyAdmin(input: RemoveCompanyAdminInput): Promise<RemoveCompanyAdminResult> {
    return axios.post(this.basePath + "/remove_company_admin", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeCompanyMember(input: RemoveCompanyMemberInput): Promise<RemoveCompanyMemberResult> {
    return axios.post(this.basePath + "/remove_company_member", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeCompanyTrustedEmailDomain(input: RemoveCompanyTrustedEmailDomainInput): Promise<RemoveCompanyTrustedEmailDomainResult> {
    return axios.post(this.basePath + "/remove_company_trusted_email_domain", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeGroupMember(input: RemoveGroupMemberInput): Promise<RemoveGroupMemberResult> {
    return axios.post(this.basePath + "/remove_group_member", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeKeyResource(input: RemoveKeyResourceInput): Promise<RemoveKeyResourceResult> {
    return axios.post(this.basePath + "/remove_key_resource", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeProjectContributor(input: RemoveProjectContributorInput): Promise<RemoveProjectContributorResult> {
    return axios.post(this.basePath + "/remove_project_contributor", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeProjectMilestone(input: RemoveProjectMilestoneInput): Promise<RemoveProjectMilestoneResult> {
    return axios.post(this.basePath + "/remove_project_milestone", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async reopenGoal(input: ReopenGoalInput): Promise<ReopenGoalResult> {
    return axios.post(this.basePath + "/reopen_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async resumeProject(input: ResumeProjectInput): Promise<ResumeProjectResult> {
    return axios.post(this.basePath + "/resume_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async setMilestoneDeadline(input: SetMilestoneDeadlineInput): Promise<SetMilestoneDeadlineResult> {
    return axios.post(this.basePath + "/set_milestone_deadline", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateGroupAppearance(input: UpdateGroupAppearanceInput): Promise<UpdateGroupAppearanceResult> {
    return axios.post(this.basePath + "/update_group_appearance", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMilestone(input: UpdateMilestoneInput): Promise<UpdateMilestoneResult> {
    return axios.post(this.basePath + "/update_milestone", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMilestoneDescription(input: UpdateMilestoneDescriptionInput): Promise<UpdateMilestoneDescriptionResult> {
    return axios.post(this.basePath + "/update_milestone_description", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMyAppearance(input: UpdateMyAppearanceInput): Promise<UpdateMyAppearanceResult> {
    return axios.post(this.basePath + "/update_my_appearance", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMyNotificationSettings(input: UpdateMyNotificationSettingsInput): Promise<UpdateMyNotificationSettingsResult> {
    return axios.post(this.basePath + "/update_my_notification_settings", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMyProfile(input: UpdateMyProfileInput): Promise<UpdateMyProfileResult> {
    return axios.post(this.basePath + "/update_my_profile", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateProjectContributor(input: UpdateProjectContributorInput): Promise<UpdateProjectContributorResult> {
    return axios.post(this.basePath + "/update_project_contributor", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateProjectDescription(input: UpdateProjectDescriptionInput): Promise<UpdateProjectDescriptionResult> {
    return axios.post(this.basePath + "/update_project_description", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
    return axios.post(this.basePath + "/update_task", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateTaskStatus(input: UpdateTaskStatusInput): Promise<UpdateTaskStatusResult> {
    return axios.post(this.basePath + "/update_task_status", toSnake(input)).then(({ data }) => toCamel(data));
  }

}

const defaultApiClient = new ApiClient();

export async function getActivities(input: GetActivitiesInput) : Promise<GetActivitiesResult> {
  return defaultApiClient.getActivities(input);
}
export async function getActivity(input: GetActivityInput) : Promise<GetActivityResult> {
  return defaultApiClient.getActivity(input);
}
export async function getComments(input: GetCommentsInput) : Promise<GetCommentsResult> {
  return defaultApiClient.getComments(input);
}
export async function getCompany(input: GetCompanyInput) : Promise<GetCompanyResult> {
  return defaultApiClient.getCompany(input);
}
export async function getDiscussion(input: GetDiscussionInput) : Promise<GetDiscussionResult> {
  return defaultApiClient.getDiscussion(input);
}
export async function getDiscussions(input: GetDiscussionsInput) : Promise<GetDiscussionsResult> {
  return defaultApiClient.getDiscussions(input);
}
export async function getGoal(input: GetGoalInput) : Promise<GetGoalResult> {
  return defaultApiClient.getGoal(input);
}
export async function getGoalCheckIn(input: GetGoalCheckInInput) : Promise<GetGoalCheckInResult> {
  return defaultApiClient.getGoalCheckIn(input);
}
export async function getGoalCheckIns(input: GetGoalCheckInsInput) : Promise<GetGoalCheckInsResult> {
  return defaultApiClient.getGoalCheckIns(input);
}
export async function getGoals(input: GetGoalsInput) : Promise<GetGoalsResult> {
  return defaultApiClient.getGoals(input);
}
export async function getGroup(input: GetGroupInput) : Promise<GetGroupResult> {
  return defaultApiClient.getGroup(input);
}
export async function getGroups(input: GetGroupsInput) : Promise<GetGroupsResult> {
  return defaultApiClient.getGroups(input);
}
export async function getInvitation(input: GetInvitationInput) : Promise<GetInvitationResult> {
  return defaultApiClient.getInvitation(input);
}
export async function getKeyResources(input: GetKeyResourcesInput) : Promise<GetKeyResourcesResult> {
  return defaultApiClient.getKeyResources(input);
}
export async function getMe(input: GetMeInput) : Promise<GetMeResult> {
  return defaultApiClient.getMe(input);
}
export async function getMilestone(input: GetMilestoneInput) : Promise<GetMilestoneResult> {
  return defaultApiClient.getMilestone(input);
}
export async function getNotifications(input: GetNotificationsInput) : Promise<GetNotificationsResult> {
  return defaultApiClient.getNotifications(input);
}
export async function getPeople(input: GetPeopleInput) : Promise<GetPeopleResult> {
  return defaultApiClient.getPeople(input);
}
export async function getPerson(input: GetPersonInput) : Promise<GetPersonResult> {
  return defaultApiClient.getPerson(input);
}
export async function getProject(input: GetProjectInput) : Promise<GetProjectResult> {
  return defaultApiClient.getProject(input);
}
export async function getProjectCheckIn(input: GetProjectCheckInInput) : Promise<GetProjectCheckInResult> {
  return defaultApiClient.getProjectCheckIn(input);
}
export async function getProjects(input: GetProjectsInput) : Promise<GetProjectsResult> {
  return defaultApiClient.getProjects(input);
}
export async function getSpaces(input: GetSpacesInput) : Promise<GetSpacesResult> {
  return defaultApiClient.getSpaces(input);
}
export async function getTask(input: GetTaskInput) : Promise<GetTaskResult> {
  return defaultApiClient.getTask(input);
}
export async function getTasks(input: GetTasksInput) : Promise<GetTasksResult> {
  return defaultApiClient.getTasks(input);
}
export async function getUnreadNotificationCount(input: GetUnreadNotificationCountInput) : Promise<GetUnreadNotificationCountResult> {
  return defaultApiClient.getUnreadNotificationCount(input);
}
export async function searchPeople(input: SearchPeopleInput) : Promise<SearchPeopleResult> {
  return defaultApiClient.searchPeople(input);
}
export async function searchProjectContributorCandidates(input: SearchProjectContributorCandidatesInput) : Promise<SearchProjectContributorCandidatesResult> {
  return defaultApiClient.searchProjectContributorCandidates(input);
}
export async function acknowledgeGoalCheckIn(input: AcknowledgeGoalCheckInInput) : Promise<AcknowledgeGoalCheckInResult> {
  return defaultApiClient.acknowledgeGoalCheckIn(input);
}
export async function acknowledgeProjectCheckIn(input: AcknowledgeProjectCheckInInput) : Promise<AcknowledgeProjectCheckInResult> {
  return defaultApiClient.acknowledgeProjectCheckIn(input);
}
export async function addCompanyAdmins(input: AddCompanyAdminsInput) : Promise<AddCompanyAdminsResult> {
  return defaultApiClient.addCompanyAdmins(input);
}
export async function addCompanyMember(input: AddCompanyMemberInput) : Promise<AddCompanyMemberResult> {
  return defaultApiClient.addCompanyMember(input);
}
export async function addCompanyTrustedEmailDomain(input: AddCompanyTrustedEmailDomainInput) : Promise<AddCompanyTrustedEmailDomainResult> {
  return defaultApiClient.addCompanyTrustedEmailDomain(input);
}
export async function addFirstCompany(input: AddFirstCompanyInput) : Promise<AddFirstCompanyResult> {
  return defaultApiClient.addFirstCompany(input);
}
export async function addGroupMembers(input: AddGroupMembersInput) : Promise<AddGroupMembersResult> {
  return defaultApiClient.addGroupMembers(input);
}
export async function addKeyResource(input: AddKeyResourceInput) : Promise<AddKeyResourceResult> {
  return defaultApiClient.addKeyResource(input);
}
export async function addProjectContributor(input: AddProjectContributorInput) : Promise<AddProjectContributorResult> {
  return defaultApiClient.addProjectContributor(input);
}
export async function addReaction(input: AddReactionInput) : Promise<AddReactionResult> {
  return defaultApiClient.addReaction(input);
}
export async function archiveGoal(input: ArchiveGoalInput) : Promise<ArchiveGoalResult> {
  return defaultApiClient.archiveGoal(input);
}
export async function archiveProject(input: ArchiveProjectInput) : Promise<ArchiveProjectResult> {
  return defaultApiClient.archiveProject(input);
}
export async function changeGoalParent(input: ChangeGoalParentInput) : Promise<ChangeGoalParentResult> {
  return defaultApiClient.changeGoalParent(input);
}
export async function changePasswordFirstTime(input: ChangePasswordFirstTimeInput) : Promise<ChangePasswordFirstTimeResult> {
  return defaultApiClient.changePasswordFirstTime(input);
}
export async function changeTaskDescription(input: ChangeTaskDescriptionInput) : Promise<ChangeTaskDescriptionResult> {
  return defaultApiClient.changeTaskDescription(input);
}
export async function closeGoal(input: CloseGoalInput) : Promise<CloseGoalResult> {
  return defaultApiClient.closeGoal(input);
}
export async function closeProject(input: CloseProjectInput) : Promise<CloseProjectResult> {
  return defaultApiClient.closeProject(input);
}
export async function connectGoalToProject(input: ConnectGoalToProjectInput) : Promise<ConnectGoalToProjectResult> {
  return defaultApiClient.connectGoalToProject(input);
}
export async function createBlob(input: CreateBlobInput) : Promise<CreateBlobResult> {
  return defaultApiClient.createBlob(input);
}
export async function createComment(input: CreateCommentInput) : Promise<CreateCommentResult> {
  return defaultApiClient.createComment(input);
}
export async function createGoal(input: CreateGoalInput) : Promise<CreateGoalResult> {
  return defaultApiClient.createGoal(input);
}
export async function createGoalDiscussion(input: CreateGoalDiscussionInput) : Promise<CreateGoalDiscussionResult> {
  return defaultApiClient.createGoalDiscussion(input);
}
export async function createGoalUpdate(input: CreateGoalUpdateInput) : Promise<CreateGoalUpdateResult> {
  return defaultApiClient.createGoalUpdate(input);
}
export async function createGroup(input: CreateGroupInput) : Promise<CreateGroupResult> {
  return defaultApiClient.createGroup(input);
}
export async function createProject(input: CreateProjectInput) : Promise<CreateProjectResult> {
  return defaultApiClient.createProject(input);
}
export async function createTask(input: CreateTaskInput) : Promise<CreateTaskResult> {
  return defaultApiClient.createTask(input);
}
export async function disconnectGoalFromProject(input: DisconnectGoalFromProjectInput) : Promise<DisconnectGoalFromProjectResult> {
  return defaultApiClient.disconnectGoalFromProject(input);
}
export async function editComment(input: EditCommentInput) : Promise<EditCommentResult> {
  return defaultApiClient.editComment(input);
}
export async function editDiscussion(input: EditDiscussionInput) : Promise<EditDiscussionResult> {
  return defaultApiClient.editDiscussion(input);
}
export async function editGoalDiscussion(input: EditGoalDiscussionInput) : Promise<EditGoalDiscussionResult> {
  return defaultApiClient.editGoalDiscussion(input);
}
export async function editGoalTimeframe(input: EditGoalTimeframeInput) : Promise<EditGoalTimeframeResult> {
  return defaultApiClient.editGoalTimeframe(input);
}
export async function editGoalUpdate(input: EditGoalUpdateInput) : Promise<EditGoalUpdateResult> {
  return defaultApiClient.editGoalUpdate(input);
}
export async function editGroup(input: EditGroupInput) : Promise<EditGroupResult> {
  return defaultApiClient.editGroup(input);
}
export async function editProjectName(input: EditProjectNameInput) : Promise<EditProjectNameResult> {
  return defaultApiClient.editProjectName(input);
}
export async function editProjectTimeline(input: EditProjectTimelineInput) : Promise<EditProjectTimelineResult> {
  return defaultApiClient.editProjectTimeline(input);
}
export async function joinSpace(input: JoinSpaceInput) : Promise<JoinSpaceResult> {
  return defaultApiClient.joinSpace(input);
}
export async function markAllNotificationsAsRead(input: MarkAllNotificationsAsReadInput) : Promise<MarkAllNotificationsAsReadResult> {
  return defaultApiClient.markAllNotificationsAsRead(input);
}
export async function markNotificationAsRead(input: MarkNotificationAsReadInput) : Promise<MarkNotificationAsReadResult> {
  return defaultApiClient.markNotificationAsRead(input);
}
export async function moveProjectToSpace(input: MoveProjectToSpaceInput) : Promise<MoveProjectToSpaceResult> {
  return defaultApiClient.moveProjectToSpace(input);
}
export async function newInvitationToken(input: NewInvitationTokenInput) : Promise<NewInvitationTokenResult> {
  return defaultApiClient.newInvitationToken(input);
}
export async function pauseProject(input: PauseProjectInput) : Promise<PauseProjectResult> {
  return defaultApiClient.pauseProject(input);
}
export async function postDiscussion(input: PostDiscussionInput) : Promise<PostDiscussionResult> {
  return defaultApiClient.postDiscussion(input);
}
export async function postMilestoneComment(input: PostMilestoneCommentInput) : Promise<PostMilestoneCommentResult> {
  return defaultApiClient.postMilestoneComment(input);
}
export async function postProjectCheckIn(input: PostProjectCheckInInput) : Promise<PostProjectCheckInResult> {
  return defaultApiClient.postProjectCheckIn(input);
}
export async function removeCompanyAdmin(input: RemoveCompanyAdminInput) : Promise<RemoveCompanyAdminResult> {
  return defaultApiClient.removeCompanyAdmin(input);
}
export async function removeCompanyMember(input: RemoveCompanyMemberInput) : Promise<RemoveCompanyMemberResult> {
  return defaultApiClient.removeCompanyMember(input);
}
export async function removeCompanyTrustedEmailDomain(input: RemoveCompanyTrustedEmailDomainInput) : Promise<RemoveCompanyTrustedEmailDomainResult> {
  return defaultApiClient.removeCompanyTrustedEmailDomain(input);
}
export async function removeGroupMember(input: RemoveGroupMemberInput) : Promise<RemoveGroupMemberResult> {
  return defaultApiClient.removeGroupMember(input);
}
export async function removeKeyResource(input: RemoveKeyResourceInput) : Promise<RemoveKeyResourceResult> {
  return defaultApiClient.removeKeyResource(input);
}
export async function removeProjectContributor(input: RemoveProjectContributorInput) : Promise<RemoveProjectContributorResult> {
  return defaultApiClient.removeProjectContributor(input);
}
export async function removeProjectMilestone(input: RemoveProjectMilestoneInput) : Promise<RemoveProjectMilestoneResult> {
  return defaultApiClient.removeProjectMilestone(input);
}
export async function reopenGoal(input: ReopenGoalInput) : Promise<ReopenGoalResult> {
  return defaultApiClient.reopenGoal(input);
}
export async function resumeProject(input: ResumeProjectInput) : Promise<ResumeProjectResult> {
  return defaultApiClient.resumeProject(input);
}
export async function setMilestoneDeadline(input: SetMilestoneDeadlineInput) : Promise<SetMilestoneDeadlineResult> {
  return defaultApiClient.setMilestoneDeadline(input);
}
export async function updateGroupAppearance(input: UpdateGroupAppearanceInput) : Promise<UpdateGroupAppearanceResult> {
  return defaultApiClient.updateGroupAppearance(input);
}
export async function updateMilestone(input: UpdateMilestoneInput) : Promise<UpdateMilestoneResult> {
  return defaultApiClient.updateMilestone(input);
}
export async function updateMilestoneDescription(input: UpdateMilestoneDescriptionInput) : Promise<UpdateMilestoneDescriptionResult> {
  return defaultApiClient.updateMilestoneDescription(input);
}
export async function updateMyAppearance(input: UpdateMyAppearanceInput) : Promise<UpdateMyAppearanceResult> {
  return defaultApiClient.updateMyAppearance(input);
}
export async function updateMyNotificationSettings(input: UpdateMyNotificationSettingsInput) : Promise<UpdateMyNotificationSettingsResult> {
  return defaultApiClient.updateMyNotificationSettings(input);
}
export async function updateMyProfile(input: UpdateMyProfileInput) : Promise<UpdateMyProfileResult> {
  return defaultApiClient.updateMyProfile(input);
}
export async function updateProjectContributor(input: UpdateProjectContributorInput) : Promise<UpdateProjectContributorResult> {
  return defaultApiClient.updateProjectContributor(input);
}
export async function updateProjectDescription(input: UpdateProjectDescriptionInput) : Promise<UpdateProjectDescriptionResult> {
  return defaultApiClient.updateProjectDescription(input);
}
export async function updateTask(input: UpdateTaskInput) : Promise<UpdateTaskResult> {
  return defaultApiClient.updateTask(input);
}
export async function updateTaskStatus(input: UpdateTaskStatusInput) : Promise<UpdateTaskStatusResult> {
  return defaultApiClient.updateTaskStatus(input);
}

export function useGetActivities(input: GetActivitiesInput) : UseQueryHookResult<GetActivitiesResult> {
  return useQuery<GetActivitiesResult>(() => defaultApiClient.getActivities(input));
}

export function useGetActivity(input: GetActivityInput) : UseQueryHookResult<GetActivityResult> {
  return useQuery<GetActivityResult>(() => defaultApiClient.getActivity(input));
}

export function useGetComments(input: GetCommentsInput) : UseQueryHookResult<GetCommentsResult> {
  return useQuery<GetCommentsResult>(() => defaultApiClient.getComments(input));
}

export function useGetCompany(input: GetCompanyInput) : UseQueryHookResult<GetCompanyResult> {
  return useQuery<GetCompanyResult>(() => defaultApiClient.getCompany(input));
}

export function useGetDiscussion(input: GetDiscussionInput) : UseQueryHookResult<GetDiscussionResult> {
  return useQuery<GetDiscussionResult>(() => defaultApiClient.getDiscussion(input));
}

export function useGetDiscussions(input: GetDiscussionsInput) : UseQueryHookResult<GetDiscussionsResult> {
  return useQuery<GetDiscussionsResult>(() => defaultApiClient.getDiscussions(input));
}

export function useGetGoal(input: GetGoalInput) : UseQueryHookResult<GetGoalResult> {
  return useQuery<GetGoalResult>(() => defaultApiClient.getGoal(input));
}

export function useGetGoalCheckIn(input: GetGoalCheckInInput) : UseQueryHookResult<GetGoalCheckInResult> {
  return useQuery<GetGoalCheckInResult>(() => defaultApiClient.getGoalCheckIn(input));
}

export function useGetGoalCheckIns(input: GetGoalCheckInsInput) : UseQueryHookResult<GetGoalCheckInsResult> {
  return useQuery<GetGoalCheckInsResult>(() => defaultApiClient.getGoalCheckIns(input));
}

export function useGetGoals(input: GetGoalsInput) : UseQueryHookResult<GetGoalsResult> {
  return useQuery<GetGoalsResult>(() => defaultApiClient.getGoals(input));
}

export function useGetGroup(input: GetGroupInput) : UseQueryHookResult<GetGroupResult> {
  return useQuery<GetGroupResult>(() => defaultApiClient.getGroup(input));
}

export function useGetGroups(input: GetGroupsInput) : UseQueryHookResult<GetGroupsResult> {
  return useQuery<GetGroupsResult>(() => defaultApiClient.getGroups(input));
}

export function useGetInvitation(input: GetInvitationInput) : UseQueryHookResult<GetInvitationResult> {
  return useQuery<GetInvitationResult>(() => defaultApiClient.getInvitation(input));
}

export function useGetKeyResources(input: GetKeyResourcesInput) : UseQueryHookResult<GetKeyResourcesResult> {
  return useQuery<GetKeyResourcesResult>(() => defaultApiClient.getKeyResources(input));
}

export function useGetMe(input: GetMeInput) : UseQueryHookResult<GetMeResult> {
  return useQuery<GetMeResult>(() => defaultApiClient.getMe(input));
}

export function useGetMilestone(input: GetMilestoneInput) : UseQueryHookResult<GetMilestoneResult> {
  return useQuery<GetMilestoneResult>(() => defaultApiClient.getMilestone(input));
}

export function useGetNotifications(input: GetNotificationsInput) : UseQueryHookResult<GetNotificationsResult> {
  return useQuery<GetNotificationsResult>(() => defaultApiClient.getNotifications(input));
}

export function useGetPeople(input: GetPeopleInput) : UseQueryHookResult<GetPeopleResult> {
  return useQuery<GetPeopleResult>(() => defaultApiClient.getPeople(input));
}

export function useGetPerson(input: GetPersonInput) : UseQueryHookResult<GetPersonResult> {
  return useQuery<GetPersonResult>(() => defaultApiClient.getPerson(input));
}

export function useGetProject(input: GetProjectInput) : UseQueryHookResult<GetProjectResult> {
  return useQuery<GetProjectResult>(() => defaultApiClient.getProject(input));
}

export function useGetProjectCheckIn(input: GetProjectCheckInInput) : UseQueryHookResult<GetProjectCheckInResult> {
  return useQuery<GetProjectCheckInResult>(() => defaultApiClient.getProjectCheckIn(input));
}

export function useGetProjects(input: GetProjectsInput) : UseQueryHookResult<GetProjectsResult> {
  return useQuery<GetProjectsResult>(() => defaultApiClient.getProjects(input));
}

export function useGetSpaces(input: GetSpacesInput) : UseQueryHookResult<GetSpacesResult> {
  return useQuery<GetSpacesResult>(() => defaultApiClient.getSpaces(input));
}

export function useGetTask(input: GetTaskInput) : UseQueryHookResult<GetTaskResult> {
  return useQuery<GetTaskResult>(() => defaultApiClient.getTask(input));
}

export function useGetTasks(input: GetTasksInput) : UseQueryHookResult<GetTasksResult> {
  return useQuery<GetTasksResult>(() => defaultApiClient.getTasks(input));
}

export function useGetUnreadNotificationCount(input: GetUnreadNotificationCountInput) : UseQueryHookResult<GetUnreadNotificationCountResult> {
  return useQuery<GetUnreadNotificationCountResult>(() => defaultApiClient.getUnreadNotificationCount(input));
}

export function useSearchPeople(input: SearchPeopleInput) : UseQueryHookResult<SearchPeopleResult> {
  return useQuery<SearchPeopleResult>(() => defaultApiClient.searchPeople(input));
}

export function useSearchProjectContributorCandidates(input: SearchProjectContributorCandidatesInput) : UseQueryHookResult<SearchProjectContributorCandidatesResult> {
  return useQuery<SearchProjectContributorCandidatesResult>(() => defaultApiClient.searchProjectContributorCandidates(input));
}

export function useAcknowledgeGoalCheckIn() : UseMutationHookResult<AcknowledgeGoalCheckInInput, AcknowledgeGoalCheckInResult> {
  return useMutation<AcknowledgeGoalCheckInInput, AcknowledgeGoalCheckInResult>((input) => defaultApiClient.acknowledgeGoalCheckIn(input));
}

export function useAcknowledgeProjectCheckIn() : UseMutationHookResult<AcknowledgeProjectCheckInInput, AcknowledgeProjectCheckInResult> {
  return useMutation<AcknowledgeProjectCheckInInput, AcknowledgeProjectCheckInResult>((input) => defaultApiClient.acknowledgeProjectCheckIn(input));
}

export function useAddCompanyAdmins() : UseMutationHookResult<AddCompanyAdminsInput, AddCompanyAdminsResult> {
  return useMutation<AddCompanyAdminsInput, AddCompanyAdminsResult>((input) => defaultApiClient.addCompanyAdmins(input));
}

export function useAddCompanyMember() : UseMutationHookResult<AddCompanyMemberInput, AddCompanyMemberResult> {
  return useMutation<AddCompanyMemberInput, AddCompanyMemberResult>((input) => defaultApiClient.addCompanyMember(input));
}

export function useAddCompanyTrustedEmailDomain() : UseMutationHookResult<AddCompanyTrustedEmailDomainInput, AddCompanyTrustedEmailDomainResult> {
  return useMutation<AddCompanyTrustedEmailDomainInput, AddCompanyTrustedEmailDomainResult>((input) => defaultApiClient.addCompanyTrustedEmailDomain(input));
}

export function useAddFirstCompany() : UseMutationHookResult<AddFirstCompanyInput, AddFirstCompanyResult> {
  return useMutation<AddFirstCompanyInput, AddFirstCompanyResult>((input) => defaultApiClient.addFirstCompany(input));
}

export function useAddGroupMembers() : UseMutationHookResult<AddGroupMembersInput, AddGroupMembersResult> {
  return useMutation<AddGroupMembersInput, AddGroupMembersResult>((input) => defaultApiClient.addGroupMembers(input));
}

export function useAddKeyResource() : UseMutationHookResult<AddKeyResourceInput, AddKeyResourceResult> {
  return useMutation<AddKeyResourceInput, AddKeyResourceResult>((input) => defaultApiClient.addKeyResource(input));
}

export function useAddProjectContributor() : UseMutationHookResult<AddProjectContributorInput, AddProjectContributorResult> {
  return useMutation<AddProjectContributorInput, AddProjectContributorResult>((input) => defaultApiClient.addProjectContributor(input));
}

export function useAddReaction() : UseMutationHookResult<AddReactionInput, AddReactionResult> {
  return useMutation<AddReactionInput, AddReactionResult>((input) => defaultApiClient.addReaction(input));
}

export function useArchiveGoal() : UseMutationHookResult<ArchiveGoalInput, ArchiveGoalResult> {
  return useMutation<ArchiveGoalInput, ArchiveGoalResult>((input) => defaultApiClient.archiveGoal(input));
}

export function useArchiveProject() : UseMutationHookResult<ArchiveProjectInput, ArchiveProjectResult> {
  return useMutation<ArchiveProjectInput, ArchiveProjectResult>((input) => defaultApiClient.archiveProject(input));
}

export function useChangeGoalParent() : UseMutationHookResult<ChangeGoalParentInput, ChangeGoalParentResult> {
  return useMutation<ChangeGoalParentInput, ChangeGoalParentResult>((input) => defaultApiClient.changeGoalParent(input));
}

export function useChangePasswordFirstTime() : UseMutationHookResult<ChangePasswordFirstTimeInput, ChangePasswordFirstTimeResult> {
  return useMutation<ChangePasswordFirstTimeInput, ChangePasswordFirstTimeResult>((input) => defaultApiClient.changePasswordFirstTime(input));
}

export function useChangeTaskDescription() : UseMutationHookResult<ChangeTaskDescriptionInput, ChangeTaskDescriptionResult> {
  return useMutation<ChangeTaskDescriptionInput, ChangeTaskDescriptionResult>((input) => defaultApiClient.changeTaskDescription(input));
}

export function useCloseGoal() : UseMutationHookResult<CloseGoalInput, CloseGoalResult> {
  return useMutation<CloseGoalInput, CloseGoalResult>((input) => defaultApiClient.closeGoal(input));
}

export function useCloseProject() : UseMutationHookResult<CloseProjectInput, CloseProjectResult> {
  return useMutation<CloseProjectInput, CloseProjectResult>((input) => defaultApiClient.closeProject(input));
}

export function useConnectGoalToProject() : UseMutationHookResult<ConnectGoalToProjectInput, ConnectGoalToProjectResult> {
  return useMutation<ConnectGoalToProjectInput, ConnectGoalToProjectResult>((input) => defaultApiClient.connectGoalToProject(input));
}

export function useCreateBlob() : UseMutationHookResult<CreateBlobInput, CreateBlobResult> {
  return useMutation<CreateBlobInput, CreateBlobResult>((input) => defaultApiClient.createBlob(input));
}

export function useCreateComment() : UseMutationHookResult<CreateCommentInput, CreateCommentResult> {
  return useMutation<CreateCommentInput, CreateCommentResult>((input) => defaultApiClient.createComment(input));
}

export function useCreateGoal() : UseMutationHookResult<CreateGoalInput, CreateGoalResult> {
  return useMutation<CreateGoalInput, CreateGoalResult>((input) => defaultApiClient.createGoal(input));
}

export function useCreateGoalDiscussion() : UseMutationHookResult<CreateGoalDiscussionInput, CreateGoalDiscussionResult> {
  return useMutation<CreateGoalDiscussionInput, CreateGoalDiscussionResult>((input) => defaultApiClient.createGoalDiscussion(input));
}

export function useCreateGoalUpdate() : UseMutationHookResult<CreateGoalUpdateInput, CreateGoalUpdateResult> {
  return useMutation<CreateGoalUpdateInput, CreateGoalUpdateResult>((input) => defaultApiClient.createGoalUpdate(input));
}

export function useCreateGroup() : UseMutationHookResult<CreateGroupInput, CreateGroupResult> {
  return useMutation<CreateGroupInput, CreateGroupResult>((input) => defaultApiClient.createGroup(input));
}

export function useCreateProject() : UseMutationHookResult<CreateProjectInput, CreateProjectResult> {
  return useMutation<CreateProjectInput, CreateProjectResult>((input) => defaultApiClient.createProject(input));
}

export function useCreateTask() : UseMutationHookResult<CreateTaskInput, CreateTaskResult> {
  return useMutation<CreateTaskInput, CreateTaskResult>((input) => defaultApiClient.createTask(input));
}

export function useDisconnectGoalFromProject() : UseMutationHookResult<DisconnectGoalFromProjectInput, DisconnectGoalFromProjectResult> {
  return useMutation<DisconnectGoalFromProjectInput, DisconnectGoalFromProjectResult>((input) => defaultApiClient.disconnectGoalFromProject(input));
}

export function useEditComment() : UseMutationHookResult<EditCommentInput, EditCommentResult> {
  return useMutation<EditCommentInput, EditCommentResult>((input) => defaultApiClient.editComment(input));
}

export function useEditDiscussion() : UseMutationHookResult<EditDiscussionInput, EditDiscussionResult> {
  return useMutation<EditDiscussionInput, EditDiscussionResult>((input) => defaultApiClient.editDiscussion(input));
}

export function useEditGoalDiscussion() : UseMutationHookResult<EditGoalDiscussionInput, EditGoalDiscussionResult> {
  return useMutation<EditGoalDiscussionInput, EditGoalDiscussionResult>((input) => defaultApiClient.editGoalDiscussion(input));
}

export function useEditGoalTimeframe() : UseMutationHookResult<EditGoalTimeframeInput, EditGoalTimeframeResult> {
  return useMutation<EditGoalTimeframeInput, EditGoalTimeframeResult>((input) => defaultApiClient.editGoalTimeframe(input));
}

export function useEditGoalUpdate() : UseMutationHookResult<EditGoalUpdateInput, EditGoalUpdateResult> {
  return useMutation<EditGoalUpdateInput, EditGoalUpdateResult>((input) => defaultApiClient.editGoalUpdate(input));
}

export function useEditGroup() : UseMutationHookResult<EditGroupInput, EditGroupResult> {
  return useMutation<EditGroupInput, EditGroupResult>((input) => defaultApiClient.editGroup(input));
}

export function useEditProjectName() : UseMutationHookResult<EditProjectNameInput, EditProjectNameResult> {
  return useMutation<EditProjectNameInput, EditProjectNameResult>((input) => defaultApiClient.editProjectName(input));
}

export function useEditProjectTimeline() : UseMutationHookResult<EditProjectTimelineInput, EditProjectTimelineResult> {
  return useMutation<EditProjectTimelineInput, EditProjectTimelineResult>((input) => defaultApiClient.editProjectTimeline(input));
}

export function useJoinSpace() : UseMutationHookResult<JoinSpaceInput, JoinSpaceResult> {
  return useMutation<JoinSpaceInput, JoinSpaceResult>((input) => defaultApiClient.joinSpace(input));
}

export function useMarkAllNotificationsAsRead() : UseMutationHookResult<MarkAllNotificationsAsReadInput, MarkAllNotificationsAsReadResult> {
  return useMutation<MarkAllNotificationsAsReadInput, MarkAllNotificationsAsReadResult>((input) => defaultApiClient.markAllNotificationsAsRead(input));
}

export function useMarkNotificationAsRead() : UseMutationHookResult<MarkNotificationAsReadInput, MarkNotificationAsReadResult> {
  return useMutation<MarkNotificationAsReadInput, MarkNotificationAsReadResult>((input) => defaultApiClient.markNotificationAsRead(input));
}

export function useMoveProjectToSpace() : UseMutationHookResult<MoveProjectToSpaceInput, MoveProjectToSpaceResult> {
  return useMutation<MoveProjectToSpaceInput, MoveProjectToSpaceResult>((input) => defaultApiClient.moveProjectToSpace(input));
}

export function useNewInvitationToken() : UseMutationHookResult<NewInvitationTokenInput, NewInvitationTokenResult> {
  return useMutation<NewInvitationTokenInput, NewInvitationTokenResult>((input) => defaultApiClient.newInvitationToken(input));
}

export function usePauseProject() : UseMutationHookResult<PauseProjectInput, PauseProjectResult> {
  return useMutation<PauseProjectInput, PauseProjectResult>((input) => defaultApiClient.pauseProject(input));
}

export function usePostDiscussion() : UseMutationHookResult<PostDiscussionInput, PostDiscussionResult> {
  return useMutation<PostDiscussionInput, PostDiscussionResult>((input) => defaultApiClient.postDiscussion(input));
}

export function usePostMilestoneComment() : UseMutationHookResult<PostMilestoneCommentInput, PostMilestoneCommentResult> {
  return useMutation<PostMilestoneCommentInput, PostMilestoneCommentResult>((input) => defaultApiClient.postMilestoneComment(input));
}

export function usePostProjectCheckIn() : UseMutationHookResult<PostProjectCheckInInput, PostProjectCheckInResult> {
  return useMutation<PostProjectCheckInInput, PostProjectCheckInResult>((input) => defaultApiClient.postProjectCheckIn(input));
}

export function useRemoveCompanyAdmin() : UseMutationHookResult<RemoveCompanyAdminInput, RemoveCompanyAdminResult> {
  return useMutation<RemoveCompanyAdminInput, RemoveCompanyAdminResult>((input) => defaultApiClient.removeCompanyAdmin(input));
}

export function useRemoveCompanyMember() : UseMutationHookResult<RemoveCompanyMemberInput, RemoveCompanyMemberResult> {
  return useMutation<RemoveCompanyMemberInput, RemoveCompanyMemberResult>((input) => defaultApiClient.removeCompanyMember(input));
}

export function useRemoveCompanyTrustedEmailDomain() : UseMutationHookResult<RemoveCompanyTrustedEmailDomainInput, RemoveCompanyTrustedEmailDomainResult> {
  return useMutation<RemoveCompanyTrustedEmailDomainInput, RemoveCompanyTrustedEmailDomainResult>((input) => defaultApiClient.removeCompanyTrustedEmailDomain(input));
}

export function useRemoveGroupMember() : UseMutationHookResult<RemoveGroupMemberInput, RemoveGroupMemberResult> {
  return useMutation<RemoveGroupMemberInput, RemoveGroupMemberResult>((input) => defaultApiClient.removeGroupMember(input));
}

export function useRemoveKeyResource() : UseMutationHookResult<RemoveKeyResourceInput, RemoveKeyResourceResult> {
  return useMutation<RemoveKeyResourceInput, RemoveKeyResourceResult>((input) => defaultApiClient.removeKeyResource(input));
}

export function useRemoveProjectContributor() : UseMutationHookResult<RemoveProjectContributorInput, RemoveProjectContributorResult> {
  return useMutation<RemoveProjectContributorInput, RemoveProjectContributorResult>((input) => defaultApiClient.removeProjectContributor(input));
}

export function useRemoveProjectMilestone() : UseMutationHookResult<RemoveProjectMilestoneInput, RemoveProjectMilestoneResult> {
  return useMutation<RemoveProjectMilestoneInput, RemoveProjectMilestoneResult>((input) => defaultApiClient.removeProjectMilestone(input));
}

export function useReopenGoal() : UseMutationHookResult<ReopenGoalInput, ReopenGoalResult> {
  return useMutation<ReopenGoalInput, ReopenGoalResult>((input) => defaultApiClient.reopenGoal(input));
}

export function useResumeProject() : UseMutationHookResult<ResumeProjectInput, ResumeProjectResult> {
  return useMutation<ResumeProjectInput, ResumeProjectResult>((input) => defaultApiClient.resumeProject(input));
}

export function useSetMilestoneDeadline() : UseMutationHookResult<SetMilestoneDeadlineInput, SetMilestoneDeadlineResult> {
  return useMutation<SetMilestoneDeadlineInput, SetMilestoneDeadlineResult>((input) => defaultApiClient.setMilestoneDeadline(input));
}

export function useUpdateGroupAppearance() : UseMutationHookResult<UpdateGroupAppearanceInput, UpdateGroupAppearanceResult> {
  return useMutation<UpdateGroupAppearanceInput, UpdateGroupAppearanceResult>((input) => defaultApiClient.updateGroupAppearance(input));
}

export function useUpdateMilestone() : UseMutationHookResult<UpdateMilestoneInput, UpdateMilestoneResult> {
  return useMutation<UpdateMilestoneInput, UpdateMilestoneResult>((input) => defaultApiClient.updateMilestone(input));
}

export function useUpdateMilestoneDescription() : UseMutationHookResult<UpdateMilestoneDescriptionInput, UpdateMilestoneDescriptionResult> {
  return useMutation<UpdateMilestoneDescriptionInput, UpdateMilestoneDescriptionResult>((input) => defaultApiClient.updateMilestoneDescription(input));
}

export function useUpdateMyAppearance() : UseMutationHookResult<UpdateMyAppearanceInput, UpdateMyAppearanceResult> {
  return useMutation<UpdateMyAppearanceInput, UpdateMyAppearanceResult>((input) => defaultApiClient.updateMyAppearance(input));
}

export function useUpdateMyNotificationSettings() : UseMutationHookResult<UpdateMyNotificationSettingsInput, UpdateMyNotificationSettingsResult> {
  return useMutation<UpdateMyNotificationSettingsInput, UpdateMyNotificationSettingsResult>((input) => defaultApiClient.updateMyNotificationSettings(input));
}

export function useUpdateMyProfile() : UseMutationHookResult<UpdateMyProfileInput, UpdateMyProfileResult> {
  return useMutation<UpdateMyProfileInput, UpdateMyProfileResult>((input) => defaultApiClient.updateMyProfile(input));
}

export function useUpdateProjectContributor() : UseMutationHookResult<UpdateProjectContributorInput, UpdateProjectContributorResult> {
  return useMutation<UpdateProjectContributorInput, UpdateProjectContributorResult>((input) => defaultApiClient.updateProjectContributor(input));
}

export function useUpdateProjectDescription() : UseMutationHookResult<UpdateProjectDescriptionInput, UpdateProjectDescriptionResult> {
  return useMutation<UpdateProjectDescriptionInput, UpdateProjectDescriptionResult>((input) => defaultApiClient.updateProjectDescription(input));
}

export function useUpdateTask() : UseMutationHookResult<UpdateTaskInput, UpdateTaskResult> {
  return useMutation<UpdateTaskInput, UpdateTaskResult>((input) => defaultApiClient.updateTask(input));
}

export function useUpdateTaskStatus() : UseMutationHookResult<UpdateTaskStatusInput, UpdateTaskStatusResult> {
  return useMutation<UpdateTaskStatusInput, UpdateTaskStatusResult>((input) => defaultApiClient.updateTaskStatus(input));
}

export default {
  configureDefault: (config: ApiClientConfig) => defaultApiClient.configure(config),

  getActivities,
  useGetActivities,
  getActivity,
  useGetActivity,
  getComments,
  useGetComments,
  getCompany,
  useGetCompany,
  getDiscussion,
  useGetDiscussion,
  getDiscussions,
  useGetDiscussions,
  getGoal,
  useGetGoal,
  getGoalCheckIn,
  useGetGoalCheckIn,
  getGoalCheckIns,
  useGetGoalCheckIns,
  getGoals,
  useGetGoals,
  getGroup,
  useGetGroup,
  getGroups,
  useGetGroups,
  getInvitation,
  useGetInvitation,
  getKeyResources,
  useGetKeyResources,
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
  getProjects,
  useGetProjects,
  getSpaces,
  useGetSpaces,
  getTask,
  useGetTask,
  getTasks,
  useGetTasks,
  getUnreadNotificationCount,
  useGetUnreadNotificationCount,
  searchPeople,
  useSearchPeople,
  searchProjectContributorCandidates,
  useSearchProjectContributorCandidates,
  acknowledgeGoalCheckIn,
  useAcknowledgeGoalCheckIn,
  acknowledgeProjectCheckIn,
  useAcknowledgeProjectCheckIn,
  addCompanyAdmins,
  useAddCompanyAdmins,
  addCompanyMember,
  useAddCompanyMember,
  addCompanyTrustedEmailDomain,
  useAddCompanyTrustedEmailDomain,
  addFirstCompany,
  useAddFirstCompany,
  addGroupMembers,
  useAddGroupMembers,
  addKeyResource,
  useAddKeyResource,
  addProjectContributor,
  useAddProjectContributor,
  addReaction,
  useAddReaction,
  archiveGoal,
  useArchiveGoal,
  archiveProject,
  useArchiveProject,
  changeGoalParent,
  useChangeGoalParent,
  changePasswordFirstTime,
  useChangePasswordFirstTime,
  changeTaskDescription,
  useChangeTaskDescription,
  closeGoal,
  useCloseGoal,
  closeProject,
  useCloseProject,
  connectGoalToProject,
  useConnectGoalToProject,
  createBlob,
  useCreateBlob,
  createComment,
  useCreateComment,
  createGoal,
  useCreateGoal,
  createGoalDiscussion,
  useCreateGoalDiscussion,
  createGoalUpdate,
  useCreateGoalUpdate,
  createGroup,
  useCreateGroup,
  createProject,
  useCreateProject,
  createTask,
  useCreateTask,
  disconnectGoalFromProject,
  useDisconnectGoalFromProject,
  editComment,
  useEditComment,
  editDiscussion,
  useEditDiscussion,
  editGoalDiscussion,
  useEditGoalDiscussion,
  editGoalTimeframe,
  useEditGoalTimeframe,
  editGoalUpdate,
  useEditGoalUpdate,
  editGroup,
  useEditGroup,
  editProjectName,
  useEditProjectName,
  editProjectTimeline,
  useEditProjectTimeline,
  joinSpace,
  useJoinSpace,
  markAllNotificationsAsRead,
  useMarkAllNotificationsAsRead,
  markNotificationAsRead,
  useMarkNotificationAsRead,
  moveProjectToSpace,
  useMoveProjectToSpace,
  newInvitationToken,
  useNewInvitationToken,
  pauseProject,
  usePauseProject,
  postDiscussion,
  usePostDiscussion,
  postMilestoneComment,
  usePostMilestoneComment,
  postProjectCheckIn,
  usePostProjectCheckIn,
  removeCompanyAdmin,
  useRemoveCompanyAdmin,
  removeCompanyMember,
  useRemoveCompanyMember,
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
  reopenGoal,
  useReopenGoal,
  resumeProject,
  useResumeProject,
  setMilestoneDeadline,
  useSetMilestoneDeadline,
  updateGroupAppearance,
  useUpdateGroupAppearance,
  updateMilestone,
  useUpdateMilestone,
  updateMilestoneDescription,
  useUpdateMilestoneDescription,
  updateMyAppearance,
  useUpdateMyAppearance,
  updateMyNotificationSettings,
  useUpdateMyNotificationSettings,
  updateMyProfile,
  useUpdateMyProfile,
  updateProjectContributor,
  useUpdateProjectContributor,
  updateProjectDescription,
  useUpdateProjectDescription,
  updateTask,
  useUpdateTask,
  updateTaskStatus,
  useUpdateTaskStatus,
};

