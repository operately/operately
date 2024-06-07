export interface Timeframe {
  startDate: Date;
  endDate: Date;
  type: string;
}

export interface UpdateContentProjectMilestoneDeadlineChanged {
  oldDeadline: string;
  newDeadline: string;
  milestone: Milestone;
}

export interface ActivityContentProjectMoved {
  project: Project;
  oldSpace: Group;
  newSpace: Group;
}

export interface ProjectContributor {
  id: string;
  responsibility: string;
  role: string;
  person: Person;
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

export interface UpdateContentGoalCheckIn {
  message: string;
  targets: UpdateContentGoalCheckInTarget[];
}

export interface ActivityContentDiscussionCommentSubmitted {
  spaceId: string;
  discussionId: string;
  title: string;
  space: Group;
}

export interface UpdateContentProjectDiscussion {
  title: string;
  body: string;
}

export interface ActivityContentTaskPriorityChange {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldPriority: string;
  newPriority: string;
}

export interface ActivityContentGoalReopening {
  companyId: string;
  goalId: string;
  message: string;
  goal: Goal;
}

export interface GoalPermissions {
  canEdit: boolean;
  canCheckIn: boolean;
  canAcknowledgeCheckIn: boolean;
  canClose: boolean;
  canArchive: boolean;
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

export interface ProjectKeyResource {
  id: string;
  title: string;
  link: string;
  resourceType: string;
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

export interface Target {
  id: string;
  index: number;
  name: string;
  from: number;
  to: number;
  unit: string;
  value: number;
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

export interface ActivityContentProjectCheckInCommented {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
  comment: Comment;
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

export interface UpdateContentProjectMilestoneDeleted {
  milestone: Milestone;
}

export interface ActivityContentProjectPausing {
  companyId: string;
  projectId: string;
  project: Project;
}

export interface ActivityContentGoalClosing {
  companyId: string;
  spaceId: string;
  goalId: string;
  success: string;
  goal: Goal;
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

export interface ActivityContentProjectCheckInSubmitted {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
}

export interface ActivityContentTaskAdding {
  name: string;
  taskId: string;
  companyId: string;
  spaceId: string;
}

export interface ActivityContentDiscussionPosting {
  companyId: string;
  spaceId: string;
  title: string;
  discussionId: string;
  space: Group;
  discussion: Discussion;
}

export interface ActivityContentProjectClosed {
  project: Project;
}

export interface UpdateContentProjectStartTimeChanged {
  oldStartTime: string;
  newStartTime: string;
}

export interface Invitation {
  id: string;
  adminName: string;
  admin: Person;
  member: Person;
  token: string;
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

export interface GroupContact {
  id: string;
  name: string;
  type: string;
  value: string;
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

export interface UpdateContentReview {
  survey: string;
  previousPhase: string;
  newPhase: string;
  reviewReason: string;
  reviewRequestId: string;
}

export interface ActivityContentGoalDiscussionCreation {
  companyId: string;
  goalId: string;
  goal: Goal;
}

export interface ActivityContentTaskNameEditing {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldName: string;
  newName: string;
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

export interface ActivityContentTaskReopening {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface UpdateContentProjectEndTimeChanged {
  oldEndTime: string;
  newEndTime: string;
}

export interface KpiMetric {
  date: Date;
  value: number;
}

export interface GoalEditingUpdatedTarget {
  id: string;
  oldName: string;
  newName: string;
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

export interface Tenet {
  id: string;
  name: string;
  description: string;
  kpis: Kpi[];
  company: Company;
  objectives: Objective[];
}

export interface Assignments {
  assignments: Assignment[];
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

export interface ActivityEventDataCommentPost {
  updateId: string;
}

export interface Blob {
  author: Person;
  status: string;
  filename: string;
  url: string;
  signedUploadUrl: string;
}

export interface ActivityContentGoalArchived {
  goal: Goal;
}

export interface ActivityContentProjectContributorAddition {
  companyId: string;
  projectId: string;
  personId: string;
  person: Person;
  project: Project;
}

export interface ActivityContentProjectArchived {
  projectId: string;
  project: Project;
}

export interface ActivityContentProjectGoalConnection {
  project: Project;
  goal: Goal;
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

export interface ActivityContentTaskDescriptionChange {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface ActivityContentDiscussionEditing {
  companyId: string;
  spaceId: string;
  discussionId: string;
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

export interface ActivityContentGoalDiscussionEditing {
  companyId: string;
  spaceId: string;
  goalId: string;
  activityId: string;
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

export interface ActivityContentProjectDiscussionSubmitted {
  projectId: string;
  discussionId: string;
  title: string;
  project: Project;
}

export interface ActivityContentProjectCreated {
  projectId: string;
  project: Project;
}

export interface Assignment {
  type: string;
  due: Date;
  resource: AssignmentResource;
}

export interface ActivityContentGoalCheckIn {
  goal: Goal;
  update: Update;
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

export interface ActivityContentProjectGoalDisconnection {
  project: Project;
  goal: Goal;
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

export interface ActivityContentProjectReviewCommented {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface ActivityContentCommentAdded {
  comment: Comment;
  activity: Activity;
}

export interface ActivityContentGoalCheckInEdit {
  companyId: string;
  goalId: string;
  checkInId: string;
}

export interface ActivityContentProjectReviewAcknowledged {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface ActivityContentProjectCheckInEdit {
  companyId: string;
  projectId: string;
  checkInId: string;
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

export interface Comment {
  id: string;
  insertedAt: Date;
  content: string;
  author: Person;
  reactions: Reaction[];
}

export interface ActivityContentGoalReparent {
  companyId: string;
  oldParentGoalId: string;
  newParentGoalId: string;
}

export interface ActivityContentProjectResuming {
  companyId: string;
  projectId: string;
  project: Project;
}

export interface ActivityContentProjectCheckInAcknowledged {
  projectId: string;
  checkInId: string;
  project: Project;
  checkIn: ProjectCheckIn;
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

export interface ActivityContentTaskSizeChange {
  companyId: string;
  spaceId: string;
  taskId: string;
  oldSize: string;
  newSize: string;
}

export interface ActivityEventDataMilestoneCreate {
  title: string;
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

export interface ActivityContentProjectReviewSubmitted {
  projectId: string;
  reviewId: string;
  project: Project;
}

export interface ActivityContentProjectReviewRequestSubmitted {
  projectId: string;
  requestId: string;
  project: Project;
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

export interface ActivityContentTaskUpdate {
  companyId: string;
  taskId: string;
  name: string;
}

export interface ActivityContentTaskAssigneeAssignment {
  companyId: string;
  spaceId: string;
  taskId: string;
  personId: string;
}

export interface MilestoneComment {
  id: string;
  action: string;
  comment: Comment;
}

export interface UpdateContentProjectMilestoneCompleted {
  milestone: Milestone;
}

export interface UpdateContentProjectContributorAdded {
  contributorId: string;
  contributorRole: string;
  contributor: Person;
}

export interface UpdateContentProjectCreated {
  creatorRole: string;
  creator: Person;
  champion: Person;
}

export interface ActivityEventDataProjectCreate {
  champion: Person;
}

export interface Dashboard {
  id: string;
  panels: Panel[];
}

export interface ActivityContentProjectMilestoneCommented {
  projectId: string;
  project: Project;
  milestone: Milestone;
  commentAction: string;
  comment: Comment;
}

export interface Notification {
  id: string;
  read: boolean;
  readAt: Date;
  activity: Activity;
}

export interface UpdateContentProjectMilestoneCreated {
  milestone: Milestone;
}

export interface ActivityContentTaskStatusChange {
  companyId: string;
  taskId: string;
  status: string;
}

export interface ActivityContentGoalCheckInAcknowledgement {
  goal: Goal;
  update: Update;
}

export interface ActivityContentGoalCreated {
  goal: Goal;
}

export interface ActivityContentProjectRenamed {
  project: Project;
  oldName: string;
  newName: string;
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

export interface UpdateContentMessage {
  message: string;
}

export interface ActivityContentTaskClosing {
  companyId: string;
  spaceId: string;
  taskId: string;
}

export interface ActivityContentSpaceJoining {
  companyId: string;
  spaceId: string;
  space: Group;
}

export type ActivityContent = ActivityContentCommentAdded | ActivityContentDiscussionCommentSubmitted | ActivityContentDiscussionEditing | ActivityContentDiscussionPosting | ActivityContentGoalArchived | ActivityContentGoalCheckIn | ActivityContentGoalCheckInAcknowledgement | ActivityContentGoalCheckInEdit | ActivityContentGoalClosing | ActivityContentGoalCreated | ActivityContentGoalDiscussionCreation | ActivityContentGoalDiscussionEditing | ActivityContentGoalEditing | ActivityContentGoalReopening | ActivityContentGoalReparent | ActivityContentGoalTimeframeEditing | ActivityContentGroupEdited | ActivityContentProjectArchived | ActivityContentProjectCheckInAcknowledged | ActivityContentProjectCheckInCommented | ActivityContentProjectCheckInEdit | ActivityContentProjectCheckInSubmitted | ActivityContentProjectClosed | ActivityContentProjectContributorAddition | ActivityContentProjectCreated | ActivityContentProjectDiscussionSubmitted | ActivityContentProjectGoalConnection | ActivityContentProjectGoalDisconnection | ActivityContentProjectMilestoneCommented | ActivityContentProjectMoved | ActivityContentProjectPausing | ActivityContentProjectRenamed | ActivityContentProjectResuming | ActivityContentProjectReviewAcknowledged | ActivityContentProjectReviewCommented | ActivityContentProjectReviewRequestSubmitted | ActivityContentProjectReviewSubmitted | ActivityContentProjectTimelineEdited | ActivityContentSpaceJoining | ActivityContentTaskAdding | ActivityContentTaskAssigneeAssignment | ActivityContentTaskClosing | ActivityContentTaskDescriptionChange | ActivityContentTaskNameEditing | ActivityContentTaskPriorityChange | ActivityContentTaskReopening | ActivityContentTaskSizeChange | ActivityContentTaskStatusChange | ActivityContentTaskUpdate;

export type ActivityDataUnion = ActivityEventDataProjectCreate | ActivityEventDataMilestoneCreate | ActivityEventDataCommentPost;

export type ActivityResourceUnion = Project | Update | Milestone | Comment;

export type AssignmentResource = Project | Milestone;

export type PanelLinkedResource = Project;

export type UpdateContent = UpdateContentProjectCreated | UpdateContentProjectStartTimeChanged | UpdateContentProjectEndTimeChanged | UpdateContentProjectContributorAdded | UpdateContentProjectContributorRemoved | UpdateContentProjectMilestoneCreated | UpdateContentProjectMilestoneCompleted | UpdateContentProjectMilestoneDeadlineChanged | UpdateContentProjectMilestoneDeleted | UpdateContentStatusUpdate | UpdateContentGoalCheckIn | UpdateContentReview | UpdateContentProjectDiscussion | UpdateContentMessage;
