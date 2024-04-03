import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * The `Date` scalar type represents a date. The Date appears in a JSON
   * response as an ISO8601 formatted string, without a time component.
   */
  Date: { input: any; output: any; }
  /**
   * The `DateTime` scalar type represents a date and time in the UTC
   * timezone. The DateTime appears in a JSON response as an ISO8601 formatted
   * string, including UTC timezone ("Z"). The parsed date and time string will
   * be converted to UTC if there is an offset.
   */
  DateTime: { input: any; output: any; }
  /**
   * The `Naive DateTime` scalar type represents a naive date and time without
   * timezone. The DateTime appears in a JSON response as an ISO8601 formatted
   * string.
   */
  NaiveDateTime: { input: any; output: any; }
};

export type Activity = {
  __typename?: 'Activity';
  actionType: Scalars['String']['output'];
  author: Person;
  content: ActivityContent;
  eventData: ActivityDataUnion;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['NaiveDateTime']['output'];
  person: Person;
  resource?: Maybe<ActivityResourceUnion>;
  resourceId: Scalars['ID']['output'];
  resourceType: Scalars['String']['output'];
  scopeId: Scalars['ID']['output'];
  scopeType: Scalars['String']['output'];
  updatedAt: Scalars['NaiveDateTime']['output'];
};

export type ActivityContent = ActivityContentDiscussionCommentSubmitted | ActivityContentDiscussionEditing | ActivityContentDiscussionPosting | ActivityContentGoalArchived | ActivityContentGoalCheckIn | ActivityContentGoalCheckInAcknowledgement | ActivityContentGoalCheckInEdit | ActivityContentGoalClosing | ActivityContentGoalCreated | ActivityContentGoalEditing | ActivityContentGoalReparent | ActivityContentGroupEdited | ActivityContentProjectArchived | ActivityContentProjectCheckInAcknowledged | ActivityContentProjectCheckInCommented | ActivityContentProjectCheckInEdit | ActivityContentProjectCheckInSubmitted | ActivityContentProjectClosed | ActivityContentProjectContributorAddition | ActivityContentProjectCreated | ActivityContentProjectDiscussionSubmitted | ActivityContentProjectGoalConnection | ActivityContentProjectGoalDisconnection | ActivityContentProjectMilestoneCommented | ActivityContentProjectMoved | ActivityContentProjectPausing | ActivityContentProjectRenamed | ActivityContentProjectResuming | ActivityContentProjectReviewAcknowledged | ActivityContentProjectReviewCommented | ActivityContentProjectReviewRequestSubmitted | ActivityContentProjectReviewSubmitted | ActivityContentProjectTimelineEdited | ActivityContentSpaceJoining | ActivityContentTaskAdding | ActivityContentTaskAssigneeAssignment | ActivityContentTaskClosing | ActivityContentTaskDescriptionChange | ActivityContentTaskNameEditing | ActivityContentTaskPriorityChange | ActivityContentTaskReopening | ActivityContentTaskSizeChange | ActivityContentTaskStatusChange | ActivityContentTaskUpdate;

export type ActivityContentDiscussionCommentSubmitted = {
  __typename?: 'ActivityContentDiscussionCommentSubmitted';
  discussionId: Scalars['String']['output'];
  space: Group;
  spaceId: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ActivityContentDiscussionEditing = {
  __typename?: 'ActivityContentDiscussionEditing';
  companyId: Scalars['String']['output'];
  discussionId: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
};

export type ActivityContentDiscussionPosting = {
  __typename?: 'ActivityContentDiscussionPosting';
  companyId: Scalars['String']['output'];
  discussionId: Scalars['String']['output'];
  space: Group;
  spaceId: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ActivityContentGoalArchived = {
  __typename?: 'ActivityContentGoalArchived';
  goal: Goal;
};

export type ActivityContentGoalCheckIn = {
  __typename?: 'ActivityContentGoalCheckIn';
  goal: Goal;
  update: Update;
};

export type ActivityContentGoalCheckInAcknowledgement = {
  __typename?: 'ActivityContentGoalCheckInAcknowledgement';
  goal: Goal;
  update: Update;
};

export type ActivityContentGoalCheckInEdit = {
  __typename?: 'ActivityContentGoalCheckInEdit';
  checkInId: Scalars['String']['output'];
  companyId: Scalars['String']['output'];
  goalId: Scalars['String']['output'];
};

export type ActivityContentGoalClosing = {
  __typename?: 'ActivityContentGoalClosing';
  companyId: Scalars['String']['output'];
  goal: Goal;
  goalId: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
};

export type ActivityContentGoalCreated = {
  __typename?: 'ActivityContentGoalCreated';
  goal: Goal;
};

export type ActivityContentGoalEditing = {
  __typename?: 'ActivityContentGoalEditing';
  addedTargets: Array<Maybe<Target>>;
  companyId: Scalars['String']['output'];
  deletedTargets: Array<Maybe<Target>>;
  goal: Goal;
  goalId: Scalars['String']['output'];
  newChampion: Person;
  newChampionId: Scalars['String']['output'];
  newName: Scalars['String']['output'];
  newReviewer: Person;
  newReviewerId: Scalars['String']['output'];
  newTimeframe: Scalars['String']['output'];
  oldChampionId: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
  oldReviewerId: Scalars['String']['output'];
  oldTimeframe: Scalars['String']['output'];
  updatedTargets: Array<Maybe<GoalEditingUpdatedTarget>>;
};

export type ActivityContentGoalReparent = {
  __typename?: 'ActivityContentGoalReparent';
  companyId: Scalars['String']['output'];
  newParentGoalId?: Maybe<Scalars['String']['output']>;
  oldParentGoalId?: Maybe<Scalars['String']['output']>;
};

export type ActivityContentGroupEdited = {
  __typename?: 'ActivityContentGroupEdited';
  exampleField: Scalars['String']['output'];
};

export type ActivityContentProjectArchived = {
  __typename?: 'ActivityContentProjectArchived';
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectCheckInAcknowledged = {
  __typename?: 'ActivityContentProjectCheckInAcknowledged';
  checkIn: ProjectCheckIn;
  checkInId: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectCheckInCommented = {
  __typename?: 'ActivityContentProjectCheckInCommented';
  checkIn?: Maybe<ProjectCheckIn>;
  checkInId: Scalars['String']['output'];
  comment: Comment;
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectCheckInEdit = {
  __typename?: 'ActivityContentProjectCheckInEdit';
  checkInId: Scalars['String']['output'];
  companyId: Scalars['String']['output'];
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectCheckInSubmitted = {
  __typename?: 'ActivityContentProjectCheckInSubmitted';
  checkIn: ProjectCheckIn;
  checkInId: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectClosed = {
  __typename?: 'ActivityContentProjectClosed';
  project: Project;
};

export type ActivityContentProjectContributorAddition = {
  __typename?: 'ActivityContentProjectContributorAddition';
  companyId: Scalars['String']['output'];
  person: Person;
  personId: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectCreated = {
  __typename?: 'ActivityContentProjectCreated';
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectDiscussionSubmitted = {
  __typename?: 'ActivityContentProjectDiscussionSubmitted';
  discussionId: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ActivityContentProjectGoalConnection = {
  __typename?: 'ActivityContentProjectGoalConnection';
  goal: Goal;
  project: Project;
};

export type ActivityContentProjectGoalDisconnection = {
  __typename?: 'ActivityContentProjectGoalDisconnection';
  goal: Goal;
  project: Project;
};

export type ActivityContentProjectMilestoneCommented = {
  __typename?: 'ActivityContentProjectMilestoneCommented';
  comment: Comment;
  commentAction: Scalars['String']['output'];
  milestone: Milestone;
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectMoved = {
  __typename?: 'ActivityContentProjectMoved';
  newSpace: Group;
  oldSpace: Group;
  project: Project;
};

export type ActivityContentProjectPausing = {
  __typename?: 'ActivityContentProjectPausing';
  companyId: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectRenamed = {
  __typename?: 'ActivityContentProjectRenamed';
  newName: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
  project: Project;
};

export type ActivityContentProjectResuming = {
  __typename?: 'ActivityContentProjectResuming';
  companyId: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectReviewAcknowledged = {
  __typename?: 'ActivityContentProjectReviewAcknowledged';
  project: Project;
  projectId: Scalars['String']['output'];
  reviewId: Scalars['String']['output'];
};

export type ActivityContentProjectReviewCommented = {
  __typename?: 'ActivityContentProjectReviewCommented';
  project: Project;
  projectId: Scalars['String']['output'];
  reviewId: Scalars['String']['output'];
};

export type ActivityContentProjectReviewRequestSubmitted = {
  __typename?: 'ActivityContentProjectReviewRequestSubmitted';
  project: Project;
  projectId: Scalars['String']['output'];
  requestId: Scalars['String']['output'];
};

export type ActivityContentProjectReviewSubmitted = {
  __typename?: 'ActivityContentProjectReviewSubmitted';
  project: Project;
  projectId: Scalars['String']['output'];
  reviewId: Scalars['String']['output'];
};

export type ActivityContentProjectTimelineEdited = {
  __typename?: 'ActivityContentProjectTimelineEdited';
  newEndDate?: Maybe<Scalars['Date']['output']>;
  newMilestones?: Maybe<Array<Maybe<Milestone>>>;
  newStartDate?: Maybe<Scalars['Date']['output']>;
  oldEndDate?: Maybe<Scalars['Date']['output']>;
  oldStartDate?: Maybe<Scalars['Date']['output']>;
  project: Project;
  updatedMilestones?: Maybe<Array<Maybe<Milestone>>>;
};

export type ActivityContentSpaceJoining = {
  __typename?: 'ActivityContentSpaceJoining';
  companyId: Scalars['String']['output'];
  space: Group;
  spaceId: Scalars['String']['output'];
};

export type ActivityContentTaskAdding = {
  __typename?: 'ActivityContentTaskAdding';
  companyId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskAssigneeAssignment = {
  __typename?: 'ActivityContentTaskAssigneeAssignment';
  companyId: Scalars['String']['output'];
  personId: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskClosing = {
  __typename?: 'ActivityContentTaskClosing';
  companyId: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskDescriptionChange = {
  __typename?: 'ActivityContentTaskDescriptionChange';
  companyId: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskNameEditing = {
  __typename?: 'ActivityContentTaskNameEditing';
  companyId: Scalars['String']['output'];
  newName: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskPriorityChange = {
  __typename?: 'ActivityContentTaskPriorityChange';
  companyId: Scalars['String']['output'];
  newPriority: Scalars['String']['output'];
  oldPriority: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskReopening = {
  __typename?: 'ActivityContentTaskReopening';
  companyId: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskSizeChange = {
  __typename?: 'ActivityContentTaskSizeChange';
  companyId: Scalars['String']['output'];
  newSize: Scalars['String']['output'];
  oldSize: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskStatusChange = {
  __typename?: 'ActivityContentTaskStatusChange';
  companyId: Scalars['String']['output'];
  status: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityContentTaskUpdate = {
  __typename?: 'ActivityContentTaskUpdate';
  companyId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  taskId: Scalars['String']['output'];
};

export type ActivityDataUnion = ActivityEventDataCommentPost | ActivityEventDataMilestoneCreate | ActivityEventDataProjectCreate;

export type ActivityEventDataCommentPost = {
  __typename?: 'ActivityEventDataCommentPost';
  updateId: Scalars['String']['output'];
};

export type ActivityEventDataMilestoneCreate = {
  __typename?: 'ActivityEventDataMilestoneCreate';
  title: Scalars['String']['output'];
};

export type ActivityEventDataProjectCreate = {
  __typename?: 'ActivityEventDataProjectCreate';
  champion?: Maybe<Person>;
};

export type ActivityResourceUnion = Comment | Milestone | Project | Update;

export type AddCompanyMemberInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type AddKeyResourceInput = {
  link: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  resourceType: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type AddReactionInput = {
  emoji: Scalars['String']['input'];
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
};

export type Assignment = {
  __typename?: 'Assignment';
  due: Scalars['Date']['output'];
  resource: AssignmentResource;
  type: Scalars['String']['output'];
};

export type AssignmentResource = Milestone | Project;

export type Assignments = {
  __typename?: 'Assignments';
  assignments?: Maybe<Array<Maybe<Assignment>>>;
};

export type Blob = {
  __typename?: 'Blob';
  author: Person;
  filename: Scalars['String']['output'];
  signedUploadUrl: Scalars['String']['output'];
  status: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type BlobInput = {
  filename: Scalars['String']['input'];
};

export type ChangeGoalParentInput = {
  goalId: Scalars['String']['input'];
  parentGoalId?: InputMaybe<Scalars['String']['input']>;
};

export type ChangeTaskDescriptionInput = {
  description: Scalars['String']['input'];
  taskId: Scalars['String']['input'];
};

export type CloseGoalInput = {
  goalId: Scalars['String']['input'];
};

export type CloseProjectInput = {
  projectId: Scalars['ID']['input'];
  retrospective: Scalars['String']['input'];
};

export type Comment = {
  __typename?: 'Comment';
  author: Person;
  content: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insertedAt: Scalars['NaiveDateTime']['output'];
  reactions: Array<Maybe<Reaction>>;
};

export type Company = {
  __typename?: 'Company';
  admins?: Maybe<Array<Maybe<Person>>>;
  companySpaceId?: Maybe<Scalars['String']['output']>;
  enabledExperimentalFeatures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  mission: Scalars['String']['output'];
  name: Scalars['String']['output'];
  people?: Maybe<Array<Maybe<Person>>>;
  tenets?: Maybe<Array<Maybe<Tenet>>>;
  trustedEmailDomains?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type ContactInput = {
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type CreateCommentInput = {
  content: Scalars['String']['input'];
  entityId: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
};

export type CreateGoalInput = {
  championId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentGoalId?: InputMaybe<Scalars['ID']['input']>;
  reviewerId: Scalars['ID']['input'];
  spaceId: Scalars['ID']['input'];
  targets: Array<InputMaybe<CreateTargetInput>>;
  timeframe: Scalars['String']['input'];
};

export type CreateGroupInput = {
  color: Scalars['String']['input'];
  icon: Scalars['String']['input'];
  mission: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateKeyResultInput = {
  name: Scalars['String']['input'];
  objectiveId: Scalars['ID']['input'];
};

export type CreateKpiInput = {
  dangerDirection: Scalars['String']['input'];
  dangerThreshold: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  target: Scalars['Int']['input'];
  targetDirection: Scalars['String']['input'];
  unit: Scalars['String']['input'];
  warningDirection: Scalars['String']['input'];
  warningThreshold: Scalars['Int']['input'];
};

export type CreateObjectiveInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  ownerId?: InputMaybe<Scalars['ID']['input']>;
  timeframe?: InputMaybe<Scalars['String']['input']>;
};

export type CreateProjectInput = {
  championId: Scalars['ID']['input'];
  creatorIsContributor: Scalars['String']['input'];
  creatorRole?: InputMaybe<Scalars['String']['input']>;
  goalId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  reviewerId: Scalars['ID']['input'];
  spaceId: Scalars['ID']['input'];
  visibility: Scalars['String']['input'];
};

export type CreateProjectReviewRequestInput = {
  content: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type CreateTargetInput = {
  from: Scalars['Float']['input'];
  index: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  to: Scalars['Float']['input'];
  unit: Scalars['String']['input'];
};

export type CreateTaskInput = {
  assigneeIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  milestoneId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
};

export type CreateUpdateInput = {
  content: Scalars['String']['input'];
  health?: InputMaybe<Scalars['String']['input']>;
  messageType?: InputMaybe<Scalars['String']['input']>;
  newTargetValues?: InputMaybe<Scalars['String']['input']>;
  phase?: InputMaybe<Scalars['String']['input']>;
  reviewRequestId?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updatableId: Scalars['ID']['input'];
  updatableType: Scalars['String']['input'];
};

export type Dashboard = {
  __typename?: 'Dashboard';
  id: Scalars['ID']['output'];
  panels?: Maybe<Array<Maybe<Panel>>>;
};

export type Discussion = {
  __typename?: 'Discussion';
  author: Person;
  body: Scalars['String']['output'];
  comments?: Maybe<Array<Maybe<Comment>>>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  name: Scalars['String']['output'];
  reactions?: Maybe<Array<Maybe<Reaction>>>;
  space: Group;
  title: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type EditCommentInput = {
  commentId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
};

export type EditDiscussionInput = {
  body: Scalars['String']['input'];
  discussionId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type EditGoalInput = {
  addedTargets: Array<InputMaybe<CreateTargetInput>>;
  championId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  goalId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  reviewerId: Scalars['ID']['input'];
  timeframe: Scalars['String']['input'];
  updatedTargets: Array<InputMaybe<UpdateTargetInput>>;
};

export type EditGroupInput = {
  id: Scalars['ID']['input'];
  mission: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type EditKeyResourceInput = {
  id: Scalars['ID']['input'];
  link: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type EditProjectCheckInInput = {
  checkInId: Scalars['ID']['input'];
  description: Scalars['String']['input'];
  status: Scalars['String']['input'];
};

export type EditProjectNameInput = {
  name: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type EditProjectTimelineInput = {
  milestoneUpdates?: InputMaybe<Array<InputMaybe<MilestoneUpdateInput>>>;
  newMilestones?: InputMaybe<Array<InputMaybe<NewMilestoneInput>>>;
  projectDueDate?: InputMaybe<Scalars['Date']['input']>;
  projectId: Scalars['ID']['input'];
  projectStartDate?: InputMaybe<Scalars['Date']['input']>;
};

export type EditUpdateInput = {
  content: Scalars['String']['input'];
  health?: InputMaybe<Scalars['String']['input']>;
  newTargetValues?: InputMaybe<Scalars['String']['input']>;
  updateId: Scalars['ID']['input'];
};

export type Goal = {
  __typename?: 'Goal';
  archivedAt?: Maybe<Scalars['Date']['output']>;
  champion?: Maybe<Person>;
  closedAt?: Maybe<Scalars['Date']['output']>;
  closedBy?: Maybe<Person>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  isArchived: Scalars['Boolean']['output'];
  isClosed: Scalars['Boolean']['output'];
  lastCheckIn?: Maybe<Update>;
  myRole?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nextUpdateScheduledAt?: Maybe<Scalars['Date']['output']>;
  parentGoal?: Maybe<Goal>;
  parentGoalId?: Maybe<Scalars['ID']['output']>;
  permissions: GoalPermissions;
  progressPercentage: Scalars['Float']['output'];
  projects?: Maybe<Array<Maybe<Project>>>;
  reviewer?: Maybe<Person>;
  space: Group;
  targets?: Maybe<Array<Maybe<Target>>>;
  timeframe: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type GoalEditingUpdatedTarget = {
  __typename?: 'GoalEditingUpdatedTarget';
  id: Scalars['String']['output'];
  newName: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
};

export type GoalPermissions = {
  __typename?: 'GoalPermissions';
  canAcknowledgeCheckIn: Scalars['Boolean']['output'];
  canArchive: Scalars['Boolean']['output'];
  canCheckIn: Scalars['Boolean']['output'];
  canClose: Scalars['Boolean']['output'];
  canEdit: Scalars['Boolean']['output'];
};

export type Group = {
  __typename?: 'Group';
  color: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isCompanySpace: Scalars['Boolean']['output'];
  isMember: Scalars['Boolean']['output'];
  members?: Maybe<Array<Person>>;
  mission?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  pointsOfContact?: Maybe<Array<GroupContact>>;
  privateSpace: Scalars['Boolean']['output'];
};

export type GroupContact = {
  __typename?: 'GroupContact';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type JoinSpaceInput = {
  spaceId: Scalars['String']['input'];
};

export type KeyResult = {
  __typename?: 'KeyResult';
  group?: Maybe<Group>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owner?: Maybe<Person>;
  status?: Maybe<Scalars['String']['output']>;
  stepsCompleted?: Maybe<Scalars['Int']['output']>;
  stepsTotal?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['Date']['output'];
};

export type Kpi = {
  __typename?: 'Kpi';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  metrics?: Maybe<Array<Maybe<KpiMetric>>>;
  name: Scalars['String']['output'];
  target?: Maybe<Scalars['Int']['output']>;
  targetDirection?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
};

export type KpiMetric = {
  __typename?: 'KpiMetric';
  date: Scalars['Date']['output'];
  value: Scalars['Int']['output'];
};

export type Milestone = {
  __typename?: 'Milestone';
  comments?: Maybe<Array<Maybe<MilestoneComment>>>;
  completedAt?: Maybe<Scalars['Date']['output']>;
  deadlineAt?: Maybe<Scalars['Date']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  insertedAt?: Maybe<Scalars['Date']['output']>;
  status: Scalars['String']['output'];
  tasksKanbanState: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type MilestoneComment = {
  __typename?: 'MilestoneComment';
  action: Scalars['String']['output'];
  comment: Comment;
  id: Scalars['ID']['output'];
};

export type MilestoneUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueTime: Scalars['Date']['input'];
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type NewMilestoneInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueTime: Scalars['Date']['input'];
  title: Scalars['String']['input'];
};

export type Notification = {
  __typename?: 'Notification';
  activity: Activity;
  id: Scalars['ID']['output'];
  read: Scalars['Boolean']['output'];
  readAt: Scalars['DateTime']['output'];
};

export type Objective = {
  __typename?: 'Objective';
  activities?: Maybe<Array<Maybe<Activity>>>;
  description?: Maybe<Scalars['String']['output']>;
  group?: Maybe<Group>;
  id: Scalars['ID']['output'];
  keyResults?: Maybe<Array<Maybe<KeyResult>>>;
  name: Scalars['String']['output'];
  owner?: Maybe<Person>;
};

export type Panel = {
  __typename?: 'Panel';
  id: Scalars['ID']['output'];
  index?: Maybe<Scalars['Int']['output']>;
  linkedResource?: Maybe<PanelLinkedResource>;
  type?: Maybe<Scalars['String']['output']>;
};

export type PanelInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  index?: InputMaybe<Scalars['Int']['input']>;
  type: Scalars['String']['input'];
};

export type PanelLinkedResource = Project;

export type PauseProjectInput = {
  projectId: Scalars['String']['input'];
};

export type Person = {
  __typename?: 'Person';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Company>;
  companyRole?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  manager?: Maybe<Person>;
  managerId?: Maybe<Scalars['String']['output']>;
  notifyAboutAssignments: Scalars['Boolean']['output'];
  notifyOnMention: Scalars['Boolean']['output'];
  peers?: Maybe<Array<Maybe<Person>>>;
  reports?: Maybe<Array<Maybe<Person>>>;
  sendDailySummary: Scalars['Boolean']['output'];
  theme?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type PostDiscussionInput = {
  body: Scalars['String']['input'];
  spaceId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type PostMilestoneCommentInput = {
  action: Scalars['String']['input'];
  content?: InputMaybe<Scalars['String']['input']>;
  milestoneId: Scalars['ID']['input'];
};

export type PostProjectCheckInInput = {
  description: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};

export type Project = {
  __typename?: 'Project';
  archivedAt?: Maybe<Scalars['Date']['output']>;
  champion?: Maybe<Person>;
  closedAt?: Maybe<Scalars['Date']['output']>;
  closedBy?: Maybe<Person>;
  contributors?: Maybe<Array<Maybe<ProjectContributor>>>;
  deadline?: Maybe<Scalars['Date']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  goal?: Maybe<Goal>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  isArchived: Scalars['Boolean']['output'];
  isOutdated: Scalars['Boolean']['output'];
  isPinned: Scalars['Boolean']['output'];
  keyResources?: Maybe<Array<Maybe<ProjectKeyResource>>>;
  lastCheckIn?: Maybe<ProjectCheckIn>;
  milestones?: Maybe<Array<Maybe<Milestone>>>;
  myRole?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nextCheckInScheduledAt?: Maybe<Scalars['Date']['output']>;
  nextMilestone?: Maybe<Milestone>;
  nextUpdateScheduledAt?: Maybe<Scalars['Date']['output']>;
  permissions: ProjectPermissions;
  private: Scalars['Boolean']['output'];
  retrospective?: Maybe<Scalars['String']['output']>;
  reviewer?: Maybe<Person>;
  space: Group;
  spaceId: Scalars['ID']['output'];
  startedAt?: Maybe<Scalars['Date']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
};

export type ProjectCheckIn = {
  __typename?: 'ProjectCheckIn';
  acknowledgedAt?: Maybe<Scalars['NaiveDateTime']['output']>;
  acknowledgedBy?: Maybe<Person>;
  author: Person;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  project: Project;
  reactions: Array<Maybe<Reaction>>;
  status: Scalars['String']['output'];
};

export type ProjectContributor = {
  __typename?: 'ProjectContributor';
  id: Scalars['ID']['output'];
  person: Person;
  responsibility?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
};

export type ProjectHealth = {
  __typename?: 'ProjectHealth';
  budget: Scalars['String']['output'];
  budgetComments: Scalars['String']['output'];
  risks: Scalars['String']['output'];
  risksComments: Scalars['String']['output'];
  schedule: Scalars['String']['output'];
  scheduleComments: Scalars['String']['output'];
  status: Scalars['String']['output'];
  statusComments: Scalars['String']['output'];
  team: Scalars['String']['output'];
  teamComments: Scalars['String']['output'];
};

export type ProjectKeyResource = {
  __typename?: 'ProjectKeyResource';
  id: Scalars['ID']['output'];
  link: Scalars['String']['output'];
  resourceType: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ProjectListFilters = {
  filter?: InputMaybe<Scalars['String']['input']>;
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
  spaceId?: InputMaybe<Scalars['ID']['input']>;
};

export type ProjectMoveInput = {
  projectId: Scalars['ID']['input'];
  spaceId: Scalars['ID']['input'];
};

export type ProjectPermissions = {
  __typename?: 'ProjectPermissions';
  canAcknowledgeCheckIn: Scalars['Boolean']['output'];
  canCheckIn: Scalars['Boolean']['output'];
  canCreateMilestone: Scalars['Boolean']['output'];
  canDeleteMilestone: Scalars['Boolean']['output'];
  canEditContributors: Scalars['Boolean']['output'];
  canEditDescription: Scalars['Boolean']['output'];
  canEditGoal: Scalars['Boolean']['output'];
  canEditMilestone: Scalars['Boolean']['output'];
  canEditName: Scalars['Boolean']['output'];
  canEditResources: Scalars['Boolean']['output'];
  canEditSpace: Scalars['Boolean']['output'];
  canEditTimeline: Scalars['Boolean']['output'];
  canPause: Scalars['Boolean']['output'];
  canView: Scalars['Boolean']['output'];
};

export type ProjectReviewRequest = {
  __typename?: 'ProjectReviewRequest';
  author?: Maybe<Person>;
  content: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  reviewId?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type Reaction = {
  __typename?: 'Reaction';
  emoji: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  person: Person;
  reactionType: Scalars['String']['output'];
};

export type ResumeProjectInput = {
  projectId: Scalars['String']['input'];
};

export type RootMutationType = {
  __typename?: 'RootMutationType';
  acknowledge?: Maybe<Update>;
  acknowledgeProjectCheckIn: ProjectCheckIn;
  addCompanyAdmins?: Maybe<Scalars['Boolean']['output']>;
  addCompanyMember: Person;
  addCompanyTrustedEmailDomain: Company;
  addGroupContact?: Maybe<Group>;
  addGroupMembers?: Maybe<Group>;
  addKeyResource: ProjectKeyResource;
  addProjectContributor: ProjectContributor;
  addProjectMilestone: Milestone;
  addReaction?: Maybe<Reaction>;
  archiveGoal?: Maybe<Goal>;
  archiveProject: Project;
  changeGoalParent: Goal;
  changeTaskDescription: Task;
  closeGoal: Goal;
  closeProject: Project;
  connectGoalToProject: Project;
  createBlob: Blob;
  createComment?: Maybe<Comment>;
  createGoal?: Maybe<Goal>;
  createGroup?: Maybe<Group>;
  createKeyResult?: Maybe<KeyResult>;
  createKpi?: Maybe<Kpi>;
  createObjective?: Maybe<Objective>;
  createProfile?: Maybe<Person>;
  createProject: Project;
  createProjectReviewRequest?: Maybe<ProjectReviewRequest>;
  createTask?: Maybe<Task>;
  createTenet?: Maybe<Tenet>;
  createUpdate: Update;
  disconnectGoalFromProject: Project;
  editComment?: Maybe<Comment>;
  editDiscussion?: Maybe<Discussion>;
  editGoal?: Maybe<Goal>;
  editGroup?: Maybe<Group>;
  editKeyResource: ProjectKeyResource;
  editProjectCheckIn: ProjectCheckIn;
  editProjectName: Project;
  editProjectTimeline: Project;
  editUpdate: Update;
  joinSpace: Group;
  markAllNotificationsAsRead: Scalars['Boolean']['output'];
  markNotificationAsRead: Notification;
  moveProjectToSpace: Project;
  pauseProject: Project;
  pinProjectToHomePage: Scalars['Boolean']['output'];
  postDiscussion?: Maybe<Discussion>;
  postMilestoneComment: MilestoneComment;
  postProjectCheckIn: ProjectCheckIn;
  removeCompanyAdmin?: Maybe<Person>;
  removeCompanyTrustedEmailDomain: Company;
  removeGroupMember?: Maybe<Group>;
  removeKeyResource: ProjectKeyResource;
  removeProjectContributor: ProjectContributor;
  removeProjectMilestone: Milestone;
  resumeProject: Project;
  setGoalGroup?: Maybe<Objective>;
  setGroupMission?: Maybe<Group>;
  setKeyResultOwner?: Maybe<KeyResult>;
  setMilestoneDeadline: Milestone;
  setMilestoneStatus: Milestone;
  setObjectiveOwner?: Maybe<Objective>;
  setProjectDueDate: Project;
  setProjectStartDate: Project;
  setTargetGroup?: Maybe<KeyResult>;
  updateAppearance?: Maybe<Person>;
  updateDashboard: Dashboard;
  updateGroupAppearance: Group;
  updateMilestone: Milestone;
  updateMilestoneDescription: Milestone;
  updateMilestoneTitle: Milestone;
  updateNotificationSettings?: Maybe<Person>;
  updateProfile?: Maybe<Person>;
  updateProjectContributor: ProjectContributor;
  updateProjectDescription: Project;
  updateTask: Task;
  updateTaskStatus: Task;
};


export type RootMutationTypeAcknowledgeArgs = {
  id: Scalars['ID']['input'];
};


export type RootMutationTypeAcknowledgeProjectCheckInArgs = {
  id: Scalars['ID']['input'];
};


export type RootMutationTypeAddCompanyAdminsArgs = {
  peopleIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type RootMutationTypeAddCompanyMemberArgs = {
  input: AddCompanyMemberInput;
};


export type RootMutationTypeAddCompanyTrustedEmailDomainArgs = {
  companyId: Scalars['ID']['input'];
  domain: Scalars['String']['input'];
};


export type RootMutationTypeAddGroupContactArgs = {
  contact: ContactInput;
  groupId: Scalars['ID']['input'];
};


export type RootMutationTypeAddGroupMembersArgs = {
  groupId: Scalars['ID']['input'];
  personIds: Array<Scalars['ID']['input']>;
};


export type RootMutationTypeAddKeyResourceArgs = {
  input: AddKeyResourceInput;
};


export type RootMutationTypeAddProjectContributorArgs = {
  personId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
  responsibility: Scalars['String']['input'];
  role: Scalars['String']['input'];
};


export type RootMutationTypeAddProjectMilestoneArgs = {
  deadlineAt?: InputMaybe<Scalars['Date']['input']>;
  projectId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type RootMutationTypeAddReactionArgs = {
  input: AddReactionInput;
};


export type RootMutationTypeArchiveGoalArgs = {
  goalId: Scalars['ID']['input'];
};


export type RootMutationTypeArchiveProjectArgs = {
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypeChangeGoalParentArgs = {
  input: ChangeGoalParentInput;
};


export type RootMutationTypeChangeTaskDescriptionArgs = {
  input: ChangeTaskDescriptionInput;
};


export type RootMutationTypeCloseGoalArgs = {
  input: CloseGoalInput;
};


export type RootMutationTypeCloseProjectArgs = {
  input: CloseProjectInput;
};


export type RootMutationTypeConnectGoalToProjectArgs = {
  goalId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypeCreateBlobArgs = {
  input: BlobInput;
};


export type RootMutationTypeCreateCommentArgs = {
  input: CreateCommentInput;
};


export type RootMutationTypeCreateGoalArgs = {
  input: CreateGoalInput;
};


export type RootMutationTypeCreateGroupArgs = {
  input: CreateGroupInput;
};


export type RootMutationTypeCreateKeyResultArgs = {
  input: CreateKeyResultInput;
};


export type RootMutationTypeCreateKpiArgs = {
  input: CreateKpiInput;
};


export type RootMutationTypeCreateObjectiveArgs = {
  input: CreateObjectiveInput;
};


export type RootMutationTypeCreateProfileArgs = {
  fullName: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type RootMutationTypeCreateProjectArgs = {
  input: CreateProjectInput;
};


export type RootMutationTypeCreateProjectReviewRequestArgs = {
  input: CreateProjectReviewRequestInput;
};


export type RootMutationTypeCreateTaskArgs = {
  input: CreateTaskInput;
};


export type RootMutationTypeCreateTenetArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type RootMutationTypeCreateUpdateArgs = {
  input: CreateUpdateInput;
};


export type RootMutationTypeDisconnectGoalFromProjectArgs = {
  goalId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypeEditCommentArgs = {
  input: EditCommentInput;
};


export type RootMutationTypeEditDiscussionArgs = {
  input: EditDiscussionInput;
};


export type RootMutationTypeEditGoalArgs = {
  input: EditGoalInput;
};


export type RootMutationTypeEditGroupArgs = {
  input: EditGroupInput;
};


export type RootMutationTypeEditKeyResourceArgs = {
  input: EditKeyResourceInput;
};


export type RootMutationTypeEditProjectCheckInArgs = {
  input: EditProjectCheckInInput;
};


export type RootMutationTypeEditProjectNameArgs = {
  input: EditProjectNameInput;
};


export type RootMutationTypeEditProjectTimelineArgs = {
  input: EditProjectTimelineInput;
};


export type RootMutationTypeEditUpdateArgs = {
  input: EditUpdateInput;
};


export type RootMutationTypeJoinSpaceArgs = {
  input: JoinSpaceInput;
};


export type RootMutationTypeMarkNotificationAsReadArgs = {
  id: Scalars['ID']['input'];
};


export type RootMutationTypeMoveProjectToSpaceArgs = {
  input: ProjectMoveInput;
};


export type RootMutationTypePauseProjectArgs = {
  input: PauseProjectInput;
};


export type RootMutationTypePinProjectToHomePageArgs = {
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypePostDiscussionArgs = {
  input: PostDiscussionInput;
};


export type RootMutationTypePostMilestoneCommentArgs = {
  input: PostMilestoneCommentInput;
};


export type RootMutationTypePostProjectCheckInArgs = {
  input: PostProjectCheckInInput;
};


export type RootMutationTypeRemoveCompanyAdminArgs = {
  personId: Scalars['ID']['input'];
};


export type RootMutationTypeRemoveCompanyTrustedEmailDomainArgs = {
  companyId: Scalars['ID']['input'];
  domain: Scalars['String']['input'];
};


export type RootMutationTypeRemoveGroupMemberArgs = {
  groupId: Scalars['ID']['input'];
  memberId: Scalars['ID']['input'];
};


export type RootMutationTypeRemoveKeyResourceArgs = {
  id: Scalars['ID']['input'];
};


export type RootMutationTypeRemoveProjectContributorArgs = {
  contribId: Scalars['ID']['input'];
};


export type RootMutationTypeRemoveProjectMilestoneArgs = {
  milestoneId: Scalars['ID']['input'];
};


export type RootMutationTypeResumeProjectArgs = {
  input: ResumeProjectInput;
};


export type RootMutationTypeSetGoalGroupArgs = {
  groupId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
};


export type RootMutationTypeSetGroupMissionArgs = {
  groupId: Scalars['ID']['input'];
  mission: Scalars['String']['input'];
};


export type RootMutationTypeSetKeyResultOwnerArgs = {
  id: Scalars['ID']['input'];
  ownerId?: InputMaybe<Scalars['ID']['input']>;
};


export type RootMutationTypeSetMilestoneDeadlineArgs = {
  deadlineAt?: InputMaybe<Scalars['Date']['input']>;
  milestoneId: Scalars['ID']['input'];
};


export type RootMutationTypeSetMilestoneStatusArgs = {
  milestoneId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};


export type RootMutationTypeSetObjectiveOwnerArgs = {
  id: Scalars['ID']['input'];
  ownerId?: InputMaybe<Scalars['ID']['input']>;
};


export type RootMutationTypeSetProjectDueDateArgs = {
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypeSetProjectStartDateArgs = {
  projectId: Scalars['ID']['input'];
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type RootMutationTypeSetTargetGroupArgs = {
  groupId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
};


export type RootMutationTypeUpdateAppearanceArgs = {
  input: UpdateAppearanceInput;
};


export type RootMutationTypeUpdateDashboardArgs = {
  input: UpdateDashboardInput;
};


export type RootMutationTypeUpdateGroupAppearanceArgs = {
  input: UpdateGroupAppearanceInput;
};


export type RootMutationTypeUpdateMilestoneArgs = {
  input: UpdateMilestoneInput;
};


export type RootMutationTypeUpdateMilestoneDescriptionArgs = {
  input: UpdateMilestoneDescriptionInput;
};


export type RootMutationTypeUpdateMilestoneTitleArgs = {
  input: UpdateMilestoneTitleInput;
};


export type RootMutationTypeUpdateNotificationSettingsArgs = {
  input: UpdateNotificationSettingsInput;
};


export type RootMutationTypeUpdateProfileArgs = {
  input: UpdateProfileInput;
};


export type RootMutationTypeUpdateProjectContributorArgs = {
  contribId: Scalars['ID']['input'];
  personId: Scalars['ID']['input'];
  responsibility: Scalars['String']['input'];
};


export type RootMutationTypeUpdateProjectDescriptionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypeUpdateTaskArgs = {
  input: UpdateTaskInput;
};


export type RootMutationTypeUpdateTaskStatusArgs = {
  input: UpdateTaskStatusInput;
};

export type RootQueryType = {
  __typename?: 'RootQueryType';
  activities?: Maybe<Array<Maybe<Activity>>>;
  assignments: Assignments;
  comments?: Maybe<Array<Maybe<Comment>>>;
  company: Company;
  discussion: Discussion;
  discussions?: Maybe<Array<Maybe<Discussion>>>;
  goal: Goal;
  goals?: Maybe<Array<Maybe<Goal>>>;
  group?: Maybe<Group>;
  groups?: Maybe<Array<Maybe<Group>>>;
  homeDashboard: Dashboard;
  keyResource?: Maybe<ProjectKeyResource>;
  keyResults?: Maybe<Array<Maybe<KeyResult>>>;
  kpi?: Maybe<Kpi>;
  kpis?: Maybe<Array<Maybe<Kpi>>>;
  me?: Maybe<Person>;
  milestone?: Maybe<Milestone>;
  notifications?: Maybe<Array<Notification>>;
  objective?: Maybe<Objective>;
  objectives?: Maybe<Array<Maybe<Objective>>>;
  people?: Maybe<Array<Maybe<Person>>>;
  person?: Maybe<Person>;
  potentialGroupMembers?: Maybe<Array<Maybe<Person>>>;
  project?: Maybe<Project>;
  projectCheckIn: ProjectCheckIn;
  projectCheckIns?: Maybe<Array<ProjectCheckIn>>;
  projectContributorCandidates?: Maybe<Array<Maybe<Person>>>;
  projectReviewRequest: ProjectReviewRequest;
  projects?: Maybe<Array<Maybe<Project>>>;
  searchPeople?: Maybe<Array<Maybe<Person>>>;
  task: Task;
  tasks?: Maybe<Array<Maybe<Task>>>;
  tenet?: Maybe<Tenet>;
  tenets?: Maybe<Array<Maybe<Tenet>>>;
  unreadNotificationsCount?: Maybe<Scalars['Int']['output']>;
  update: Update;
  updates: Array<Maybe<Update>>;
};


export type RootQueryTypeActivitiesArgs = {
  scopeId: Scalars['String']['input'];
  scopeType: Scalars['String']['input'];
};


export type RootQueryTypeAssignmentsArgs = {
  rangeEnd: Scalars['DateTime']['input'];
  rangeStart: Scalars['DateTime']['input'];
};


export type RootQueryTypeCommentsArgs = {
  entityId?: InputMaybe<Scalars['ID']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
};


export type RootQueryTypeCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeDiscussionArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeDiscussionsArgs = {
  spaceId: Scalars['ID']['input'];
};


export type RootQueryTypeGoalArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeGoalsArgs = {
  includeLongerTimeframes?: InputMaybe<Scalars['Boolean']['input']>;
  spaceId?: InputMaybe<Scalars['ID']['input']>;
  timeframe?: InputMaybe<Scalars['String']['input']>;
};


export type RootQueryTypeGroupArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeKeyResourceArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeKeyResultsArgs = {
  objectiveId: Scalars['ID']['input'];
};


export type RootQueryTypeKpiArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeMilestoneArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeNotificationsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type RootQueryTypeObjectiveArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeObjectivesArgs = {
  groupId?: InputMaybe<Scalars['ID']['input']>;
};


export type RootQueryTypePersonArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypePotentialGroupMembersArgs = {
  excludeIds?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  groupId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type RootQueryTypeProjectArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeProjectCheckInArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type RootQueryTypeProjectCheckInsArgs = {
  projectId: Scalars['ID']['input'];
};


export type RootQueryTypeProjectContributorCandidatesArgs = {
  projectId: Scalars['ID']['input'];
  query: Scalars['String']['input'];
};


export type RootQueryTypeProjectReviewRequestArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeProjectsArgs = {
  filters?: InputMaybe<ProjectListFilters>;
};


export type RootQueryTypeSearchPeopleArgs = {
  ignoredIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  query: Scalars['String']['input'];
};


export type RootQueryTypeTaskArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeTasksArgs = {
  milestoneId: Scalars['String']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};


export type RootQueryTypeTenetArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeUpdateArgs = {
  id: Scalars['ID']['input'];
};


export type RootQueryTypeUpdatesArgs = {
  filter: UpdatesFilter;
};

export type RootSubscriptionType = {
  __typename?: 'RootSubscriptionType';
  onUnreadNotificationCountChanged?: Maybe<Scalars['Boolean']['output']>;
};

export type Target = {
  __typename?: 'Target';
  from: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  index: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  to: Scalars['Float']['output'];
  unit: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type Task = {
  __typename?: 'Task';
  assignees?: Maybe<Array<Person>>;
  creator: Person;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  milestone: Milestone;
  name: Scalars['String']['output'];
  priority?: Maybe<Scalars['String']['output']>;
  project: Project;
  size?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type Tenet = {
  __typename?: 'Tenet';
  company: Company;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kpis?: Maybe<Array<Maybe<Kpi>>>;
  name: Scalars['String']['output'];
  objectives?: Maybe<Array<Maybe<Objective>>>;
};

export type Update = {
  __typename?: 'Update';
  acknowledged: Scalars['Boolean']['output'];
  acknowledgedAt?: Maybe<Scalars['NaiveDateTime']['output']>;
  acknowledgingPerson?: Maybe<Person>;
  author?: Maybe<Person>;
  comments?: Maybe<Array<Maybe<Comment>>>;
  content?: Maybe<UpdateContent>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['NaiveDateTime']['output'];
  message: Scalars['String']['output'];
  messageType: Scalars['String']['output'];
  project?: Maybe<Project>;
  reactions?: Maybe<Array<Maybe<Reaction>>>;
  title?: Maybe<Scalars['String']['output']>;
  updatableId: Scalars['ID']['output'];
  updatedAt: Scalars['NaiveDateTime']['output'];
};

export type UpdateAppearanceInput = {
  theme?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateContent = UpdateContentGoalCheckIn | UpdateContentMessage | UpdateContentProjectContributorAdded | UpdateContentProjectContributorRemoved | UpdateContentProjectCreated | UpdateContentProjectDiscussion | UpdateContentProjectEndTimeChanged | UpdateContentProjectMilestoneCompleted | UpdateContentProjectMilestoneCreated | UpdateContentProjectMilestoneDeadlineChanged | UpdateContentProjectMilestoneDeleted | UpdateContentProjectStartTimeChanged | UpdateContentReview | UpdateContentStatusUpdate;

export type UpdateContentGoalCheckIn = {
  __typename?: 'UpdateContentGoalCheckIn';
  message: Scalars['String']['output'];
  targets?: Maybe<Array<Maybe<UpdateContentGoalCheckInTarget>>>;
};

export type UpdateContentGoalCheckInTarget = {
  __typename?: 'UpdateContentGoalCheckInTarget';
  from: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  index: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  previousValue: Scalars['Float']['output'];
  to: Scalars['Float']['output'];
  unit: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type UpdateContentMessage = {
  __typename?: 'UpdateContentMessage';
  message: Scalars['String']['output'];
};

export type UpdateContentProjectContributorAdded = {
  __typename?: 'UpdateContentProjectContributorAdded';
  contributor: Person;
  contributorId?: Maybe<Scalars['String']['output']>;
  contributorRole?: Maybe<Scalars['String']['output']>;
};

export type UpdateContentProjectContributorRemoved = {
  __typename?: 'UpdateContentProjectContributorRemoved';
  contributor: Person;
  contributorId?: Maybe<Scalars['String']['output']>;
  contributorRole?: Maybe<Scalars['String']['output']>;
};

export type UpdateContentProjectCreated = {
  __typename?: 'UpdateContentProjectCreated';
  champion?: Maybe<Person>;
  creator?: Maybe<Person>;
  creatorRole?: Maybe<Scalars['String']['output']>;
};

export type UpdateContentProjectDiscussion = {
  __typename?: 'UpdateContentProjectDiscussion';
  body: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type UpdateContentProjectEndTimeChanged = {
  __typename?: 'UpdateContentProjectEndTimeChanged';
  newEndTime: Scalars['String']['output'];
  oldEndTime: Scalars['String']['output'];
};

export type UpdateContentProjectMilestoneCompleted = {
  __typename?: 'UpdateContentProjectMilestoneCompleted';
  milestone: Milestone;
};

export type UpdateContentProjectMilestoneCreated = {
  __typename?: 'UpdateContentProjectMilestoneCreated';
  milestone: Milestone;
};

export type UpdateContentProjectMilestoneDeadlineChanged = {
  __typename?: 'UpdateContentProjectMilestoneDeadlineChanged';
  milestone: Milestone;
  newDeadline?: Maybe<Scalars['String']['output']>;
  oldDeadline?: Maybe<Scalars['String']['output']>;
};

export type UpdateContentProjectMilestoneDeleted = {
  __typename?: 'UpdateContentProjectMilestoneDeleted';
  milestone: Milestone;
};

export type UpdateContentProjectStartTimeChanged = {
  __typename?: 'UpdateContentProjectStartTimeChanged';
  newStartTime: Scalars['String']['output'];
  oldStartTime: Scalars['String']['output'];
};

export type UpdateContentReview = {
  __typename?: 'UpdateContentReview';
  newPhase: Scalars['String']['output'];
  previousPhase: Scalars['String']['output'];
  reviewReason?: Maybe<Scalars['String']['output']>;
  reviewRequestId?: Maybe<Scalars['String']['output']>;
  survey: Scalars['String']['output'];
};

export type UpdateContentStatusUpdate = {
  __typename?: 'UpdateContentStatusUpdate';
  health?: Maybe<ProjectHealth>;
  message: Scalars['String']['output'];
  newHealth: Scalars['String']['output'];
  nextMilestoneDueDate?: Maybe<Scalars['String']['output']>;
  nextMilestoneId?: Maybe<Scalars['ID']['output']>;
  nextMilestoneTitle?: Maybe<Scalars['String']['output']>;
  oldHealth: Scalars['String']['output'];
  phase?: Maybe<Scalars['String']['output']>;
  phaseEnd?: Maybe<Scalars['String']['output']>;
  phaseStart?: Maybe<Scalars['String']['output']>;
  projectEndTime?: Maybe<Scalars['String']['output']>;
  projectStartTime?: Maybe<Scalars['String']['output']>;
};

export type UpdateDashboardInput = {
  id: Scalars['ID']['input'];
  panels?: InputMaybe<Array<InputMaybe<PanelInput>>>;
};

export type UpdateGroupAppearanceInput = {
  color: Scalars['String']['input'];
  icon: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};

export type UpdateMilestoneDescriptionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
};

export type UpdateMilestoneInput = {
  deadlineAt?: InputMaybe<Scalars['Date']['input']>;
  milestoneId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type UpdateMilestoneTitleInput = {
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type UpdateNotificationSettingsInput = {
  notifyAboutAssignments?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnMention?: InputMaybe<Scalars['Boolean']['input']>;
  sendDailySummary?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateProfileInput = {
  fullName?: InputMaybe<Scalars['String']['input']>;
  managerId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTargetInput = {
  from: Scalars['Float']['input'];
  id: Scalars['ID']['input'];
  index: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  to: Scalars['Float']['input'];
  unit: Scalars['String']['input'];
};

export type UpdateTaskInput = {
  assignedIds: Array<InputMaybe<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  taskId: Scalars['String']['input'];
};

export type UpdateTaskStatusInput = {
  columnIndex: Scalars['Int']['input'];
  status: Scalars['String']['input'];
  taskId: Scalars['String']['input'];
};

export type UpdatesFilter = {
  goalId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type AddCompanyMemberMutationVariables = Exact<{
  input: AddCompanyMemberInput;
}>;


export type AddCompanyMemberMutation = { __typename?: 'RootMutationType', addCompanyMember: { __typename?: 'Person', id: string, fullName: string, email?: string | null, title?: string | null } };

export type GetMeQueryVariables = Exact<{
  includeManager?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetMeQuery = { __typename?: 'RootQueryType', me?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null, sendDailySummary: boolean, notifyOnMention: boolean, notifyAboutAssignments: boolean, theme?: string | null, companyRole?: string | null, manager?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null } | null };

export type GetPeopleQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPeopleQuery = { __typename?: 'RootQueryType', people?: Array<{ __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null, managerId?: string | null } | null> | null };

export type GetPersonQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  includeManager?: InputMaybe<Scalars['Boolean']['input']>;
  includeReports?: InputMaybe<Scalars['Boolean']['input']>;
  includePeers?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetPersonQuery = { __typename?: 'RootQueryType', person?: { __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null, email?: string | null, manager?: { __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null } | null, reports?: Array<{ __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null } | null> | null, peers?: Array<{ __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null } | null> | null } | null };

export type SearchPeopleQueryVariables = Exact<{
  query: Scalars['String']['input'];
  ignoredIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type SearchPeopleQuery = { __typename?: 'RootQueryType', searchPeople?: Array<{ __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null } | null> | null };


export const AddCompanyMemberDocument = gql`
    mutation AddCompanyMember($input: AddCompanyMemberInput!) {
  addCompanyMember(input: $input) {
    id
    fullName
    email
    title
  }
}
    `;
export type AddCompanyMemberMutationFn = Apollo.MutationFunction<AddCompanyMemberMutation, AddCompanyMemberMutationVariables>;

/**
 * __useAddCompanyMemberMutation__
 *
 * To run a mutation, you first call `useAddCompanyMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCompanyMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCompanyMemberMutation, { data, loading, error }] = useAddCompanyMemberMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddCompanyMemberMutation(baseOptions?: Apollo.MutationHookOptions<AddCompanyMemberMutation, AddCompanyMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddCompanyMemberMutation, AddCompanyMemberMutationVariables>(AddCompanyMemberDocument, options);
      }
export type AddCompanyMemberMutationHookResult = ReturnType<typeof useAddCompanyMemberMutation>;
export type AddCompanyMemberMutationResult = Apollo.MutationResult<AddCompanyMemberMutation>;
export type AddCompanyMemberMutationOptions = Apollo.BaseMutationOptions<AddCompanyMemberMutation, AddCompanyMemberMutationVariables>;
export const GetMeDocument = gql`
    query GetMe($includeManager: Boolean = false) {
  me {
    id
    fullName
    avatarUrl
    title
    sendDailySummary
    notifyOnMention
    notifyAboutAssignments
    theme
    companyRole
    manager @include(if: $includeManager) {
      id
      fullName
      avatarUrl
      title
    }
  }
}
    `;

/**
 * __useGetMeQuery__
 *
 * To run a query within a React component, call `useGetMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeQuery({
 *   variables: {
 *      includeManager: // value for 'includeManager'
 *   },
 * });
 */
export function useGetMeQuery(baseOptions?: Apollo.QueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
      }
export function useGetMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
export type GetMeQueryHookResult = ReturnType<typeof useGetMeQuery>;
export type GetMeLazyQueryHookResult = ReturnType<typeof useGetMeLazyQuery>;
export type GetMeQueryResult = Apollo.QueryResult<GetMeQuery, GetMeQueryVariables>;
export const GetPeopleDocument = gql`
    query GetPeople {
  people {
    id
    fullName
    title
    avatarUrl
    managerId
  }
}
    `;

/**
 * __useGetPeopleQuery__
 *
 * To run a query within a React component, call `useGetPeopleQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPeopleQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPeopleQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPeopleQuery(baseOptions?: Apollo.QueryHookOptions<GetPeopleQuery, GetPeopleQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPeopleQuery, GetPeopleQueryVariables>(GetPeopleDocument, options);
      }
export function useGetPeopleLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPeopleQuery, GetPeopleQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPeopleQuery, GetPeopleQueryVariables>(GetPeopleDocument, options);
        }
export type GetPeopleQueryHookResult = ReturnType<typeof useGetPeopleQuery>;
export type GetPeopleLazyQueryHookResult = ReturnType<typeof useGetPeopleLazyQuery>;
export type GetPeopleQueryResult = Apollo.QueryResult<GetPeopleQuery, GetPeopleQueryVariables>;
export const GetPersonDocument = gql`
    query GetPerson($id: ID!, $includeManager: Boolean = false, $includeReports: Boolean = false, $includePeers: Boolean = false) {
  person(id: $id) {
    id
    fullName
    title
    avatarUrl
    email
    manager @include(if: $includeManager) {
      id
      fullName
      title
      avatarUrl
    }
    reports @include(if: $includeReports) {
      id
      fullName
      title
      avatarUrl
    }
    peers @include(if: $includePeers) {
      id
      fullName
      title
      avatarUrl
    }
  }
}
    `;

/**
 * __useGetPersonQuery__
 *
 * To run a query within a React component, call `useGetPersonQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPersonQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPersonQuery({
 *   variables: {
 *      id: // value for 'id'
 *      includeManager: // value for 'includeManager'
 *      includeReports: // value for 'includeReports'
 *      includePeers: // value for 'includePeers'
 *   },
 * });
 */
export function useGetPersonQuery(baseOptions: Apollo.QueryHookOptions<GetPersonQuery, GetPersonQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPersonQuery, GetPersonQueryVariables>(GetPersonDocument, options);
      }
export function useGetPersonLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPersonQuery, GetPersonQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPersonQuery, GetPersonQueryVariables>(GetPersonDocument, options);
        }
export type GetPersonQueryHookResult = ReturnType<typeof useGetPersonQuery>;
export type GetPersonLazyQueryHookResult = ReturnType<typeof useGetPersonLazyQuery>;
export type GetPersonQueryResult = Apollo.QueryResult<GetPersonQuery, GetPersonQueryVariables>;
export const SearchPeopleDocument = gql`
    query SearchPeople($query: String!, $ignoredIds: [ID!]) {
  searchPeople(query: $query, ignoredIds: $ignoredIds) {
    id
    fullName
    title
    avatarUrl
  }
}
    `;

/**
 * __useSearchPeopleQuery__
 *
 * To run a query within a React component, call `useSearchPeopleQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchPeopleQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchPeopleQuery({
 *   variables: {
 *      query: // value for 'query'
 *      ignoredIds: // value for 'ignoredIds'
 *   },
 * });
 */
export function useSearchPeopleQuery(baseOptions: Apollo.QueryHookOptions<SearchPeopleQuery, SearchPeopleQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchPeopleQuery, SearchPeopleQueryVariables>(SearchPeopleDocument, options);
      }
export function useSearchPeopleLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchPeopleQuery, SearchPeopleQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchPeopleQuery, SearchPeopleQueryVariables>(SearchPeopleDocument, options);
        }
export type SearchPeopleQueryHookResult = ReturnType<typeof useSearchPeopleQuery>;
export type SearchPeopleLazyQueryHookResult = ReturnType<typeof useSearchPeopleLazyQuery>;
export type SearchPeopleQueryResult = Apollo.QueryResult<SearchPeopleQuery, SearchPeopleQueryVariables>;