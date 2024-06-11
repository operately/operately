import React from "react";
import axios from "axios";

export interface GoalPermissions {
  canEdit: boolean;
  canCheckIn: boolean;
  canAcknowledgeCheckIn: boolean;
  canClose: boolean;
  canArchive: boolean;
}

export interface ActivityContentGoalCheckIn {
  goal: Goal;
  update: Update;
}

export interface ProjectContributor {
  id: string;
  responsibility: string;
  role: string;
  person: Person;
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

export interface ProjectReviewRequest {
  id: string;
  insertedAt: Date;
  updatedAt: Date;
  status: string;
  reviewId: string;
  content: string;
  author: Person;
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

export interface ActivityEventDataProjectCreate {
  champion: Person;
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

export interface ActivityContentProjectReviewCommented {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface ActivityContentProjectContributorAddition {
  companyId: string;
  projectId: string;
  personId: string;
  person: Person;
  project: Project;
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

export interface ActivityContentTaskSizeChange {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldSize: string;
  newSize: string;
}

export interface ActivityContentDiscussionCommentSubmitted {
  spaceId: string;
  discussionId: string;
  title: string;
  space: Group;
}

export interface ActivityContentGoalTimeframeEditing {
  goal: Goal;
  oldTimeframe: Timeframe;
  newTimeframe: Timeframe;
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

export interface ActivityContentGoalReparent {
  companyId: string;
  oldParentGoalId: string;
  newParentGoalId: string;
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

export interface ActivityContentTaskAdding {
  name: string;
  taskId: string;
  companyId: string;
  spaceId: string;
}

export interface ActivityContentProjectCheckInEdit {
  companyId: string;
  projectId: string;
  checkInId: string;
}

export interface ActivityContentProjectMoved {
  project: Project;
  oldSpace: Group;
  newSpace: Group;
}

export interface UpdateContentReview {
  survey: string;
  previousPhase: string;
  newPhase: string;
  reviewReason: string;
  reviewRequestId: string;
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

export interface UpdateContentProjectMilestoneDeleted {
  milestone: Milestone;
}

export interface Dashboard {
  id: string;
  panels: Panel[];
}

export interface ActivityContentGoalCheckInEdit {
  companyId: string;
  goalId: string;
  checkInId: string;
}

export interface ActivityContentTaskNameEditing {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldName: string;
  newName: string;
}

export interface Panel {
  id: string;
  type: string;
  index: number;
  linkedResource: PanelLinkedResource;
}

export interface UpdateContentProjectContributorRemoved {
  contributor: Person;
  contributorId: string;
  contributorRole: string;
}

export interface ActivityContentProjectClosed {
  project: Project;
}

export interface ActivityContentGoalDiscussionEditing {
  companyId: string;
  spaceId: string;
  goalId: string;
  activityId: string;
}

export interface ActivityContentProjectCheckInCommented {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
  comment: Comment;
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

export interface ActivityContentProjectReviewSubmitted {
  projectId: string;
  reviewId: string;
  project: Project;
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

export interface UpdateContentProjectMilestoneDeadlineChanged {
  oldDeadline: string;
  newDeadline: string;
  milestone: Milestone;
}

export interface ActivityContentGoalDiscussionCreation {
  companyId: string;
  goalId: string;
  goal: Goal;
}

export interface Invitation {
  id: string;
  adminName: string;
  admin: Person;
  member: Person;
  token: string;
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

export interface ActivityContentProjectCheckInAcknowledged {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
}

export interface ProjectKeyResource {
  id: string;
  title: string;
  link: string;
  resourceType: string;
}

export interface Timeframe {
  startDate: Date;
  endDate: Date;
  type: string;
}

export interface ActivityContentTaskReopening {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface ActivityContentDiscussionEditing {
  companyId: string;
  spaceId: string;
  discussionId: string;
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

export interface ActivityContentProjectCheckInSubmitted {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
}

export interface UpdateContentProjectMilestoneCreated {
  milestone: Milestone;
}

export interface GoalEditingUpdatedTarget {
  id: string;
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

export interface Blob {
  author: Person;
  status: string;
  filename: string;
  url: string;
  signedUploadUrl: string;
  storageType: string;
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

export interface Notification {
  id: string;
  read: boolean;
  readAt: Date;
  activity: Activity;
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

export interface UpdateContentGoalCheckIn {
  message: string;
  targets: UpdateContentGoalCheckInTarget[];
}

export interface UpdateContentProjectMilestoneCompleted {
  milestone: Milestone;
}

export interface ActivityContentProjectGoalDisconnection {
  project: Project;
  goal: Goal;
}

export interface ActivityContentTaskStatusChange {
  companyId: string;
  taskId: string;
  status: string;
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

export interface ActivityContentProjectCreated {
  projectId: string;
  project: Project;
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

export interface GroupContact {
  id: string;
  name: string;
  type: string;
  value: string;
}

export interface ActivityContentGoalReopening {
  companyId: string;
  goalId: string;
  message: string;
  goal: Goal;
}

export interface ActivityContentProjectReviewRequestSubmitted {
  projectId: string;
  requestId: string;
  project: Project;
}

export interface ActivityContentTaskAssigneeAssignment {
  companyId: string;
  spaceId: string;
  taskId: string;
  personId: string;
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

export interface ActivityContentProjectRenamed {
  project: Project;
  oldName: string;
  newName: string;
}

export interface ActivityContentCommentAdded {
  comment: Comment;
  activity: Activity;
}

export interface ActivityContentProjectDiscussionSubmitted {
  projectId: string;
  discussionId: string;
  title: string;
  project: Project;
}

export interface Comment {
  id: string;
  insertedAt: Date;
  content: string;
  author: Person;
  reactions: Reaction[];
}

export interface UpdateContentMessage {
  message: string;
}

export interface ActivityContentProjectReviewAcknowledged {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface Assignments {
  assignments: Assignment[];
}

export interface Assignment {
  type: string;
  due: Date;
  resource: AssignmentResource;
}

export interface ActivityContentProjectArchived {
  projectId: string;
  project: Project;
}

export interface MilestoneComment {
  id: string;
  action: string;
  comment: Comment;
}

export interface ActivityContentProjectPausing {
  companyId: string;
  projectId: string;
  project: Project;
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

export interface UpdateContentProjectStartTimeChanged {
  oldStartTime: string;
  newStartTime: string;
}

export interface ActivityContentGoalClosing {
  companyId: string;
  spaceId: string;
  goalId: string;
  success: string;
  goal: Goal;
}

export interface ActivityContentTaskDescriptionChange {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface KpiMetric {
  date: Date;
  value: number;
}

export interface ActivityContentGoalCheckInAcknowledgement {
  goal: Goal;
  update: Update;
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

export interface ActivityContentDiscussionPosting {
  companyId: string;
  spaceId: string;
  title: string;
  discussionId: string;
  space: Group;
  discussion: Discussion;
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

export interface ActivityContentProjectMilestoneCommented {
  projectId: string;
  project: Project;
  milestone: Milestone;
  commentAction: string;
  comment: Comment;
}

export interface ActivityContentGoalArchived {
  goal: Goal;
}

export interface ActivityContentProjectGoalConnection {
  project: Project;
  goal: Goal;
}

export interface ActivityContentGroupEdited {
  exampleField: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  reactionType: string;
  person: Person;
}

export interface ActivityEventDataCommentPost {
  updateId: string;
}

export interface ActivityContentSpaceJoining {
  companyId: string;
  spaceId: string;
  space: Group;
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

export interface ActivityContentProjectResuming {
  companyId: string;
  projectId: string;
  project: Project;
}

export interface ActivityContentTaskClosing {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface ActivityContentGoalCreated {
  goal: Goal;
}

export interface ActivityContentTaskUpdate {
  companyId: string;
  taskId: string;
  name: string;
}

export interface UpdateContentProjectContributorAdded {
  contributorId: string;
  contributorRole: string;
  contributor: Person;
}

export interface ActivityEventDataMilestoneCreate {
  title: string;
}

export type ActivityContent =
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
  | UpdateContentGoalCheckIn
  | UpdateContentReview
  | UpdateContentProjectDiscussion
  | UpdateContentMessage;

type UseQueryHookResult<ResultT> = { data: ResultT | null; loading: boolean; error: Error | null };

export function useQuery<ResultT>(fn: () => Promise<ResultT>): UseQueryHookResult<ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    fn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [fn]);

  return { data, loading, error };
}

export interface GetActivitiesInput {}

export interface GetActivitiesResult {}

export async function getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
  return axios.get("/api/get_activities", { params: input }).then(({ data }) => data);
}

export function useGetActivities(input: GetActivitiesInput): UseQueryHookResult<GetActivitiesResult> {
  return useQuery<GetActivitiesResult>(() => getActivities(input));
}

export interface GetActivityInput {}

export interface GetActivityResult {}

export async function getActivity(input: GetActivityInput): Promise<GetActivityResult> {
  return axios.get("/api/get_activity", { params: input }).then(({ data }) => data);
}

export function useGetActivity(input: GetActivityInput): UseQueryHookResult<GetActivityResult> {
  return useQuery<GetActivityResult>(() => getActivity(input));
}

export interface GetCommentsInput {}

export interface GetCommentsResult {}

export async function getComments(input: GetCommentsInput): Promise<GetCommentsResult> {
  return axios.get("/api/get_comments", { params: input }).then(({ data }) => data);
}

export function useGetComments(input: GetCommentsInput): UseQueryHookResult<GetCommentsResult> {
  return useQuery<GetCommentsResult>(() => getComments(input));
}

export interface GetCompanyInput {}

export interface GetCompanyResult {}

export async function getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
  return axios.get("/api/get_company", { params: input }).then(({ data }) => data);
}

export function useGetCompany(input: GetCompanyInput): UseQueryHookResult<GetCompanyResult> {
  return useQuery<GetCompanyResult>(() => getCompany(input));
}

export interface GetDiscussionInput {}

export interface GetDiscussionResult {}

export async function getDiscussion(input: GetDiscussionInput): Promise<GetDiscussionResult> {
  return axios.get("/api/get_discussion", { params: input }).then(({ data }) => data);
}

export function useGetDiscussion(input: GetDiscussionInput): UseQueryHookResult<GetDiscussionResult> {
  return useQuery<GetDiscussionResult>(() => getDiscussion(input));
}

export interface GetDiscussionsInput {}

export interface GetDiscussionsResult {}

export async function getDiscussions(input: GetDiscussionsInput): Promise<GetDiscussionsResult> {
  return axios.get("/api/get_discussions", { params: input }).then(({ data }) => data);
}

export function useGetDiscussions(input: GetDiscussionsInput): UseQueryHookResult<GetDiscussionsResult> {
  return useQuery<GetDiscussionsResult>(() => getDiscussions(input));
}

export interface GetGoalInput {}

export interface GetGoalResult {}

export async function getGoal(input: GetGoalInput): Promise<GetGoalResult> {
  return axios.get("/api/get_goal", { params: input }).then(({ data }) => data);
}

export function useGetGoal(input: GetGoalInput): UseQueryHookResult<GetGoalResult> {
  return useQuery<GetGoalResult>(() => getGoal(input));
}

export interface GetGoalCheckInInput {}

export interface GetGoalCheckInResult {}

export async function getGoalCheckIn(input: GetGoalCheckInInput): Promise<GetGoalCheckInResult> {
  return axios.get("/api/get_goal_check_in", { params: input }).then(({ data }) => data);
}

export function useGetGoalCheckIn(input: GetGoalCheckInInput): UseQueryHookResult<GetGoalCheckInResult> {
  return useQuery<GetGoalCheckInResult>(() => getGoalCheckIn(input));
}

export interface GetGoalCheckInsInput {}

export interface GetGoalCheckInsResult {}

export async function getGoalCheckIns(input: GetGoalCheckInsInput): Promise<GetGoalCheckInsResult> {
  return axios.get("/api/get_goal_check_ins", { params: input }).then(({ data }) => data);
}

export function useGetGoalCheckIns(input: GetGoalCheckInsInput): UseQueryHookResult<GetGoalCheckInsResult> {
  return useQuery<GetGoalCheckInsResult>(() => getGoalCheckIns(input));
}

export interface GetGoalsInput {}

export interface GetGoalsResult {}

export async function getGoals(input: GetGoalsInput): Promise<GetGoalsResult> {
  return axios.get("/api/get_goals", { params: input }).then(({ data }) => data);
}

export function useGetGoals(input: GetGoalsInput): UseQueryHookResult<GetGoalsResult> {
  return useQuery<GetGoalsResult>(() => getGoals(input));
}

export interface GetGroupInput {}

export interface GetGroupResult {}

export async function getGroup(input: GetGroupInput): Promise<GetGroupResult> {
  return axios.get("/api/get_group", { params: input }).then(({ data }) => data);
}

export function useGetGroup(input: GetGroupInput): UseQueryHookResult<GetGroupResult> {
  return useQuery<GetGroupResult>(() => getGroup(input));
}

export interface GetGroupsInput {}

export interface GetGroupsResult {}

export async function getGroups(input: GetGroupsInput): Promise<GetGroupsResult> {
  return axios.get("/api/get_groups", { params: input }).then(({ data }) => data);
}

export function useGetGroups(input: GetGroupsInput): UseQueryHookResult<GetGroupsResult> {
  return useQuery<GetGroupsResult>(() => getGroups(input));
}

export interface GetInvitationInput {}

export interface GetInvitationResult {}

export async function getInvitation(input: GetInvitationInput): Promise<GetInvitationResult> {
  return axios.get("/api/get_invitation", { params: input }).then(({ data }) => data);
}

export function useGetInvitation(input: GetInvitationInput): UseQueryHookResult<GetInvitationResult> {
  return useQuery<GetInvitationResult>(() => getInvitation(input));
}

export interface GetKeyResourcesInput {}

export interface GetKeyResourcesResult {}

export async function getKeyResources(input: GetKeyResourcesInput): Promise<GetKeyResourcesResult> {
  return axios.get("/api/get_key_resources", { params: input }).then(({ data }) => data);
}

export function useGetKeyResources(input: GetKeyResourcesInput): UseQueryHookResult<GetKeyResourcesResult> {
  return useQuery<GetKeyResourcesResult>(() => getKeyResources(input));
}

export interface GetMeInput {}

export interface GetMeResult {}

export async function getMe(input: GetMeInput): Promise<GetMeResult> {
  return axios.get("/api/get_me", { params: input }).then(({ data }) => data);
}

export function useGetMe(input: GetMeInput): UseQueryHookResult<GetMeResult> {
  return useQuery<GetMeResult>(() => getMe(input));
}

export interface GetMilestoneInput {}

export interface GetMilestoneResult {}

export async function getMilestone(input: GetMilestoneInput): Promise<GetMilestoneResult> {
  return axios.get("/api/get_milestone", { params: input }).then(({ data }) => data);
}

export function useGetMilestone(input: GetMilestoneInput): UseQueryHookResult<GetMilestoneResult> {
  return useQuery<GetMilestoneResult>(() => getMilestone(input));
}

export interface GetNotificationsInput {}

export interface GetNotificationsResult {}

export async function getNotifications(input: GetNotificationsInput): Promise<GetNotificationsResult> {
  return axios.get("/api/get_notifications", { params: input }).then(({ data }) => data);
}

export function useGetNotifications(input: GetNotificationsInput): UseQueryHookResult<GetNotificationsResult> {
  return useQuery<GetNotificationsResult>(() => getNotifications(input));
}

export interface GetPeopleInput {}

export interface GetPeopleResult {}

export async function getPeople(input: GetPeopleInput): Promise<GetPeopleResult> {
  return axios.get("/api/get_people", { params: input }).then(({ data }) => data);
}

export function useGetPeople(input: GetPeopleInput): UseQueryHookResult<GetPeopleResult> {
  return useQuery<GetPeopleResult>(() => getPeople(input));
}

export interface GetPersonInput {}

export interface GetPersonResult {}

export async function getPerson(input: GetPersonInput): Promise<GetPersonResult> {
  return axios.get("/api/get_person", { params: input }).then(({ data }) => data);
}

export function useGetPerson(input: GetPersonInput): UseQueryHookResult<GetPersonResult> {
  return useQuery<GetPersonResult>(() => getPerson(input));
}

export interface GetProjectInput {}

export interface GetProjectResult {}

export async function getProject(input: GetProjectInput): Promise<GetProjectResult> {
  return axios.get("/api/get_project", { params: input }).then(({ data }) => data);
}

export function useGetProject(input: GetProjectInput): UseQueryHookResult<GetProjectResult> {
  return useQuery<GetProjectResult>(() => getProject(input));
}

export interface GetProjectCheckInInput {}

export interface GetProjectCheckInResult {}

export async function getProjectCheckIn(input: GetProjectCheckInInput): Promise<GetProjectCheckInResult> {
  return axios.get("/api/get_project_check_in", { params: input }).then(({ data }) => data);
}

export function useGetProjectCheckIn(input: GetProjectCheckInInput): UseQueryHookResult<GetProjectCheckInResult> {
  return useQuery<GetProjectCheckInResult>(() => getProjectCheckIn(input));
}

export interface GetProjectsInput {}

export interface GetProjectsResult {}

export async function getProjects(input: GetProjectsInput): Promise<GetProjectsResult> {
  return axios.get("/api/get_projects", { params: input }).then(({ data }) => data);
}

export function useGetProjects(input: GetProjectsInput): UseQueryHookResult<GetProjectsResult> {
  return useQuery<GetProjectsResult>(() => getProjects(input));
}

export interface GetSpacesInput {}

export interface GetSpacesResult {}

export async function getSpaces(input: GetSpacesInput): Promise<GetSpacesResult> {
  return axios.get("/api/get_spaces", { params: input }).then(({ data }) => data);
}

export function useGetSpaces(input: GetSpacesInput): UseQueryHookResult<GetSpacesResult> {
  return useQuery<GetSpacesResult>(() => getSpaces(input));
}

export interface GetTaskInput {}

export interface GetTaskResult {}

export async function getTask(input: GetTaskInput): Promise<GetTaskResult> {
  return axios.get("/api/get_task", { params: input }).then(({ data }) => data);
}

export function useGetTask(input: GetTaskInput): UseQueryHookResult<GetTaskResult> {
  return useQuery<GetTaskResult>(() => getTask(input));
}

export interface GetTasksInput {}

export interface GetTasksResult {}

export async function getTasks(input: GetTasksInput): Promise<GetTasksResult> {
  return axios.get("/api/get_tasks", { params: input }).then(({ data }) => data);
}

export function useGetTasks(input: GetTasksInput): UseQueryHookResult<GetTasksResult> {
  return useQuery<GetTasksResult>(() => getTasks(input));
}

export interface GetUnreadNotificationCountInput {}

export interface GetUnreadNotificationCountResult {}

export async function getUnreadNotificationCount(
  input: GetUnreadNotificationCountInput,
): Promise<GetUnreadNotificationCountResult> {
  return axios.get("/api/get_unread_notification_count", { params: input }).then(({ data }) => data);
}

export function useGetUnreadNotificationCount(
  input: GetUnreadNotificationCountInput,
): UseQueryHookResult<GetUnreadNotificationCountResult> {
  return useQuery<GetUnreadNotificationCountResult>(() => getUnreadNotificationCount(input));
}

export interface SearchPeopleInput {
  query: string;
  ignoredIds: string[];
}

export interface SearchPeopleResult {
  people: Person[];
}

export async function searchPeople(input: SearchPeopleInput): Promise<SearchPeopleResult> {
  return axios.get("/api/search_people", { params: input }).then(({ data }) => data);
}

export function useSearchPeople(input: SearchPeopleInput): UseQueryHookResult<SearchPeopleResult> {
  return useQuery<SearchPeopleResult>(() => searchPeople(input));
}

export interface SearchProjectContributorCandidatesInput {}

export interface SearchProjectContributorCandidatesResult {}

export async function searchProjectContributorCandidates(
  input: SearchProjectContributorCandidatesInput,
): Promise<SearchProjectContributorCandidatesResult> {
  return axios.get("/api/search_project_contributor_candidates", { params: input }).then(({ data }) => data);
}

export function useSearchProjectContributorCandidates(
  input: SearchProjectContributorCandidatesInput,
): UseQueryHookResult<SearchProjectContributorCandidatesResult> {
  return useQuery<SearchProjectContributorCandidatesResult>(() => searchProjectContributorCandidates(input));
}

type UseMutationHookResult<InputT, ResultT> = [
  () => Promise<ResultT>,
  { data: ResultT | null; loading: boolean; error: Error | null },
];

export function useMutation<InputT, ResultT>(
  fn: (input: InputT) => Promise<ResultT>,
): UseMutationHookResult<InputT, ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = (input: InputT) => {
    setLoading(true);
    setError(null);

    fn(input)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  return [execute, { data, loading, error }];
}

export interface PauseProjectInput {}

export interface PauseProjectResult {}

export function pauseProject(input: PauseProjectInput): Promise<PauseProjectResult> {
  return axios.post("/api/pause_project", input).then(({ data }) => data);
}

export function usePauseProject(): UseMutationHookResult<PauseProjectInput, PauseProjectResult> {
  return useMutation<PauseProjectInput, PauseProjectResult>(pauseProject);
}

export interface UpdateGroupAppearanceInput {}

export interface UpdateGroupAppearanceResult {}

export function updateGroupAppearance(input: UpdateGroupAppearanceInput): Promise<UpdateGroupAppearanceResult> {
  return axios.post("/api/update_group_appearance", input).then(({ data }) => data);
}

export function useUpdateGroupAppearance(): UseMutationHookResult<
  UpdateGroupAppearanceInput,
  UpdateGroupAppearanceResult
> {
  return useMutation<UpdateGroupAppearanceInput, UpdateGroupAppearanceResult>(updateGroupAppearance);
}

export interface ArchiveProjectInput {}

export interface ArchiveProjectResult {}

export function archiveProject(input: ArchiveProjectInput): Promise<ArchiveProjectResult> {
  return axios.post("/api/archive_project", input).then(({ data }) => data);
}

export function useArchiveProject(): UseMutationHookResult<ArchiveProjectInput, ArchiveProjectResult> {
  return useMutation<ArchiveProjectInput, ArchiveProjectResult>(archiveProject);
}

export interface MoveProjectToSpaceInput {}

export interface MoveProjectToSpaceResult {}

export function moveProjectToSpace(input: MoveProjectToSpaceInput): Promise<MoveProjectToSpaceResult> {
  return axios.post("/api/move_project_to_space", input).then(({ data }) => data);
}

export function useMoveProjectToSpace(): UseMutationHookResult<MoveProjectToSpaceInput, MoveProjectToSpaceResult> {
  return useMutation<MoveProjectToSpaceInput, MoveProjectToSpaceResult>(moveProjectToSpace);
}

export interface EditGoalTimeframeInput {}

export interface EditGoalTimeframeResult {}

export function editGoalTimeframe(input: EditGoalTimeframeInput): Promise<EditGoalTimeframeResult> {
  return axios.post("/api/edit_goal_timeframe", input).then(({ data }) => data);
}

export function useEditGoalTimeframe(): UseMutationHookResult<EditGoalTimeframeInput, EditGoalTimeframeResult> {
  return useMutation<EditGoalTimeframeInput, EditGoalTimeframeResult>(editGoalTimeframe);
}

export interface CreateProjectInput {}

export interface CreateProjectResult {}

export function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  return axios.post("/api/create_project", input).then(({ data }) => data);
}

export function useCreateProject(): UseMutationHookResult<CreateProjectInput, CreateProjectResult> {
  return useMutation<CreateProjectInput, CreateProjectResult>(createProject);
}

export interface EditCommentInput {}

export interface EditCommentResult {}

export function editComment(input: EditCommentInput): Promise<EditCommentResult> {
  return axios.post("/api/edit_comment", input).then(({ data }) => data);
}

export function useEditComment(): UseMutationHookResult<EditCommentInput, EditCommentResult> {
  return useMutation<EditCommentInput, EditCommentResult>(editComment);
}

export interface UpdateProjectDescriptionInput {}

export interface UpdateProjectDescriptionResult {}

export function updateProjectDescription(
  input: UpdateProjectDescriptionInput,
): Promise<UpdateProjectDescriptionResult> {
  return axios.post("/api/update_project_description", input).then(({ data }) => data);
}

export function useUpdateProjectDescription(): UseMutationHookResult<
  UpdateProjectDescriptionInput,
  UpdateProjectDescriptionResult
> {
  return useMutation<UpdateProjectDescriptionInput, UpdateProjectDescriptionResult>(updateProjectDescription);
}

export interface JoinSpaceInput {}

export interface JoinSpaceResult {}

export function joinSpace(input: JoinSpaceInput): Promise<JoinSpaceResult> {
  return axios.post("/api/join_space", input).then(({ data }) => data);
}

export function useJoinSpace(): UseMutationHookResult<JoinSpaceInput, JoinSpaceResult> {
  return useMutation<JoinSpaceInput, JoinSpaceResult>(joinSpace);
}

export interface AddReactionInput {}

export interface AddReactionResult {}

export function addReaction(input: AddReactionInput): Promise<AddReactionResult> {
  return axios.post("/api/add_reaction", input).then(({ data }) => data);
}

export function useAddReaction(): UseMutationHookResult<AddReactionInput, AddReactionResult> {
  return useMutation<AddReactionInput, AddReactionResult>(addReaction);
}

export interface MarkAllNotificationsAsReadInput {}

export interface MarkAllNotificationsAsReadResult {}

export function markAllNotificationsAsRead(
  input: MarkAllNotificationsAsReadInput,
): Promise<MarkAllNotificationsAsReadResult> {
  return axios.post("/api/mark_all_notifications_as_read", input).then(({ data }) => data);
}

export function useMarkAllNotificationsAsRead(): UseMutationHookResult<
  MarkAllNotificationsAsReadInput,
  MarkAllNotificationsAsReadResult
> {
  return useMutation<MarkAllNotificationsAsReadInput, MarkAllNotificationsAsReadResult>(markAllNotificationsAsRead);
}

export interface UpdateProjectContributorInput {}

export interface UpdateProjectContributorResult {}

export function updateProjectContributor(
  input: UpdateProjectContributorInput,
): Promise<UpdateProjectContributorResult> {
  return axios.post("/api/update_project_contributor", input).then(({ data }) => data);
}

export function useUpdateProjectContributor(): UseMutationHookResult<
  UpdateProjectContributorInput,
  UpdateProjectContributorResult
> {
  return useMutation<UpdateProjectContributorInput, UpdateProjectContributorResult>(updateProjectContributor);
}

export interface UpdateMilestoneDescriptionInput {}

export interface UpdateMilestoneDescriptionResult {}

export function updateMilestoneDescription(
  input: UpdateMilestoneDescriptionInput,
): Promise<UpdateMilestoneDescriptionResult> {
  return axios.post("/api/update_milestone_description", input).then(({ data }) => data);
}

export function useUpdateMilestoneDescription(): UseMutationHookResult<
  UpdateMilestoneDescriptionInput,
  UpdateMilestoneDescriptionResult
> {
  return useMutation<UpdateMilestoneDescriptionInput, UpdateMilestoneDescriptionResult>(updateMilestoneDescription);
}

export interface AddCompanyMemberInput {}

export interface AddCompanyMemberResult {}

export function addCompanyMember(input: AddCompanyMemberInput): Promise<AddCompanyMemberResult> {
  return axios.post("/api/add_company_member", input).then(({ data }) => data);
}

export function useAddCompanyMember(): UseMutationHookResult<AddCompanyMemberInput, AddCompanyMemberResult> {
  return useMutation<AddCompanyMemberInput, AddCompanyMemberResult>(addCompanyMember);
}

export interface ResumeProjectInput {}

export interface ResumeProjectResult {}

export function resumeProject(input: ResumeProjectInput): Promise<ResumeProjectResult> {
  return axios.post("/api/resume_project", input).then(({ data }) => data);
}

export function useResumeProject(): UseMutationHookResult<ResumeProjectInput, ResumeProjectResult> {
  return useMutation<ResumeProjectInput, ResumeProjectResult>(resumeProject);
}

export interface UpdateTaskStatusInput {}

export interface UpdateTaskStatusResult {}

export function updateTaskStatus(input: UpdateTaskStatusInput): Promise<UpdateTaskStatusResult> {
  return axios.post("/api/update_task_status", input).then(({ data }) => data);
}

export function useUpdateTaskStatus(): UseMutationHookResult<UpdateTaskStatusInput, UpdateTaskStatusResult> {
  return useMutation<UpdateTaskStatusInput, UpdateTaskStatusResult>(updateTaskStatus);
}

export interface RemoveCompanyMemberInput {}

export interface RemoveCompanyMemberResult {}

export function removeCompanyMember(input: RemoveCompanyMemberInput): Promise<RemoveCompanyMemberResult> {
  return axios.post("/api/remove_company_member", input).then(({ data }) => data);
}

export function useRemoveCompanyMember(): UseMutationHookResult<RemoveCompanyMemberInput, RemoveCompanyMemberResult> {
  return useMutation<RemoveCompanyMemberInput, RemoveCompanyMemberResult>(removeCompanyMember);
}

export interface RemoveCompanyTrustedEmailDomainInput {}

export interface RemoveCompanyTrustedEmailDomainResult {}

export function removeCompanyTrustedEmailDomain(
  input: RemoveCompanyTrustedEmailDomainInput,
): Promise<RemoveCompanyTrustedEmailDomainResult> {
  return axios.post("/api/remove_company_trusted_email_domain", input).then(({ data }) => data);
}

export function useRemoveCompanyTrustedEmailDomain(): UseMutationHookResult<
  RemoveCompanyTrustedEmailDomainInput,
  RemoveCompanyTrustedEmailDomainResult
> {
  return useMutation<RemoveCompanyTrustedEmailDomainInput, RemoveCompanyTrustedEmailDomainResult>(
    removeCompanyTrustedEmailDomain,
  );
}

export interface CreateCommentInput {}

export interface CreateCommentResult {}

export function createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
  return axios.post("/api/create_comment", input).then(({ data }) => data);
}

export function useCreateComment(): UseMutationHookResult<CreateCommentInput, CreateCommentResult> {
  return useMutation<CreateCommentInput, CreateCommentResult>(createComment);
}

export interface RemoveGroupMemberInput {}

export interface RemoveGroupMemberResult {}

export function removeGroupMember(input: RemoveGroupMemberInput): Promise<RemoveGroupMemberResult> {
  return axios.post("/api/remove_group_member", input).then(({ data }) => data);
}

export function useRemoveGroupMember(): UseMutationHookResult<RemoveGroupMemberInput, RemoveGroupMemberResult> {
  return useMutation<RemoveGroupMemberInput, RemoveGroupMemberResult>(removeGroupMember);
}

export interface PostDiscussionInput {}

export interface PostDiscussionResult {}

export function postDiscussion(input: PostDiscussionInput): Promise<PostDiscussionResult> {
  return axios.post("/api/post_discussion", input).then(({ data }) => data);
}

export function usePostDiscussion(): UseMutationHookResult<PostDiscussionInput, PostDiscussionResult> {
  return useMutation<PostDiscussionInput, PostDiscussionResult>(postDiscussion);
}

export interface MarkNotificationAsReadInput {}

export interface MarkNotificationAsReadResult {}

export function markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadResult> {
  return axios.post("/api/mark_notification_as_read", input).then(({ data }) => data);
}

export function useMarkNotificationAsRead(): UseMutationHookResult<
  MarkNotificationAsReadInput,
  MarkNotificationAsReadResult
> {
  return useMutation<MarkNotificationAsReadInput, MarkNotificationAsReadResult>(markNotificationAsRead);
}

export interface CreateBlobInput {}

export interface CreateBlobResult {}

export function createBlob(input: CreateBlobInput): Promise<CreateBlobResult> {
  return axios.post("/api/create_blob", input).then(({ data }) => data);
}

export function useCreateBlob(): UseMutationHookResult<CreateBlobInput, CreateBlobResult> {
  return useMutation<CreateBlobInput, CreateBlobResult>(createBlob);
}

export interface PostMilestoneCommentInput {}

export interface PostMilestoneCommentResult {}

export function postMilestoneComment(input: PostMilestoneCommentInput): Promise<PostMilestoneCommentResult> {
  return axios.post("/api/post_milestone_comment", input).then(({ data }) => data);
}

export function usePostMilestoneComment(): UseMutationHookResult<
  PostMilestoneCommentInput,
  PostMilestoneCommentResult
> {
  return useMutation<PostMilestoneCommentInput, PostMilestoneCommentResult>(postMilestoneComment);
}

export interface CreateTaskInput {}

export interface CreateTaskResult {}

export function createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  return axios.post("/api/create_task", input).then(({ data }) => data);
}

export function useCreateTask(): UseMutationHookResult<CreateTaskInput, CreateTaskResult> {
  return useMutation<CreateTaskInput, CreateTaskResult>(createTask);
}

export interface EditProjectNameInput {}

export interface EditProjectNameResult {}

export function editProjectName(input: EditProjectNameInput): Promise<EditProjectNameResult> {
  return axios.post("/api/edit_project_name", input).then(({ data }) => data);
}

export function useEditProjectName(): UseMutationHookResult<EditProjectNameInput, EditProjectNameResult> {
  return useMutation<EditProjectNameInput, EditProjectNameResult>(editProjectName);
}

export interface PostProjectCheckInInput {}

export interface PostProjectCheckInResult {}

export function postProjectCheckIn(input: PostProjectCheckInInput): Promise<PostProjectCheckInResult> {
  return axios.post("/api/post_project_check_in", input).then(({ data }) => data);
}

export function usePostProjectCheckIn(): UseMutationHookResult<PostProjectCheckInInput, PostProjectCheckInResult> {
  return useMutation<PostProjectCheckInInput, PostProjectCheckInResult>(postProjectCheckIn);
}

export interface AddGroupMembersInput {}

export interface AddGroupMembersResult {}

export function addGroupMembers(input: AddGroupMembersInput): Promise<AddGroupMembersResult> {
  return axios.post("/api/add_group_members", input).then(({ data }) => data);
}

export function useAddGroupMembers(): UseMutationHookResult<AddGroupMembersInput, AddGroupMembersResult> {
  return useMutation<AddGroupMembersInput, AddGroupMembersResult>(addGroupMembers);
}

export interface CreateGoalDiscussionInput {}

export interface CreateGoalDiscussionResult {}

export function createGoalDiscussion(input: CreateGoalDiscussionInput): Promise<CreateGoalDiscussionResult> {
  return axios.post("/api/create_goal_discussion", input).then(({ data }) => data);
}

export function useCreateGoalDiscussion(): UseMutationHookResult<
  CreateGoalDiscussionInput,
  CreateGoalDiscussionResult
> {
  return useMutation<CreateGoalDiscussionInput, CreateGoalDiscussionResult>(createGoalDiscussion);
}

export interface AcknowledgeProjectCheckInInput {}

export interface AcknowledgeProjectCheckInResult {}

export function acknowledgeProjectCheckIn(
  input: AcknowledgeProjectCheckInInput,
): Promise<AcknowledgeProjectCheckInResult> {
  return axios.post("/api/acknowledge_project_check_in", input).then(({ data }) => data);
}

export function useAcknowledgeProjectCheckIn(): UseMutationHookResult<
  AcknowledgeProjectCheckInInput,
  AcknowledgeProjectCheckInResult
> {
  return useMutation<AcknowledgeProjectCheckInInput, AcknowledgeProjectCheckInResult>(acknowledgeProjectCheckIn);
}

export interface AddFirstCompanyInput {}

export interface AddFirstCompanyResult {}

export function addFirstCompany(input: AddFirstCompanyInput): Promise<AddFirstCompanyResult> {
  return axios.post("/api/add_first_company", input).then(({ data }) => data);
}

export function useAddFirstCompany(): UseMutationHookResult<AddFirstCompanyInput, AddFirstCompanyResult> {
  return useMutation<AddFirstCompanyInput, AddFirstCompanyResult>(addFirstCompany);
}

export interface AddCompanyAdminsInput {}

export interface AddCompanyAdminsResult {}

export function addCompanyAdmins(input: AddCompanyAdminsInput): Promise<AddCompanyAdminsResult> {
  return axios.post("/api/add_company_admins", input).then(({ data }) => data);
}

export function useAddCompanyAdmins(): UseMutationHookResult<AddCompanyAdminsInput, AddCompanyAdminsResult> {
  return useMutation<AddCompanyAdminsInput, AddCompanyAdminsResult>(addCompanyAdmins);
}

export interface SetMilestoneDeadlineInput {}

export interface SetMilestoneDeadlineResult {}

export function setMilestoneDeadline(input: SetMilestoneDeadlineInput): Promise<SetMilestoneDeadlineResult> {
  return axios.post("/api/set_milestone_deadline", input).then(({ data }) => data);
}

export function useSetMilestoneDeadline(): UseMutationHookResult<
  SetMilestoneDeadlineInput,
  SetMilestoneDeadlineResult
> {
  return useMutation<SetMilestoneDeadlineInput, SetMilestoneDeadlineResult>(setMilestoneDeadline);
}

export interface ChangePasswordFirstTimeInput {}

export interface ChangePasswordFirstTimeResult {}

export function changePasswordFirstTime(input: ChangePasswordFirstTimeInput): Promise<ChangePasswordFirstTimeResult> {
  return axios.post("/api/change_password_first_time", input).then(({ data }) => data);
}

export function useChangePasswordFirstTime(): UseMutationHookResult<
  ChangePasswordFirstTimeInput,
  ChangePasswordFirstTimeResult
> {
  return useMutation<ChangePasswordFirstTimeInput, ChangePasswordFirstTimeResult>(changePasswordFirstTime);
}

export interface AddKeyResourceInput {}

export interface AddKeyResourceResult {}

export function addKeyResource(input: AddKeyResourceInput): Promise<AddKeyResourceResult> {
  return axios.post("/api/add_key_resource", input).then(({ data }) => data);
}

export function useAddKeyResource(): UseMutationHookResult<AddKeyResourceInput, AddKeyResourceResult> {
  return useMutation<AddKeyResourceInput, AddKeyResourceResult>(addKeyResource);
}

export interface AddCompanyTrustedEmailDomainInput {}

export interface AddCompanyTrustedEmailDomainResult {}

export function addCompanyTrustedEmailDomain(
  input: AddCompanyTrustedEmailDomainInput,
): Promise<AddCompanyTrustedEmailDomainResult> {
  return axios.post("/api/add_company_trusted_email_domain", input).then(({ data }) => data);
}

export function useAddCompanyTrustedEmailDomain(): UseMutationHookResult<
  AddCompanyTrustedEmailDomainInput,
  AddCompanyTrustedEmailDomainResult
> {
  return useMutation<AddCompanyTrustedEmailDomainInput, AddCompanyTrustedEmailDomainResult>(
    addCompanyTrustedEmailDomain,
  );
}

export interface ChangeGoalParentInput {}

export interface ChangeGoalParentResult {}

export function changeGoalParent(input: ChangeGoalParentInput): Promise<ChangeGoalParentResult> {
  return axios.post("/api/change_goal_parent", input).then(({ data }) => data);
}

export function useChangeGoalParent(): UseMutationHookResult<ChangeGoalParentInput, ChangeGoalParentResult> {
  return useMutation<ChangeGoalParentInput, ChangeGoalParentResult>(changeGoalParent);
}

export interface AddProjectContributorInput {}

export interface AddProjectContributorResult {}

export function addProjectContributor(input: AddProjectContributorInput): Promise<AddProjectContributorResult> {
  return axios.post("/api/add_project_contributor", input).then(({ data }) => data);
}

export function useAddProjectContributor(): UseMutationHookResult<
  AddProjectContributorInput,
  AddProjectContributorResult
> {
  return useMutation<AddProjectContributorInput, AddProjectContributorResult>(addProjectContributor);
}

export interface CreateGroupInput {}

export interface CreateGroupResult {}

export function createGroup(input: CreateGroupInput): Promise<CreateGroupResult> {
  return axios.post("/api/create_group", input).then(({ data }) => data);
}

export function useCreateGroup(): UseMutationHookResult<CreateGroupInput, CreateGroupResult> {
  return useMutation<CreateGroupInput, CreateGroupResult>(createGroup);
}

export interface ConnectGoalToProjectInput {}

export interface ConnectGoalToProjectResult {}

export function connectGoalToProject(input: ConnectGoalToProjectInput): Promise<ConnectGoalToProjectResult> {
  return axios.post("/api/connect_goal_to_project", input).then(({ data }) => data);
}

export function useConnectGoalToProject(): UseMutationHookResult<
  ConnectGoalToProjectInput,
  ConnectGoalToProjectResult
> {
  return useMutation<ConnectGoalToProjectInput, ConnectGoalToProjectResult>(connectGoalToProject);
}

export interface RemoveProjectMilestoneInput {}

export interface RemoveProjectMilestoneResult {}

export function removeProjectMilestone(input: RemoveProjectMilestoneInput): Promise<RemoveProjectMilestoneResult> {
  return axios.post("/api/remove_project_milestone", input).then(({ data }) => data);
}

export function useRemoveProjectMilestone(): UseMutationHookResult<
  RemoveProjectMilestoneInput,
  RemoveProjectMilestoneResult
> {
  return useMutation<RemoveProjectMilestoneInput, RemoveProjectMilestoneResult>(removeProjectMilestone);
}

export interface EditDiscussionInput {}

export interface EditDiscussionResult {}

export function editDiscussion(input: EditDiscussionInput): Promise<EditDiscussionResult> {
  return axios.post("/api/edit_discussion", input).then(({ data }) => data);
}

export function useEditDiscussion(): UseMutationHookResult<EditDiscussionInput, EditDiscussionResult> {
  return useMutation<EditDiscussionInput, EditDiscussionResult>(editDiscussion);
}

export interface EditGoalDiscussionInput {}

export interface EditGoalDiscussionResult {}

export function editGoalDiscussion(input: EditGoalDiscussionInput): Promise<EditGoalDiscussionResult> {
  return axios.post("/api/edit_goal_discussion", input).then(({ data }) => data);
}

export function useEditGoalDiscussion(): UseMutationHookResult<EditGoalDiscussionInput, EditGoalDiscussionResult> {
  return useMutation<EditGoalDiscussionInput, EditGoalDiscussionResult>(editGoalDiscussion);
}

export interface CreateGoalInput {}

export interface CreateGoalResult {}

export function createGoal(input: CreateGoalInput): Promise<CreateGoalResult> {
  return axios.post("/api/create_goal", input).then(({ data }) => data);
}

export function useCreateGoal(): UseMutationHookResult<CreateGoalInput, CreateGoalResult> {
  return useMutation<CreateGoalInput, CreateGoalResult>(createGoal);
}

export interface CreateGoalUpdateInput {}

export interface CreateGoalUpdateResult {}

export function createGoalUpdate(input: CreateGoalUpdateInput): Promise<CreateGoalUpdateResult> {
  return axios.post("/api/create_goal_update", input).then(({ data }) => data);
}

export function useCreateGoalUpdate(): UseMutationHookResult<CreateGoalUpdateInput, CreateGoalUpdateResult> {
  return useMutation<CreateGoalUpdateInput, CreateGoalUpdateResult>(createGoalUpdate);
}

export interface EditGoalUpdateInput {}

export interface EditGoalUpdateResult {}

export function editGoalUpdate(input: EditGoalUpdateInput): Promise<EditGoalUpdateResult> {
  return axios.post("/api/edit_goal_update", input).then(({ data }) => data);
}

export function useEditGoalUpdate(): UseMutationHookResult<EditGoalUpdateInput, EditGoalUpdateResult> {
  return useMutation<EditGoalUpdateInput, EditGoalUpdateResult>(editGoalUpdate);
}

export interface CloseProjectInput {}

export interface CloseProjectResult {}

export function closeProject(input: CloseProjectInput): Promise<CloseProjectResult> {
  return axios.post("/api/close_project", input).then(({ data }) => data);
}

export function useCloseProject(): UseMutationHookResult<CloseProjectInput, CloseProjectResult> {
  return useMutation<CloseProjectInput, CloseProjectResult>(closeProject);
}

export interface UpdateMyNotificationSettingsInput {}

export interface UpdateMyNotificationSettingsResult {}

export function updateMyNotificationSettings(
  input: UpdateMyNotificationSettingsInput,
): Promise<UpdateMyNotificationSettingsResult> {
  return axios.post("/api/update_my_notification_settings", input).then(({ data }) => data);
}

export function useUpdateMyNotificationSettings(): UseMutationHookResult<
  UpdateMyNotificationSettingsInput,
  UpdateMyNotificationSettingsResult
> {
  return useMutation<UpdateMyNotificationSettingsInput, UpdateMyNotificationSettingsResult>(
    updateMyNotificationSettings,
  );
}

export interface RemoveProjectContributorInput {}

export interface RemoveProjectContributorResult {}

export function removeProjectContributor(
  input: RemoveProjectContributorInput,
): Promise<RemoveProjectContributorResult> {
  return axios.post("/api/remove_project_contributor", input).then(({ data }) => data);
}

export function useRemoveProjectContributor(): UseMutationHookResult<
  RemoveProjectContributorInput,
  RemoveProjectContributorResult
> {
  return useMutation<RemoveProjectContributorInput, RemoveProjectContributorResult>(removeProjectContributor);
}

export interface CloseGoalInput {}

export interface CloseGoalResult {}

export function closeGoal(input: CloseGoalInput): Promise<CloseGoalResult> {
  return axios.post("/api/close_goal", input).then(({ data }) => data);
}

export function useCloseGoal(): UseMutationHookResult<CloseGoalInput, CloseGoalResult> {
  return useMutation<CloseGoalInput, CloseGoalResult>(closeGoal);
}

export interface ChangeTaskDescriptionInput {}

export interface ChangeTaskDescriptionResult {}

export function changeTaskDescription(input: ChangeTaskDescriptionInput): Promise<ChangeTaskDescriptionResult> {
  return axios.post("/api/change_task_description", input).then(({ data }) => data);
}

export function useChangeTaskDescription(): UseMutationHookResult<
  ChangeTaskDescriptionInput,
  ChangeTaskDescriptionResult
> {
  return useMutation<ChangeTaskDescriptionInput, ChangeTaskDescriptionResult>(changeTaskDescription);
}

export interface RemoveCompanyAdminInput {}

export interface RemoveCompanyAdminResult {}

export function removeCompanyAdmin(input: RemoveCompanyAdminInput): Promise<RemoveCompanyAdminResult> {
  return axios.post("/api/remove_company_admin", input).then(({ data }) => data);
}

export function useRemoveCompanyAdmin(): UseMutationHookResult<RemoveCompanyAdminInput, RemoveCompanyAdminResult> {
  return useMutation<RemoveCompanyAdminInput, RemoveCompanyAdminResult>(removeCompanyAdmin);
}

export interface NewInvitationTokenInput {}

export interface NewInvitationTokenResult {}

export function newInvitationToken(input: NewInvitationTokenInput): Promise<NewInvitationTokenResult> {
  return axios.post("/api/new_invitation_token", input).then(({ data }) => data);
}

export function useNewInvitationToken(): UseMutationHookResult<NewInvitationTokenInput, NewInvitationTokenResult> {
  return useMutation<NewInvitationTokenInput, NewInvitationTokenResult>(newInvitationToken);
}

export interface UpdateMyProfileInput {}

export interface UpdateMyProfileResult {}

export function updateMyProfile(input: UpdateMyProfileInput): Promise<UpdateMyProfileResult> {
  return axios.post("/api/update_my_profile", input).then(({ data }) => data);
}

export function useUpdateMyProfile(): UseMutationHookResult<UpdateMyProfileInput, UpdateMyProfileResult> {
  return useMutation<UpdateMyProfileInput, UpdateMyProfileResult>(updateMyProfile);
}

export interface DisconnectGoalFromProjectInput {}

export interface DisconnectGoalFromProjectResult {}

export function disconnectGoalFromProject(
  input: DisconnectGoalFromProjectInput,
): Promise<DisconnectGoalFromProjectResult> {
  return axios.post("/api/disconnect_goal_from_project", input).then(({ data }) => data);
}

export function useDisconnectGoalFromProject(): UseMutationHookResult<
  DisconnectGoalFromProjectInput,
  DisconnectGoalFromProjectResult
> {
  return useMutation<DisconnectGoalFromProjectInput, DisconnectGoalFromProjectResult>(disconnectGoalFromProject);
}

export interface EditProjectTimelineInput {}

export interface EditProjectTimelineResult {}

export function editProjectTimeline(input: EditProjectTimelineInput): Promise<EditProjectTimelineResult> {
  return axios.post("/api/edit_project_timeline", input).then(({ data }) => data);
}

export function useEditProjectTimeline(): UseMutationHookResult<EditProjectTimelineInput, EditProjectTimelineResult> {
  return useMutation<EditProjectTimelineInput, EditProjectTimelineResult>(editProjectTimeline);
}

export interface EditGroupInput {}

export interface EditGroupResult {}

export function editGroup(input: EditGroupInput): Promise<EditGroupResult> {
  return axios.post("/api/edit_group", input).then(({ data }) => data);
}

export function useEditGroup(): UseMutationHookResult<EditGroupInput, EditGroupResult> {
  return useMutation<EditGroupInput, EditGroupResult>(editGroup);
}

export interface RemoveKeyResourceInput {}

export interface RemoveKeyResourceResult {}

export function removeKeyResource(input: RemoveKeyResourceInput): Promise<RemoveKeyResourceResult> {
  return axios.post("/api/remove_key_resource", input).then(({ data }) => data);
}

export function useRemoveKeyResource(): UseMutationHookResult<RemoveKeyResourceInput, RemoveKeyResourceResult> {
  return useMutation<RemoveKeyResourceInput, RemoveKeyResourceResult>(removeKeyResource);
}

export interface UpdateMyAppearanceInput {}

export interface UpdateMyAppearanceResult {}

export function updateMyAppearance(input: UpdateMyAppearanceInput): Promise<UpdateMyAppearanceResult> {
  return axios.post("/api/update_my_appearance", input).then(({ data }) => data);
}

export function useUpdateMyAppearance(): UseMutationHookResult<UpdateMyAppearanceInput, UpdateMyAppearanceResult> {
  return useMutation<UpdateMyAppearanceInput, UpdateMyAppearanceResult>(updateMyAppearance);
}

export interface UpdateMilestoneInput {}

export interface UpdateMilestoneResult {}

export function updateMilestone(input: UpdateMilestoneInput): Promise<UpdateMilestoneResult> {
  return axios.post("/api/update_milestone", input).then(({ data }) => data);
}

export function useUpdateMilestone(): UseMutationHookResult<UpdateMilestoneInput, UpdateMilestoneResult> {
  return useMutation<UpdateMilestoneInput, UpdateMilestoneResult>(updateMilestone);
}

export interface AcknowledgeGoalCheckInInput {}

export interface AcknowledgeGoalCheckInResult {}

export function acknowledgeGoalCheckIn(input: AcknowledgeGoalCheckInInput): Promise<AcknowledgeGoalCheckInResult> {
  return axios.post("/api/acknowledge_goal_check_in", input).then(({ data }) => data);
}

export function useAcknowledgeGoalCheckIn(): UseMutationHookResult<
  AcknowledgeGoalCheckInInput,
  AcknowledgeGoalCheckInResult
> {
  return useMutation<AcknowledgeGoalCheckInInput, AcknowledgeGoalCheckInResult>(acknowledgeGoalCheckIn);
}

export interface UpdateTaskInput {}

export interface UpdateTaskResult {}

export function updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
  return axios.post("/api/update_task", input).then(({ data }) => data);
}

export function useUpdateTask(): UseMutationHookResult<UpdateTaskInput, UpdateTaskResult> {
  return useMutation<UpdateTaskInput, UpdateTaskResult>(updateTask);
}

export interface ReopenGoalInput {}

export interface ReopenGoalResult {}

export function reopenGoal(input: ReopenGoalInput): Promise<ReopenGoalResult> {
  return axios.post("/api/reopen_goal", input).then(({ data }) => data);
}

export function useReopenGoal(): UseMutationHookResult<ReopenGoalInput, ReopenGoalResult> {
  return useMutation<ReopenGoalInput, ReopenGoalResult>(reopenGoal);
}

export interface ArchiveGoalInput {}

export interface ArchiveGoalResult {}

export function archiveGoal(input: ArchiveGoalInput): Promise<ArchiveGoalResult> {
  return axios.post("/api/archive_goal", input).then(({ data }) => data);
}

export function useArchiveGoal(): UseMutationHookResult<ArchiveGoalInput, ArchiveGoalResult> {
  return useMutation<ArchiveGoalInput, ArchiveGoalResult>(archiveGoal);
}
