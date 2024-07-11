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
      if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
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
      if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
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

type UseQueryHookResult<ResultT> = { data: ResultT | null, loading: boolean, error: Error | null, refetch: () => void };

export function useQuery<ResultT>(fn: () => Promise<ResultT>) : UseQueryHookResult<ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(() => {
    setError(null);

    fn().then(setData).catch(setError).finally(() => setLoading(false));
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return [execute, { data, loading, error }];
}

export interface AccessLevels {
  public?: number | null;
  company?: number | null;
  space?: number | null;
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
}

export interface ActivityContentCommentAdded {
  comment?: Comment | null;
  activity?: Activity | null;
}

export interface ActivityContentDiscussionCommentSubmitted {
  spaceId?: string | null;
  discussionId?: string | null;
  discussion?: Discussion | null;
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
  goal?: Goal | null;
  update?: Update | null;
}

export interface ActivityContentGoalCheckInAcknowledgement {
  goal?: Goal | null;
  update?: Update | null;
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
  companyId?: string | null;
  oldParentGoalId?: string | null;
  newParentGoalId?: string | null;
}

export interface ActivityContentGoalTimeframeEditing {
  goal?: Goal | null;
  oldTimeframe?: Timeframe | null;
  newTimeframe?: Timeframe | null;
}

export interface ActivityContentGroupEdited {
  exampleField?: string | null;
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

export interface ActivityContentSpaceJoining {
  companyId?: string | null;
  spaceId?: string | null;
  space?: Space | null;
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

export interface AddMemberInput {
  id?: string | null;
  permissions?: number | null;
}

export interface Assignment {
  type?: string | null;
  due?: string | null;
  resource?: AssignmentResource | null;
}

export interface Assignments {
  assignments?: Assignment[] | null;
}

export interface Comment {
  id?: string | null;
  insertedAt?: string | null;
  content?: string | null;
  author?: Person | null;
  reactions?: Reaction[] | null;
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
}

export interface Company {
  id?: string | null;
  name?: string | null;
  mission?: string | null;
  trustedEmailDomains?: string[] | null;
  enabledExperimentalFeatures?: string[] | null;
  companySpaceId?: string | null;
  admins?: Person[] | null;
  people?: Person[] | null;
  memberCount?: number | null;
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
  author?: Person | null;
  title?: string | null;
  body?: string | null;
  space?: Space | null;
  reactions?: Reaction[] | null;
  comments?: Comment[] | null;
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
  id?: string | null;
  name?: string | null;
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
  lastCheckIn?: GoalProgressUpdate | null;
  permissions?: GoalPermissions | null;
  isArchived?: boolean | null;
  isClosed?: boolean | null;
  archivedAt?: string | null;
  space?: Space | null;
  myRole?: string | null;
  accessLevels?: AccessLevels | null;
}

export interface GoalEditingUpdatedTarget {
  id?: string | null;
  oldName?: string | null;
  newName?: string | null;
}

export interface GoalPermissions {
  canEdit?: boolean | null;
  canCheckIn?: boolean | null;
  canAcknowledgeCheckIn?: boolean | null;
  canClose?: boolean | null;
  canArchive?: boolean | null;
}

export interface GoalProgressUpdate {
  id?: string | null;
  message?: string | null;
  insertedAt?: string | null;
  author?: Person | null;
  acknowledged?: boolean | null;
  acknowledgedAt?: string | null;
  acknowledgingPerson?: Person | null;
  reactions?: Reaction[] | null;
  goalTargetUpdates?: GoalTargetUpdates[] | null;
  commentsCount?: number | null;
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

export interface Invitation {
  id?: string | null;
  adminName?: string | null;
  admin?: Person | null;
  member?: Person | null;
  company?: Company | null;
  token?: string | null;
}

export interface Milestone {
  id?: string | null;
  projectId?: string | null;
  title?: string | null;
  status?: string | null;
  insertedAt?: string | null;
  deadlineAt?: string | null;
  completedAt?: string | null;
  description?: string | null;
  comments?: MilestoneComment[] | null;
  tasksKanbanState?: string | null;
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
  id?: string | null;
  managerId?: string | null;
  fullName?: string | null;
  title?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  companyRole?: string | null;
  email?: string | null;
  sendDailySummary?: boolean | null;
  notifyOnMention?: boolean | null;
  notifyAboutAssignments?: boolean | null;
  suspended?: boolean | null;
  company?: Company | null;
  manager?: Person | null;
  reports?: Person[] | null;
  peers?: Person[] | null;
  theme?: string | null;
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
  private?: boolean | null;
  status?: string | null;
  closedAt?: string | null;
  retrospective?: string | null;
  description?: string | null;
  goal?: Goal | null;
  lastCheckIn?: ProjectCheckIn | null;
  milestones?: Milestone[] | null;
  contributors?: ProjectContributor[] | null;
  keyResources?: ProjectKeyResource[] | null;
  closedBy?: Person | null;
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
}

export interface ProjectContributor {
  id?: string | null;
  responsibility?: string | null;
  role?: string | null;
  person?: Person | null;
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
  canEditPermissions?: boolean | null;
  canPause?: boolean | null;
  canCheckIn?: boolean | null;
  canAcknowledgeCheckIn?: boolean | null;
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

export interface Space {
  id?: string | null;
  name?: string | null;
  mission?: string | null;
  isMember?: boolean | null;
  isCompanySpace?: boolean | null;
  privateSpace?: boolean | null;
  icon?: string | null;
  color?: string | null;
  members?: Person[] | null;
  accessLevels?: AccessLevels | null;
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

export interface UpdateContentGoalCheckIn {
  message?: string | null;
  targets?: UpdateContentGoalCheckInTarget[] | null;
}

export interface UpdateContentGoalCheckInTarget {
  id?: string | null;
  name?: string | null;
  value?: number | null;
  unit?: string | null;
  previousValue?: number | null;
  index?: number | null;
  from?: number | null;
  to?: number | null;
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

export type ActivityContent = ActivityContentCommentAdded | ActivityContentDiscussionCommentSubmitted | ActivityContentDiscussionEditing | ActivityContentDiscussionPosting | ActivityContentGoalArchived | ActivityContentGoalCheckIn | ActivityContentGoalCheckInAcknowledgement | ActivityContentGoalCheckInEdit | ActivityContentGoalClosing | ActivityContentGoalCreated | ActivityContentGoalDiscussionCreation | ActivityContentGoalDiscussionEditing | ActivityContentGoalEditing | ActivityContentGoalReopening | ActivityContentGoalReparent | ActivityContentGoalTimeframeEditing | ActivityContentGroupEdited | ActivityContentProjectArchived | ActivityContentProjectCheckInAcknowledged | ActivityContentProjectCheckInCommented | ActivityContentProjectCheckInEdit | ActivityContentProjectCheckInSubmitted | ActivityContentProjectClosed | ActivityContentProjectContributorAddition | ActivityContentProjectCreated | ActivityContentProjectDiscussionSubmitted | ActivityContentProjectGoalConnection | ActivityContentProjectGoalDisconnection | ActivityContentProjectMilestoneCommented | ActivityContentProjectMoved | ActivityContentProjectPausing | ActivityContentProjectRenamed | ActivityContentProjectResuming | ActivityContentProjectReviewAcknowledged | ActivityContentProjectReviewCommented | ActivityContentProjectReviewRequestSubmitted | ActivityContentProjectReviewSubmitted | ActivityContentProjectTimelineEdited | ActivityContentSpaceJoining | ActivityContentTaskAdding | ActivityContentTaskAssigneeAssignment | ActivityContentTaskClosing | ActivityContentTaskDescriptionChange | ActivityContentTaskNameEditing | ActivityContentTaskPriorityChange | ActivityContentTaskReopening | ActivityContentTaskSizeChange | ActivityContentTaskStatusChange | ActivityContentTaskUpdate;

export type ActivityDataUnion = ActivityEventDataProjectCreate | ActivityEventDataMilestoneCreate | ActivityEventDataCommentPost;

export type ActivityResourceUnion = Project | Update | Milestone | Comment;

export type AssignmentResource = Project | Milestone;

export type PanelLinkedResource = Project;

export type UpdateContent = UpdateContentProjectCreated | UpdateContentProjectStartTimeChanged | UpdateContentProjectEndTimeChanged | UpdateContentProjectContributorAdded | UpdateContentProjectContributorRemoved | UpdateContentProjectMilestoneCreated | UpdateContentProjectMilestoneCompleted | UpdateContentProjectMilestoneDeadlineChanged | UpdateContentProjectMilestoneDeleted | UpdateContentStatusUpdate | UpdateContentGoalCheckIn | UpdateContentReview | UpdateContentProjectDiscussion | UpdateContentMessage;

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
}

export interface GetActivityResult {
  activity?: Activity | null;
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
  id?: string | null;
  includeAdmins?: boolean | null;
  includePeople?: boolean | null;
}

export interface GetCompanyResult {
  company?: Company | null;
}


export interface GetDiscussionInput {
  id?: string | null;
  includeAuthor?: boolean | null;
  includeComments?: boolean | null;
  includeReactions?: boolean | null;
}

export interface GetDiscussionResult {
  discussion?: Discussion | null;
}


export interface GetDiscussionsInput {
  spaceId?: string | null;
}

export interface GetDiscussionsResult {
  discussions?: Discussion[] | null;
}


export interface GetGoalInput {
  id?: string | null;
  includeChampion?: boolean | null;
  includeClosedBy?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeParentGoal?: boolean | null;
  includePermissions?: boolean | null;
  includeProjects?: boolean | null;
  includeReviewer?: boolean | null;
  includeSpace?: boolean | null;
  includeTargets?: boolean | null;
  includeAccessLevels?: boolean | null;
}

export interface GetGoalResult {
  goal?: Goal | null;
}


export interface GetGoalCheckInInput {

}

export interface GetGoalCheckInResult {

}


export interface GetGoalCheckInsInput {

}

export interface GetGoalCheckInsResult {

}


export interface GetGoalProgressUpdateInput {
  id?: string | null;
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
  includeTargets?: boolean | null;
  includeProjects?: boolean | null;
  includeSpace?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeChampion?: boolean | null;
  includeReviewer?: boolean | null;
  includeParentGoal?: boolean | null;
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
  includeTasksKanban?: boolean | null;
  includeProject?: boolean | null;
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
  includeSuspended?: boolean | null;
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
  includeClosedBy?: boolean | null;
  includeContributors?: boolean | null;
  includeGoal?: boolean | null;
  includeKeyResources?: boolean | null;
  includeLastCheckIn?: boolean | null;
  includeMilestones?: boolean | null;
  includePermissions?: boolean | null;
  includeChampion?: boolean | null;
  includeReviewer?: boolean | null;
  includeSpace?: boolean | null;
  includeAccessLevels?: boolean | null;
}

export interface GetProjectResult {
  project?: Project | null;
}


export interface GetProjectCheckInInput {
  id?: string | null;
  includeAuthor?: boolean | null;
  includeProject?: boolean | null;
  includeReactions?: boolean | null;
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
  includeGoal?: boolean | null;
  includeArchived?: boolean | null;
}

export interface GetProjectsResult {
  projects?: Project[] | null;
}


export interface GetSpaceInput {
  id?: string | null;
  includeMembers?: boolean | null;
  includeAccessLevels?: boolean | null;
}

export interface GetSpaceResult {
  space?: Space | null;
}


export interface GetSpacesInput {

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


export interface GetUnreadNotificationCountInput {

}

export interface GetUnreadNotificationCountResult {
  unread?: number | null;
}


export interface SearchPeopleInput {
  query?: string | null;
  ignoredIds?: string[] | null;
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


export interface AddCompanyAdminsInput {
  peopleIds?: string[] | null;
}

export interface AddCompanyAdminsResult {

}


export interface AddCompanyMemberInput {
  fullName?: string | null;
  email?: string | null;
  title?: string | null;
}

export interface AddCompanyMemberResult {
  invitation?: Invitation | null;
}


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
  role?: string | null;
  password?: string | null;
  passwordConfirmation?: string | null;
}

export interface AddFirstCompanyResult {
  company?: Company | null;
}


export interface AddGroupMembersInput {
  groupId?: string | null;
  members?: AddMemberInput[] | null;
}

export interface AddGroupMembersResult {

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
}

export interface AddProjectContributorResult {
  projectContributor?: ProjectContributor | null;
}


export interface AddReactionInput {
  entityId?: string | null;
  entityType?: string | null;
  emoji?: string | null;
}

export interface AddReactionResult {
  reaction?: Reaction | null;
}


export interface ArchiveGoalInput {
  goalId?: string | null;
}

export interface ArchiveGoalResult {
  goal?: Goal | null;
}


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


export interface ChangePasswordFirstTimeInput {
  token?: string | null;
  password?: string | null;
  passwordConfirmation?: string | null;
}

export interface ChangePasswordFirstTimeResult {
  result?: string | null;
}


export interface ChangeTaskDescriptionInput {
  taskId?: string | null;
  description?: string | null;
}

export interface ChangeTaskDescriptionResult {
  task?: Task | null;
}


export interface CloseGoalInput {
  goalId?: string | null;
  success?: string | null;
  retrospective?: string | null;
}

export interface CloseGoalResult {
  goal?: Goal | null;
}


export interface CloseProjectInput {
  projectId?: string | null;
  retrospective?: string | null;
}

export interface CloseProjectResult {
  project?: Project | null;
}


export interface ConnectGoalToProjectInput {
  projectId?: string | null;
  goalId?: string | null;
}

export interface ConnectGoalToProjectResult {
  project?: Project | null;
}


export interface CreateBlobInput {
  filename?: string | null;
  size?: number | null;
  contentType?: string | null;
}

export interface CreateBlobResult {
  id?: string | null;
  url?: string | null;
  signedUploadUrl?: string | null;
  uploadStrategy?: string | null;
}


export interface CreateCommentInput {
  entityId?: string | null;
  entityType?: string | null;
  content?: string | null;
}

export interface CreateCommentResult {
  comment?: Comment | null;
}


export interface CreateGoalInput {
  spaceId?: string | null;
  name?: string | null;
  championId?: string | null;
  reviewerId?: string | null;
  timeframe?: Timeframe | null;
  targets?: CreateTargetInput[] | null;
  description?: string | null;
  parentGoalId?: string | null;
  anonymousAccessLevel?: number | null;
  companyAccessLevel?: number | null;
  spaceAccessLevel?: number | null;
}

export interface CreateGoalResult {
  goal?: Goal | null;
}


export interface CreateGoalDiscussionInput {
  goalId?: string | null;
  title?: string | null;
  message?: string | null;
}

export interface CreateGoalDiscussionResult {
  id?: string | null;
}


export interface CreateGoalUpdateInput {

}

export interface CreateGoalUpdateResult {

}


export interface CreateGroupInput {
  name?: string | null;
  mission?: string | null;
  icon?: string | null;
  color?: string | null;
  companyPermissions?: number | null;
  publicPermissions?: number | null;
}

export interface CreateGroupResult {
  space?: Space | null;
}


export interface CreateProjectInput {
  spaceId?: string | null;
  name?: string | null;
  championId?: string | null;
  reviewerId?: string | null;
  visibility?: string | null;
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


export interface CreateTaskInput {
  name?: string | null;
  assigneeIds?: string[] | null;
  description?: string | null;
  milestoneId?: string | null;
}

export interface CreateTaskResult {
  task?: Task | null;
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
}

export interface EditCommentResult {
  comment?: Comment | null;
}


export interface EditDiscussionInput {
  discussionId?: string | null;
  title?: string | null;
  body?: string | null;
}

export interface EditDiscussionResult {
  discussion?: Discussion | null;
}


export interface EditGoalInput {
  goalId?: string | null;
  name?: string | null;
  championId?: string | null;
  reviewerId?: string | null;
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
  activityId?: string | null;
  title?: string | null;
  message?: string | null;
}

export interface EditGoalDiscussionResult {
  activity?: Activity | null;
}


export interface EditGoalProgressUpdateInput {
  id?: string | null;
  content?: string | null;
  newTargetValues?: string | null;
}

export interface EditGoalProgressUpdateResult {
  update?: GoalProgressUpdate | null;
}


export interface EditGoalTimeframeInput {
  id?: string | null;
  timeframe?: Timeframe | null;
  comment?: string | null;
}

export interface EditGoalTimeframeResult {
  goal?: Goal | null;
}


export interface EditGroupInput {
  id?: string | null;
  name?: string | null;
  mission?: string | null;
}

export interface EditGroupResult {
  space?: Space | null;
}


export interface EditKeyResourceInput {
  id?: string | null;
  title?: string | null;
  link?: string | null;
}

export interface EditKeyResourceResult {
  keyResource?: ProjectKeyResource | null;
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


export interface EditSpacePermissionsInput {
  spaceId?: string | null;
  accessLevels?: AccessLevels | null;
}

export interface EditSpacePermissionsResult {
  success?: boolean | null;
}


export interface JoinSpaceInput {
  spaceId?: string | null;
}

export interface JoinSpaceResult {

}


export interface MarkAllNotificationsAsReadInput {

}

export interface MarkAllNotificationsAsReadResult {

}


export interface MarkNotificationAsReadInput {
  id?: string | null;
}

export interface MarkNotificationAsReadResult {

}


export interface MoveProjectToSpaceInput {
  projectId?: string | null;
  spaceId?: string | null;
}

export interface MoveProjectToSpaceResult {

}


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
  spaceId?: string | null;
  title?: string | null;
  body?: string | null;
}

export interface PostDiscussionResult {
  discussion?: Discussion | null;
}


export interface PostGoalProgressUpdateInput {
  content?: string | null;
  goalId?: string | null;
  newTargetValues?: string | null;
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
}

export interface PostProjectCheckInResult {
  checkIn?: ProjectCheckIn | null;
}


export interface RemoveCompanyAdminInput {
  personId?: string | null;
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

export interface RemoveGroupMemberResult {

}


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


export interface ReopenGoalInput {
  id?: string | null;
  message?: string | null;
}

export interface ReopenGoalResult {
  goal?: Goal | null;
}


export interface ResumeProjectInput {
  projectId?: string | null;
}

export interface ResumeProjectResult {
  project?: Project | null;
}


export interface SetMilestoneDeadlineInput {

}

export interface SetMilestoneDeadlineResult {

}


export interface UpdateGroupAppearanceInput {
  id?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateGroupAppearanceResult {
  space?: Space | null;
}


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


export interface UpdateMyProfileInput {
  fullName?: string | null;
  title?: string | null;
  timezone?: string | null;
  managerId?: string | null;
  avatarUrl?: string | null;
  avatarBlobId?: string | null;
  theme?: string | null;
}

export interface UpdateMyProfileResult {
  me?: Person | null;
}


export interface UpdateProjectContributorInput {
  contribId?: string | null;
  personId?: string | null;
  responsibility?: string | null;
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

interface ApiClientConfig {
  basePath: string;
}

export class ApiClient {
  private basePath: string;

  configure(config: ApiClientConfig) {
    this.basePath = config.basePath;
  }

  getBasePath() {
    if (!this.basePath) {
      throw new Error("ApiClient is not configured");
    }

    return this.basePath;
  }

  async getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return axios.get(this.getBasePath() + "/get_activities", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getActivity(input: GetActivityInput): Promise<GetActivityResult> {
    return axios.get(this.getBasePath() + "/get_activity", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getComments(input: GetCommentsInput): Promise<GetCommentsResult> {
    return axios.get(this.getBasePath() + "/get_comments", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
    return axios.get(this.getBasePath() + "/get_companies", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
    return axios.get(this.getBasePath() + "/get_company", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getDiscussion(input: GetDiscussionInput): Promise<GetDiscussionResult> {
    return axios.get(this.getBasePath() + "/get_discussion", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getDiscussions(input: GetDiscussionsInput): Promise<GetDiscussionsResult> {
    return axios.get(this.getBasePath() + "/get_discussions", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoal(input: GetGoalInput): Promise<GetGoalResult> {
    return axios.get(this.getBasePath() + "/get_goal", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoalCheckIn(input: GetGoalCheckInInput): Promise<GetGoalCheckInResult> {
    return axios.get(this.getBasePath() + "/get_goal_check_in", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoalCheckIns(input: GetGoalCheckInsInput): Promise<GetGoalCheckInsResult> {
    return axios.get(this.getBasePath() + "/get_goal_check_ins", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoalProgressUpdate(input: GetGoalProgressUpdateInput): Promise<GetGoalProgressUpdateResult> {
    return axios.get(this.getBasePath() + "/get_goal_progress_update", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoalProgressUpdates(input: GetGoalProgressUpdatesInput): Promise<GetGoalProgressUpdatesResult> {
    return axios.get(this.getBasePath() + "/get_goal_progress_updates", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
    return axios.get(this.getBasePath() + "/get_goals", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getInvitation(input: GetInvitationInput): Promise<GetInvitationResult> {
    return axios.get(this.getBasePath() + "/get_invitation", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getKeyResource(input: GetKeyResourceInput): Promise<GetKeyResourceResult> {
    return axios.get(this.getBasePath() + "/get_key_resource", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getMe(input: GetMeInput): Promise<GetMeResult> {
    return axios.get(this.getBasePath() + "/get_me", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getMilestone(input: GetMilestoneInput): Promise<GetMilestoneResult> {
    return axios.get(this.getBasePath() + "/get_milestone", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
    return axios.get(this.getBasePath() + "/get_notifications", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getPeople(input: GetPeopleInput): Promise<GetPeopleResult> {
    return axios.get(this.getBasePath() + "/get_people", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getPerson(input: GetPersonInput): Promise<GetPersonResult> {
    return axios.get(this.getBasePath() + "/get_person", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getProject(input: GetProjectInput): Promise<GetProjectResult> {
    return axios.get(this.getBasePath() + "/get_project", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getProjectCheckIn(input: GetProjectCheckInInput): Promise<GetProjectCheckInResult> {
    return axios.get(this.getBasePath() + "/get_project_check_in", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getProjectCheckIns(input: GetProjectCheckInsInput): Promise<GetProjectCheckInsResult> {
    return axios.get(this.getBasePath() + "/get_project_check_ins", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getProjects(input: GetProjectsInput): Promise<GetProjectsResult> {
    return axios.get(this.getBasePath() + "/get_projects", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getSpace(input: GetSpaceInput): Promise<GetSpaceResult> {
    return axios.get(this.getBasePath() + "/get_space", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getSpaces(input: GetSpacesInput): Promise<GetSpacesResult> {
    return axios.get(this.getBasePath() + "/get_spaces", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getTask(input: GetTaskInput): Promise<GetTaskResult> {
    return axios.get(this.getBasePath() + "/get_task", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getTasks(input: GetTasksInput): Promise<GetTasksResult> {
    return axios.get(this.getBasePath() + "/get_tasks", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async getUnreadNotificationCount(input: GetUnreadNotificationCountInput): Promise<GetUnreadNotificationCountResult> {
    return axios.get(this.getBasePath() + "/get_unread_notification_count", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async searchPeople(input: SearchPeopleInput): Promise<SearchPeopleResult> {
    return axios.get(this.getBasePath() + "/search_people", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async searchPotentialSpaceMembers(input: SearchPotentialSpaceMembersInput): Promise<SearchPotentialSpaceMembersResult> {
    return axios.get(this.getBasePath() + "/search_potential_space_members", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async searchProjectContributorCandidates(input: SearchProjectContributorCandidatesInput): Promise<SearchProjectContributorCandidatesResult> {
    return axios.get(this.getBasePath() + "/search_project_contributor_candidates", { params: toSnake(input)}).then(({ data }) => toCamel(data));
  }

  async acknowledgeGoalProgressUpdate(input: AcknowledgeGoalProgressUpdateInput): Promise<AcknowledgeGoalProgressUpdateResult> {
    return axios.post(this.getBasePath() + "/acknowledge_goal_progress_update", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async acknowledgeProjectCheckIn(input: AcknowledgeProjectCheckInInput): Promise<AcknowledgeProjectCheckInResult> {
    return axios.post(this.getBasePath() + "/acknowledge_project_check_in", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addCompanyAdmins(input: AddCompanyAdminsInput): Promise<AddCompanyAdminsResult> {
    return axios.post(this.getBasePath() + "/add_company_admins", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addCompanyMember(input: AddCompanyMemberInput): Promise<AddCompanyMemberResult> {
    return axios.post(this.getBasePath() + "/add_company_member", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addCompanyTrustedEmailDomain(input: AddCompanyTrustedEmailDomainInput): Promise<AddCompanyTrustedEmailDomainResult> {
    return axios.post(this.getBasePath() + "/add_company_trusted_email_domain", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addFirstCompany(input: AddFirstCompanyInput): Promise<AddFirstCompanyResult> {
    return axios.post(this.getBasePath() + "/add_first_company", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addGroupMembers(input: AddGroupMembersInput): Promise<AddGroupMembersResult> {
    return axios.post(this.getBasePath() + "/add_group_members", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addKeyResource(input: AddKeyResourceInput): Promise<AddKeyResourceResult> {
    return axios.post(this.getBasePath() + "/add_key_resource", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addProjectContributor(input: AddProjectContributorInput): Promise<AddProjectContributorResult> {
    return axios.post(this.getBasePath() + "/add_project_contributor", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async addReaction(input: AddReactionInput): Promise<AddReactionResult> {
    return axios.post(this.getBasePath() + "/add_reaction", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async archiveGoal(input: ArchiveGoalInput): Promise<ArchiveGoalResult> {
    return axios.post(this.getBasePath() + "/archive_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async archiveProject(input: ArchiveProjectInput): Promise<ArchiveProjectResult> {
    return axios.post(this.getBasePath() + "/archive_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
    return axios.post(this.getBasePath() + "/change_goal_parent", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async changePasswordFirstTime(input: ChangePasswordFirstTimeInput): Promise<ChangePasswordFirstTimeResult> {
    return axios.post(this.getBasePath() + "/change_password_first_time", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async changeTaskDescription(input: ChangeTaskDescriptionInput): Promise<ChangeTaskDescriptionResult> {
    return axios.post(this.getBasePath() + "/change_task_description", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
    return axios.post(this.getBasePath() + "/close_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
    return axios.post(this.getBasePath() + "/close_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async connectGoalToProject(input: ConnectGoalToProjectInput): Promise<ConnectGoalToProjectResult> {
    return axios.post(this.getBasePath() + "/connect_goal_to_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
    return axios.post(this.getBasePath() + "/create_blob", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
    return axios.post(this.getBasePath() + "/create_comment", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGoal(input: CreateGoalInput): Promise<CreateGoalResult> {
    return axios.post(this.getBasePath() + "/create_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
    return axios.post(this.getBasePath() + "/create_goal_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGoalUpdate(input: CreateGoalUpdateInput): Promise<CreateGoalUpdateResult> {
    return axios.post(this.getBasePath() + "/create_goal_update", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createGroup(input: CreateGroupInput): Promise<CreateGroupResult> {
    return axios.post(this.getBasePath() + "/create_group", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
    return axios.post(this.getBasePath() + "/create_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
    return axios.post(this.getBasePath() + "/create_task", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async disconnectGoalFromProject(input: DisconnectGoalFromProjectInput): Promise<DisconnectGoalFromProjectResult> {
    return axios.post(this.getBasePath() + "/disconnect_goal_from_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editComment(input: EditCommentInput): Promise<EditCommentResult> {
    return axios.post(this.getBasePath() + "/edit_comment", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
    return axios.post(this.getBasePath() + "/edit_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGoal(input: EditGoalInput): Promise<EditGoalResult> {
    return axios.post(this.getBasePath() + "/edit_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
    return axios.post(this.getBasePath() + "/edit_goal_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGoalProgressUpdate(input: EditGoalProgressUpdateInput): Promise<EditGoalProgressUpdateResult> {
    return axios.post(this.getBasePath() + "/edit_goal_progress_update", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGoalTimeframe(input: EditGoalTimeframeInput): Promise<EditGoalTimeframeResult> {
    return axios.post(this.getBasePath() + "/edit_goal_timeframe", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editGroup(input: EditGroupInput): Promise<EditGroupResult> {
    return axios.post(this.getBasePath() + "/edit_group", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editKeyResource(input: EditKeyResourceInput): Promise<EditKeyResourceResult> {
    return axios.post(this.getBasePath() + "/edit_key_resource", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editProjectCheckIn(input: EditProjectCheckInInput): Promise<EditProjectCheckInResult> {
    return axios.post(this.getBasePath() + "/edit_project_check_in", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editProjectName(input: EditProjectNameInput): Promise<EditProjectNameResult> {
    return axios.post(this.getBasePath() + "/edit_project_name", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editProjectPermissions(input: EditProjectPermissionsInput): Promise<EditProjectPermissionsResult> {
    return axios.post(this.getBasePath() + "/edit_project_permissions", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editProjectTimeline(input: EditProjectTimelineInput): Promise<EditProjectTimelineResult> {
    return axios.post(this.getBasePath() + "/edit_project_timeline", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async editSpacePermissions(input: EditSpacePermissionsInput): Promise<EditSpacePermissionsResult> {
    return axios.post(this.getBasePath() + "/edit_space_permissions", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async joinSpace(input: JoinSpaceInput): Promise<JoinSpaceResult> {
    return axios.post(this.getBasePath() + "/join_space", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async markAllNotificationsAsRead(input: MarkAllNotificationsAsReadInput): Promise<MarkAllNotificationsAsReadResult> {
    return axios.post(this.getBasePath() + "/mark_all_notifications_as_read", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadResult> {
    return axios.post(this.getBasePath() + "/mark_notification_as_read", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async moveProjectToSpace(input: MoveProjectToSpaceInput): Promise<MoveProjectToSpaceResult> {
    return axios.post(this.getBasePath() + "/move_project_to_space", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async newInvitationToken(input: NewInvitationTokenInput): Promise<NewInvitationTokenResult> {
    return axios.post(this.getBasePath() + "/new_invitation_token", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async pauseProject(input: PauseProjectInput): Promise<PauseProjectResult> {
    return axios.post(this.getBasePath() + "/pause_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async postDiscussion(input: PostDiscussionInput): Promise<PostDiscussionResult> {
    return axios.post(this.getBasePath() + "/post_discussion", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async postGoalProgressUpdate(input: PostGoalProgressUpdateInput): Promise<PostGoalProgressUpdateResult> {
    return axios.post(this.getBasePath() + "/post_goal_progress_update", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async postMilestoneComment(input: PostMilestoneCommentInput): Promise<PostMilestoneCommentResult> {
    return axios.post(this.getBasePath() + "/post_milestone_comment", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async postProjectCheckIn(input: PostProjectCheckInInput): Promise<PostProjectCheckInResult> {
    return axios.post(this.getBasePath() + "/post_project_check_in", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeCompanyAdmin(input: RemoveCompanyAdminInput): Promise<RemoveCompanyAdminResult> {
    return axios.post(this.getBasePath() + "/remove_company_admin", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeCompanyMember(input: RemoveCompanyMemberInput): Promise<RemoveCompanyMemberResult> {
    return axios.post(this.getBasePath() + "/remove_company_member", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeCompanyTrustedEmailDomain(input: RemoveCompanyTrustedEmailDomainInput): Promise<RemoveCompanyTrustedEmailDomainResult> {
    return axios.post(this.getBasePath() + "/remove_company_trusted_email_domain", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeGroupMember(input: RemoveGroupMemberInput): Promise<RemoveGroupMemberResult> {
    return axios.post(this.getBasePath() + "/remove_group_member", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeKeyResource(input: RemoveKeyResourceInput): Promise<RemoveKeyResourceResult> {
    return axios.post(this.getBasePath() + "/remove_key_resource", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeProjectContributor(input: RemoveProjectContributorInput): Promise<RemoveProjectContributorResult> {
    return axios.post(this.getBasePath() + "/remove_project_contributor", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async removeProjectMilestone(input: RemoveProjectMilestoneInput): Promise<RemoveProjectMilestoneResult> {
    return axios.post(this.getBasePath() + "/remove_project_milestone", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async reopenGoal(input: ReopenGoalInput): Promise<ReopenGoalResult> {
    return axios.post(this.getBasePath() + "/reopen_goal", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async resumeProject(input: ResumeProjectInput): Promise<ResumeProjectResult> {
    return axios.post(this.getBasePath() + "/resume_project", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async setMilestoneDeadline(input: SetMilestoneDeadlineInput): Promise<SetMilestoneDeadlineResult> {
    return axios.post(this.getBasePath() + "/set_milestone_deadline", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateGroupAppearance(input: UpdateGroupAppearanceInput): Promise<UpdateGroupAppearanceResult> {
    return axios.post(this.getBasePath() + "/update_group_appearance", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMilestone(input: UpdateMilestoneInput): Promise<UpdateMilestoneResult> {
    return axios.post(this.getBasePath() + "/update_milestone", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMilestoneDescription(input: UpdateMilestoneDescriptionInput): Promise<UpdateMilestoneDescriptionResult> {
    return axios.post(this.getBasePath() + "/update_milestone_description", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateMyProfile(input: UpdateMyProfileInput): Promise<UpdateMyProfileResult> {
    return axios.post(this.getBasePath() + "/update_my_profile", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateProjectContributor(input: UpdateProjectContributorInput): Promise<UpdateProjectContributorResult> {
    return axios.post(this.getBasePath() + "/update_project_contributor", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateProjectDescription(input: UpdateProjectDescriptionInput): Promise<UpdateProjectDescriptionResult> {
    return axios.post(this.getBasePath() + "/update_project_description", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
    return axios.post(this.getBasePath() + "/update_task", toSnake(input)).then(({ data }) => toCamel(data));
  }

  async updateTaskStatus(input: UpdateTaskStatusInput): Promise<UpdateTaskStatusResult> {
    return axios.post(this.getBasePath() + "/update_task_status", toSnake(input)).then(({ data }) => toCamel(data));
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
export async function getCompanies(input: GetCompaniesInput) : Promise<GetCompaniesResult> {
  return defaultApiClient.getCompanies(input);
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
export async function getGoalProgressUpdate(input: GetGoalProgressUpdateInput) : Promise<GetGoalProgressUpdateResult> {
  return defaultApiClient.getGoalProgressUpdate(input);
}
export async function getGoalProgressUpdates(input: GetGoalProgressUpdatesInput) : Promise<GetGoalProgressUpdatesResult> {
  return defaultApiClient.getGoalProgressUpdates(input);
}
export async function getGoals(input: GetGoalsInput) : Promise<GetGoalsResult> {
  return defaultApiClient.getGoals(input);
}
export async function getInvitation(input: GetInvitationInput) : Promise<GetInvitationResult> {
  return defaultApiClient.getInvitation(input);
}
export async function getKeyResource(input: GetKeyResourceInput) : Promise<GetKeyResourceResult> {
  return defaultApiClient.getKeyResource(input);
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
export async function getProjectCheckIns(input: GetProjectCheckInsInput) : Promise<GetProjectCheckInsResult> {
  return defaultApiClient.getProjectCheckIns(input);
}
export async function getProjects(input: GetProjectsInput) : Promise<GetProjectsResult> {
  return defaultApiClient.getProjects(input);
}
export async function getSpace(input: GetSpaceInput) : Promise<GetSpaceResult> {
  return defaultApiClient.getSpace(input);
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
export async function searchPotentialSpaceMembers(input: SearchPotentialSpaceMembersInput) : Promise<SearchPotentialSpaceMembersResult> {
  return defaultApiClient.searchPotentialSpaceMembers(input);
}
export async function searchProjectContributorCandidates(input: SearchProjectContributorCandidatesInput) : Promise<SearchProjectContributorCandidatesResult> {
  return defaultApiClient.searchProjectContributorCandidates(input);
}
export async function acknowledgeGoalProgressUpdate(input: AcknowledgeGoalProgressUpdateInput) : Promise<AcknowledgeGoalProgressUpdateResult> {
  return defaultApiClient.acknowledgeGoalProgressUpdate(input);
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
export async function editGoal(input: EditGoalInput) : Promise<EditGoalResult> {
  return defaultApiClient.editGoal(input);
}
export async function editGoalDiscussion(input: EditGoalDiscussionInput) : Promise<EditGoalDiscussionResult> {
  return defaultApiClient.editGoalDiscussion(input);
}
export async function editGoalProgressUpdate(input: EditGoalProgressUpdateInput) : Promise<EditGoalProgressUpdateResult> {
  return defaultApiClient.editGoalProgressUpdate(input);
}
export async function editGoalTimeframe(input: EditGoalTimeframeInput) : Promise<EditGoalTimeframeResult> {
  return defaultApiClient.editGoalTimeframe(input);
}
export async function editGroup(input: EditGroupInput) : Promise<EditGroupResult> {
  return defaultApiClient.editGroup(input);
}
export async function editKeyResource(input: EditKeyResourceInput) : Promise<EditKeyResourceResult> {
  return defaultApiClient.editKeyResource(input);
}
export async function editProjectCheckIn(input: EditProjectCheckInInput) : Promise<EditProjectCheckInResult> {
  return defaultApiClient.editProjectCheckIn(input);
}
export async function editProjectName(input: EditProjectNameInput) : Promise<EditProjectNameResult> {
  return defaultApiClient.editProjectName(input);
}
export async function editProjectPermissions(input: EditProjectPermissionsInput) : Promise<EditProjectPermissionsResult> {
  return defaultApiClient.editProjectPermissions(input);
}
export async function editProjectTimeline(input: EditProjectTimelineInput) : Promise<EditProjectTimelineResult> {
  return defaultApiClient.editProjectTimeline(input);
}
export async function editSpacePermissions(input: EditSpacePermissionsInput) : Promise<EditSpacePermissionsResult> {
  return defaultApiClient.editSpacePermissions(input);
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
export async function postGoalProgressUpdate(input: PostGoalProgressUpdateInput) : Promise<PostGoalProgressUpdateResult> {
  return defaultApiClient.postGoalProgressUpdate(input);
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

export function useGetCompanies(input: GetCompaniesInput) : UseQueryHookResult<GetCompaniesResult> {
  return useQuery<GetCompaniesResult>(() => defaultApiClient.getCompanies(input));
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

export function useGetGoalProgressUpdate(input: GetGoalProgressUpdateInput) : UseQueryHookResult<GetGoalProgressUpdateResult> {
  return useQuery<GetGoalProgressUpdateResult>(() => defaultApiClient.getGoalProgressUpdate(input));
}

export function useGetGoalProgressUpdates(input: GetGoalProgressUpdatesInput) : UseQueryHookResult<GetGoalProgressUpdatesResult> {
  return useQuery<GetGoalProgressUpdatesResult>(() => defaultApiClient.getGoalProgressUpdates(input));
}

export function useGetGoals(input: GetGoalsInput) : UseQueryHookResult<GetGoalsResult> {
  return useQuery<GetGoalsResult>(() => defaultApiClient.getGoals(input));
}

export function useGetInvitation(input: GetInvitationInput) : UseQueryHookResult<GetInvitationResult> {
  return useQuery<GetInvitationResult>(() => defaultApiClient.getInvitation(input));
}

export function useGetKeyResource(input: GetKeyResourceInput) : UseQueryHookResult<GetKeyResourceResult> {
  return useQuery<GetKeyResourceResult>(() => defaultApiClient.getKeyResource(input));
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

export function useGetProjectCheckIns(input: GetProjectCheckInsInput) : UseQueryHookResult<GetProjectCheckInsResult> {
  return useQuery<GetProjectCheckInsResult>(() => defaultApiClient.getProjectCheckIns(input));
}

export function useGetProjects(input: GetProjectsInput) : UseQueryHookResult<GetProjectsResult> {
  return useQuery<GetProjectsResult>(() => defaultApiClient.getProjects(input));
}

export function useGetSpace(input: GetSpaceInput) : UseQueryHookResult<GetSpaceResult> {
  return useQuery<GetSpaceResult>(() => defaultApiClient.getSpace(input));
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

export function useSearchPotentialSpaceMembers(input: SearchPotentialSpaceMembersInput) : UseQueryHookResult<SearchPotentialSpaceMembersResult> {
  return useQuery<SearchPotentialSpaceMembersResult>(() => defaultApiClient.searchPotentialSpaceMembers(input));
}

export function useSearchProjectContributorCandidates(input: SearchProjectContributorCandidatesInput) : UseQueryHookResult<SearchProjectContributorCandidatesResult> {
  return useQuery<SearchProjectContributorCandidatesResult>(() => defaultApiClient.searchProjectContributorCandidates(input));
}

export function useAcknowledgeGoalProgressUpdate() : UseMutationHookResult<AcknowledgeGoalProgressUpdateInput, AcknowledgeGoalProgressUpdateResult> {
  return useMutation<AcknowledgeGoalProgressUpdateInput, AcknowledgeGoalProgressUpdateResult>((input) => defaultApiClient.acknowledgeGoalProgressUpdate(input));
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

export function useEditGoal() : UseMutationHookResult<EditGoalInput, EditGoalResult> {
  return useMutation<EditGoalInput, EditGoalResult>((input) => defaultApiClient.editGoal(input));
}

export function useEditGoalDiscussion() : UseMutationHookResult<EditGoalDiscussionInput, EditGoalDiscussionResult> {
  return useMutation<EditGoalDiscussionInput, EditGoalDiscussionResult>((input) => defaultApiClient.editGoalDiscussion(input));
}

export function useEditGoalProgressUpdate() : UseMutationHookResult<EditGoalProgressUpdateInput, EditGoalProgressUpdateResult> {
  return useMutation<EditGoalProgressUpdateInput, EditGoalProgressUpdateResult>((input) => defaultApiClient.editGoalProgressUpdate(input));
}

export function useEditGoalTimeframe() : UseMutationHookResult<EditGoalTimeframeInput, EditGoalTimeframeResult> {
  return useMutation<EditGoalTimeframeInput, EditGoalTimeframeResult>((input) => defaultApiClient.editGoalTimeframe(input));
}

export function useEditGroup() : UseMutationHookResult<EditGroupInput, EditGroupResult> {
  return useMutation<EditGroupInput, EditGroupResult>((input) => defaultApiClient.editGroup(input));
}

export function useEditKeyResource() : UseMutationHookResult<EditKeyResourceInput, EditKeyResourceResult> {
  return useMutation<EditKeyResourceInput, EditKeyResourceResult>((input) => defaultApiClient.editKeyResource(input));
}

export function useEditProjectCheckIn() : UseMutationHookResult<EditProjectCheckInInput, EditProjectCheckInResult> {
  return useMutation<EditProjectCheckInInput, EditProjectCheckInResult>((input) => defaultApiClient.editProjectCheckIn(input));
}

export function useEditProjectName() : UseMutationHookResult<EditProjectNameInput, EditProjectNameResult> {
  return useMutation<EditProjectNameInput, EditProjectNameResult>((input) => defaultApiClient.editProjectName(input));
}

export function useEditProjectPermissions() : UseMutationHookResult<EditProjectPermissionsInput, EditProjectPermissionsResult> {
  return useMutation<EditProjectPermissionsInput, EditProjectPermissionsResult>((input) => defaultApiClient.editProjectPermissions(input));
}

export function useEditProjectTimeline() : UseMutationHookResult<EditProjectTimelineInput, EditProjectTimelineResult> {
  return useMutation<EditProjectTimelineInput, EditProjectTimelineResult>((input) => defaultApiClient.editProjectTimeline(input));
}

export function useEditSpacePermissions() : UseMutationHookResult<EditSpacePermissionsInput, EditSpacePermissionsResult> {
  return useMutation<EditSpacePermissionsInput, EditSpacePermissionsResult>((input) => defaultApiClient.editSpacePermissions(input));
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

export function usePostGoalProgressUpdate() : UseMutationHookResult<PostGoalProgressUpdateInput, PostGoalProgressUpdateResult> {
  return useMutation<PostGoalProgressUpdateInput, PostGoalProgressUpdateResult>((input) => defaultApiClient.postGoalProgressUpdate(input));
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
  getGoalCheckIn,
  useGetGoalCheckIn,
  getGoalCheckIns,
  useGetGoalCheckIns,
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
  getProjects,
  useGetProjects,
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
  editGoal,
  useEditGoal,
  editGoalDiscussion,
  useEditGoalDiscussion,
  editGoalProgressUpdate,
  useEditGoalProgressUpdate,
  editGoalTimeframe,
  useEditGoalTimeframe,
  editGroup,
  useEditGroup,
  editKeyResource,
  useEditKeyResource,
  editProjectCheckIn,
  useEditProjectCheckIn,
  editProjectName,
  useEditProjectName,
  editProjectPermissions,
  useEditProjectPermissions,
  editProjectTimeline,
  useEditProjectTimeline,
  editSpacePermissions,
  useEditSpacePermissions,
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
  postGoalProgressUpdate,
  usePostGoalProgressUpdate,
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

