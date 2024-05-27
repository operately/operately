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
  commentThread?: Maybe<CommentThread>;
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

export type ActivityContent = ActivityContentCommentAdded | ActivityContentDiscussionCommentSubmitted | ActivityContentDiscussionEditing | ActivityContentDiscussionPosting | ActivityContentGoalArchived | ActivityContentGoalCheckIn | ActivityContentGoalCheckInAcknowledgement | ActivityContentGoalCheckInEdit | ActivityContentGoalClosing | ActivityContentGoalCreated | ActivityContentGoalDiscussionCreation | ActivityContentGoalDiscussionEditing | ActivityContentGoalEditing | ActivityContentGoalReopening | ActivityContentGoalReparent | ActivityContentGoalTimeframeEditing | ActivityContentGroupEdited | ActivityContentProjectArchived | ActivityContentProjectCheckInAcknowledged | ActivityContentProjectCheckInCommented | ActivityContentProjectCheckInEdit | ActivityContentProjectCheckInSubmitted | ActivityContentProjectClosed | ActivityContentProjectContributorAddition | ActivityContentProjectCreated | ActivityContentProjectDiscussionSubmitted | ActivityContentProjectGoalConnection | ActivityContentProjectGoalDisconnection | ActivityContentProjectMilestoneCommented | ActivityContentProjectMoved | ActivityContentProjectPausing | ActivityContentProjectRenamed | ActivityContentProjectResuming | ActivityContentProjectReviewAcknowledged | ActivityContentProjectReviewCommented | ActivityContentProjectReviewRequestSubmitted | ActivityContentProjectReviewSubmitted | ActivityContentProjectTimelineEdited | ActivityContentSpaceJoining | ActivityContentTaskAdding | ActivityContentTaskAssigneeAssignment | ActivityContentTaskClosing | ActivityContentTaskDescriptionChange | ActivityContentTaskNameEditing | ActivityContentTaskPriorityChange | ActivityContentTaskReopening | ActivityContentTaskSizeChange | ActivityContentTaskStatusChange | ActivityContentTaskUpdate;

export type ActivityContentCommentAdded = {
  __typename?: 'ActivityContentCommentAdded';
  activity?: Maybe<Activity>;
  comment: Comment;
};

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
  discussion: Discussion;
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
  success?: Maybe<Scalars['String']['output']>;
};

export type ActivityContentGoalCreated = {
  __typename?: 'ActivityContentGoalCreated';
  goal: Goal;
};

export type ActivityContentGoalDiscussionCreation = {
  __typename?: 'ActivityContentGoalDiscussionCreation';
  companyId?: Maybe<Scalars['String']['output']>;
  goal: Goal;
  goalId?: Maybe<Scalars['String']['output']>;
};

export type ActivityContentGoalDiscussionEditing = {
  __typename?: 'ActivityContentGoalDiscussionEditing';
  activityId: Scalars['String']['output'];
  companyId: Scalars['String']['output'];
  goalId: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
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
  newTimeframe: Timeframe;
  oldChampionId: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
  oldReviewerId: Scalars['String']['output'];
  oldTimeframe: Timeframe;
  updatedTargets: Array<Maybe<GoalEditingUpdatedTarget>>;
};

export type ActivityContentGoalReopening = {
  __typename?: 'ActivityContentGoalReopening';
  companyId?: Maybe<Scalars['String']['output']>;
  goal: Goal;
  goalId?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
};

export type ActivityContentGoalReparent = {
  __typename?: 'ActivityContentGoalReparent';
  companyId: Scalars['String']['output'];
  newParentGoalId?: Maybe<Scalars['String']['output']>;
  oldParentGoalId?: Maybe<Scalars['String']['output']>;
};

export type ActivityContentGoalTimeframeEditing = {
  __typename?: 'ActivityContentGoalTimeframeEditing';
  goal: Goal;
  newTimeframe: Timeframe;
  oldTimeframe: Timeframe;
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
  retrospective: Scalars['String']['input'];
  success: Scalars['String']['input'];
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

export type CommentThread = {
  __typename?: 'CommentThread';
  author: Person;
  comments: Array<Maybe<Comment>>;
  commentsCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  message: Scalars['String']['output'];
  reactions: Array<Maybe<Reaction>>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Company = {
  __typename?: 'Company';
  admins?: Maybe<Array<Maybe<Person>>>;
  companySpaceId?: Maybe<Scalars['String']['output']>;
  enabledExperimentalFeatures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  mission?: Maybe<Scalars['String']['output']>;
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

export type CreateGoalDiscussionInput = {
  goalId: Scalars['String']['input'];
  message: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateGoalInput = {
  championId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentGoalId?: InputMaybe<Scalars['ID']['input']>;
  reviewerId: Scalars['ID']['input'];
  spaceId: Scalars['ID']['input'];
  targets: Array<InputMaybe<CreateTargetInput>>;
  timeframe: TimeframeInput;
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

export type EditGoalDiscussionInput = {
  activityId: Scalars['String']['input'];
  message: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type EditGoalInput = {
  addedTargets: Array<InputMaybe<CreateTargetInput>>;
  championId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  goalId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  reviewerId: Scalars['ID']['input'];
  timeframe: TimeframeInput;
  updatedTargets: Array<InputMaybe<UpdateTargetInput>>;
};

export type EditGoalTimeframeInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  timeframe: TimeframeInput;
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
  timeframe: Timeframe;
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
  timezone?: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  manager?: Maybe<Person>;
  managerId?: Maybe<Scalars['String']['output']>;
  notifyAboutAssignments: Scalars['Boolean']['output'];
  notifyOnMention: Scalars['Boolean']['output'];
  peers?: Maybe<Array<Maybe<Person>>>;
  reports?: Maybe<Array<Maybe<Person>>>;
  sendDailySummary: Scalars['Boolean']['output'];
  suspended: Scalars['Boolean']['output'];
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

export type ReopenGoalInput = {
  id: Scalars['String']['input'];
  message: Scalars['String']['input'];
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
  createGoalDiscussion: Activity;
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
  editGoalDiscussion: Goal;
  editGoalTimeframe: Goal;
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
  reopenGoal: Goal;
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


export type RootMutationTypeCreateGoalDiscussionArgs = {
  input: CreateGoalDiscussionInput;
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


export type RootMutationTypeEditGoalDiscussionArgs = {
  input: EditGoalDiscussionInput;
};


export type RootMutationTypeEditGoalTimeframeArgs = {
  input: EditGoalTimeframeInput;
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


export type RootMutationTypeReopenGoalArgs = {
  input: ReopenGoalInput;
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
  activity: Activity;
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
  actions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  scopeId: Scalars['String']['input'];
  scopeType: Scalars['String']['input'];
};


export type RootQueryTypeActivityArgs = {
  id: Scalars['ID']['input'];
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

export type Timeframe = {
  __typename?: 'Timeframe';
  endDate: Scalars['Date']['output'];
  startDate: Scalars['Date']['output'];
  type: Scalars['String']['output'];
};

export type TimeframeInput = {
  endDate: Scalars['Date']['input'];
  startDate: Scalars['Date']['input'];
  type: Scalars['String']['input'];
};

export type Update = {
  __typename?: 'Update';
  acknowledged: Scalars['Boolean']['output'];
  acknowledgedAt?: Maybe<Scalars['NaiveDateTime']['output']>;
  acknowledgingPerson?: Maybe<Person>;
  author?: Maybe<Person>;
  comments?: Maybe<Array<Maybe<Comment>>>;
  commentsCount: Scalars['Int']['output'];
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
  from?: Maybe<Scalars['Float']['output']>;
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
  timezone?: InputMaybe<Scalars['String']['input']>;
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
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

export type CreateGoalDiscussionMutationVariables = Exact<{
  input: CreateGoalDiscussionInput;
}>;


export type CreateGoalDiscussionMutation = { __typename?: 'RootMutationType', createGoalDiscussion: { __typename?: 'Activity', id: string } };

export type EditGoalDiscussionMutationVariables = Exact<{
  input: EditGoalDiscussionInput;
}>;


export type EditGoalDiscussionMutation = { __typename?: 'RootMutationType', editGoalDiscussion: { __typename?: 'Goal', id: string } };

export type EditGoalTimeframeMutationVariables = Exact<{
  input: EditGoalTimeframeInput;
}>;


export type EditGoalTimeframeMutation = { __typename?: 'RootMutationType', editGoalTimeframe: { __typename?: 'Goal', id: string } };

export type GetActivitiesQueryVariables = Exact<{
  scopeType: Scalars['String']['input'];
  scopeId: Scalars['String']['input'];
  actions?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type GetActivitiesQuery = { __typename?: 'RootQueryType', activities?: Array<{ __typename?: 'Activity', id: string, insertedAt: any, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null }, commentThread?: { __typename?: 'CommentThread', id: string, message: string, title?: string | null, commentsCount: number, reactions: Array<{ __typename?: 'Reaction', id: string, emoji: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null } } | null>, comments: Array<{ __typename?: 'Comment', id: string, content: string, insertedAt: any, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null }, reactions: Array<{ __typename?: 'Reaction', id: string, emoji: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null } } | null> } | null> } | null, content: { __typename: 'ActivityContentCommentAdded' } | { __typename: 'ActivityContentDiscussionCommentSubmitted' } | { __typename: 'ActivityContentDiscussionEditing' } | { __typename: 'ActivityContentDiscussionPosting' } | { __typename: 'ActivityContentGoalArchived' } | { __typename: 'ActivityContentGoalCheckIn', goal: { __typename?: 'Goal', id: string, name: string }, update: { __typename?: 'Update', id: string, title?: string | null, message: string, messageType: string, updatableId: string, insertedAt: any, commentsCount: number, content?: { __typename: 'UpdateContentGoalCheckIn', message: string, targets?: Array<{ __typename?: 'UpdateContentGoalCheckInTarget', id: string, name: string, value: number, previousValue: number, unit: string, from?: number | null, to: number } | null> | null } | { __typename: 'UpdateContentMessage' } | { __typename: 'UpdateContentProjectContributorAdded' } | { __typename: 'UpdateContentProjectContributorRemoved' } | { __typename: 'UpdateContentProjectCreated' } | { __typename: 'UpdateContentProjectDiscussion' } | { __typename: 'UpdateContentProjectEndTimeChanged' } | { __typename: 'UpdateContentProjectMilestoneCompleted' } | { __typename: 'UpdateContentProjectMilestoneCreated' } | { __typename: 'UpdateContentProjectMilestoneDeadlineChanged' } | { __typename: 'UpdateContentProjectMilestoneDeleted' } | { __typename: 'UpdateContentProjectStartTimeChanged' } | { __typename: 'UpdateContentReview' } | { __typename: 'UpdateContentStatusUpdate' } | null } } | { __typename: 'ActivityContentGoalCheckInAcknowledgement' } | { __typename: 'ActivityContentGoalCheckInEdit' } | { __typename: 'ActivityContentGoalClosing', success?: string | null, goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalCreated' } | { __typename: 'ActivityContentGoalDiscussionCreation', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalDiscussionEditing' } | { __typename: 'ActivityContentGoalEditing' } | { __typename: 'ActivityContentGoalReopening', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalReparent' } | { __typename: 'ActivityContentGoalTimeframeEditing', goal: { __typename?: 'Goal', id: string, name: string }, oldTimeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string }, newTimeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string } } | { __typename: 'ActivityContentGroupEdited' } | { __typename: 'ActivityContentProjectArchived' } | { __typename: 'ActivityContentProjectCheckInAcknowledged' } | { __typename: 'ActivityContentProjectCheckInCommented' } | { __typename: 'ActivityContentProjectCheckInEdit' } | { __typename: 'ActivityContentProjectCheckInSubmitted' } | { __typename: 'ActivityContentProjectClosed' } | { __typename: 'ActivityContentProjectContributorAddition' } | { __typename: 'ActivityContentProjectCreated' } | { __typename: 'ActivityContentProjectDiscussionSubmitted' } | { __typename: 'ActivityContentProjectGoalConnection' } | { __typename: 'ActivityContentProjectGoalDisconnection' } | { __typename: 'ActivityContentProjectMilestoneCommented' } | { __typename: 'ActivityContentProjectMoved' } | { __typename: 'ActivityContentProjectPausing' } | { __typename: 'ActivityContentProjectRenamed' } | { __typename: 'ActivityContentProjectResuming' } | { __typename: 'ActivityContentProjectReviewAcknowledged' } | { __typename: 'ActivityContentProjectReviewCommented' } | { __typename: 'ActivityContentProjectReviewRequestSubmitted' } | { __typename: 'ActivityContentProjectReviewSubmitted' } | { __typename: 'ActivityContentProjectTimelineEdited' } | { __typename: 'ActivityContentSpaceJoining' } | { __typename: 'ActivityContentTaskAdding' } | { __typename: 'ActivityContentTaskAssigneeAssignment' } | { __typename: 'ActivityContentTaskClosing' } | { __typename: 'ActivityContentTaskDescriptionChange' } | { __typename: 'ActivityContentTaskNameEditing' } | { __typename: 'ActivityContentTaskPriorityChange' } | { __typename: 'ActivityContentTaskReopening' } | { __typename: 'ActivityContentTaskSizeChange' } | { __typename: 'ActivityContentTaskStatusChange' } | { __typename: 'ActivityContentTaskUpdate' } } | null> | null };

export type GetActivityQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetActivityQuery = { __typename?: 'RootQueryType', activity: { __typename?: 'Activity', id: string, insertedAt: any, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null }, commentThread?: { __typename?: 'CommentThread', id: string, message: string, title?: string | null, reactions: Array<{ __typename?: 'Reaction', id: string, emoji: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null } } | null>, comments: Array<{ __typename?: 'Comment', id: string, content: string, insertedAt: any, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null }, reactions: Array<{ __typename?: 'Reaction', id: string, emoji: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null } } | null> } | null> } | null, content: { __typename: 'ActivityContentCommentAdded' } | { __typename: 'ActivityContentDiscussionCommentSubmitted' } | { __typename: 'ActivityContentDiscussionEditing' } | { __typename: 'ActivityContentDiscussionPosting' } | { __typename: 'ActivityContentGoalArchived' } | { __typename: 'ActivityContentGoalCheckIn' } | { __typename: 'ActivityContentGoalCheckInAcknowledgement' } | { __typename: 'ActivityContentGoalCheckInEdit' } | { __typename: 'ActivityContentGoalClosing', success?: string | null, goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalCreated' } | { __typename: 'ActivityContentGoalDiscussionCreation', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalDiscussionEditing' } | { __typename: 'ActivityContentGoalEditing' } | { __typename: 'ActivityContentGoalReopening' } | { __typename: 'ActivityContentGoalReparent' } | { __typename: 'ActivityContentGoalTimeframeEditing', goal: { __typename?: 'Goal', id: string, name: string }, oldTimeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string }, newTimeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string } } | { __typename: 'ActivityContentGroupEdited' } | { __typename: 'ActivityContentProjectArchived' } | { __typename: 'ActivityContentProjectCheckInAcknowledged' } | { __typename: 'ActivityContentProjectCheckInCommented' } | { __typename: 'ActivityContentProjectCheckInEdit' } | { __typename: 'ActivityContentProjectCheckInSubmitted' } | { __typename: 'ActivityContentProjectClosed' } | { __typename: 'ActivityContentProjectContributorAddition' } | { __typename: 'ActivityContentProjectCreated' } | { __typename: 'ActivityContentProjectDiscussionSubmitted' } | { __typename: 'ActivityContentProjectGoalConnection' } | { __typename: 'ActivityContentProjectGoalDisconnection' } | { __typename: 'ActivityContentProjectMilestoneCommented' } | { __typename: 'ActivityContentProjectMoved' } | { __typename: 'ActivityContentProjectPausing' } | { __typename: 'ActivityContentProjectRenamed' } | { __typename: 'ActivityContentProjectResuming' } | { __typename: 'ActivityContentProjectReviewAcknowledged' } | { __typename: 'ActivityContentProjectReviewCommented' } | { __typename: 'ActivityContentProjectReviewRequestSubmitted' } | { __typename: 'ActivityContentProjectReviewSubmitted' } | { __typename: 'ActivityContentProjectTimelineEdited' } | { __typename: 'ActivityContentSpaceJoining' } | { __typename: 'ActivityContentTaskAdding' } | { __typename: 'ActivityContentTaskAssigneeAssignment' } | { __typename: 'ActivityContentTaskClosing' } | { __typename: 'ActivityContentTaskDescriptionChange' } | { __typename: 'ActivityContentTaskNameEditing' } | { __typename: 'ActivityContentTaskPriorityChange' } | { __typename: 'ActivityContentTaskReopening' } | { __typename: 'ActivityContentTaskSizeChange' } | { __typename: 'ActivityContentTaskStatusChange' } | { __typename: 'ActivityContentTaskUpdate' } } };

export type GetGoalQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  includeTargets?: InputMaybe<Scalars['Boolean']['input']>;
  includeProjects?: InputMaybe<Scalars['Boolean']['input']>;
  includeLastCheckIn?: InputMaybe<Scalars['Boolean']['input']>;
  includeParentGoal?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetGoalQuery = { __typename?: 'RootQueryType', goal: { __typename?: 'Goal', id: string, name: string, isArchived: boolean, isClosed: boolean, closedAt?: any | null, progressPercentage: number, archivedAt?: any | null, description?: string | null, nextUpdateScheduledAt?: any | null, parentGoalId?: string | null, timeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string }, closedBy?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, parentGoal?: { __typename?: 'Goal', id: string, name: string } | null, space: { __typename?: 'Group', id: string, name: string, icon: string, color: string }, permissions: { __typename?: 'GoalPermissions', canEdit: boolean, canCheckIn: boolean, canAcknowledgeCheckIn: boolean, canClose: boolean, canArchive: boolean }, champion?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, reviewer?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, targets?: Array<{ __typename?: 'Target', id: string, name: string, from: number, to: number, unit: string, value: number } | null> | null, projects?: Array<{ __typename?: 'Project', id: string, name: string, status?: string | null, closedAt?: any | null, archivedAt?: any | null, lastCheckIn?: { __typename?: 'ProjectCheckIn', id: string, status: string } | null, contributors?: Array<{ __typename?: 'ProjectContributor', id: string, responsibility?: string | null, role: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } } | null> | null, nextMilestone?: { __typename?: 'Milestone', id: string, title: string, deadlineAt?: any | null, status: string } | null, milestones?: Array<{ __typename?: 'Milestone', id: string, title: string, deadlineAt?: any | null, status: string } | null> | null } | null> | null, lastCheckIn?: { __typename?: 'Update', id: string, insertedAt: any, acknowledged: boolean, acknowledgedAt?: any | null, commentsCount: number, author?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, content?: { __typename: 'UpdateContentGoalCheckIn', message: string } | { __typename: 'UpdateContentMessage' } | { __typename: 'UpdateContentProjectContributorAdded' } | { __typename: 'UpdateContentProjectContributorRemoved' } | { __typename: 'UpdateContentProjectCreated' } | { __typename: 'UpdateContentProjectDiscussion' } | { __typename: 'UpdateContentProjectEndTimeChanged' } | { __typename: 'UpdateContentProjectMilestoneCompleted' } | { __typename: 'UpdateContentProjectMilestoneCreated' } | { __typename: 'UpdateContentProjectMilestoneDeadlineChanged' } | { __typename: 'UpdateContentProjectMilestoneDeleted' } | { __typename: 'UpdateContentProjectStartTimeChanged' } | { __typename: 'UpdateContentReview' } | { __typename: 'UpdateContentStatusUpdate' } | null, acknowledgingPerson?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, reactions?: Array<{ __typename?: 'Reaction', id: string, emoji: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } } | null> | null } | null } };

export type GetGoalsQueryVariables = Exact<{
  spaceId?: InputMaybe<Scalars['ID']['input']>;
  includeTargets?: InputMaybe<Scalars['Boolean']['input']>;
  includeSpace?: InputMaybe<Scalars['Boolean']['input']>;
  includeProjects?: InputMaybe<Scalars['Boolean']['input']>;
  includeLastCheckIn?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetGoalsQuery = { __typename?: 'RootQueryType', goals?: Array<{ __typename?: 'Goal', id: string, name: string, insertedAt: any, updatedAt: any, isArchived: boolean, isClosed: boolean, parentGoalId?: string | null, progressPercentage: number, timeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string }, space: { __typename?: 'Group', id: string, name: string, isCompanySpace: boolean }, champion?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, reviewer?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, projects?: Array<{ __typename?: 'Project', id: string, name: string, status?: string | null, startedAt?: any | null, deadline?: any | null, closedAt?: any | null, space: { __typename?: 'Group', id: string, name: string }, champion?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, lastCheckIn?: { __typename?: 'ProjectCheckIn', id: string, insertedAt: any, status: string, description: string, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } } | null, milestones?: Array<{ __typename?: 'Milestone', id: string, title: string, status: string, deadlineAt?: any | null, completedAt?: any | null } | null> | null } | null> | null, lastCheckIn?: { __typename?: 'Update', id: string, insertedAt: any, author?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, content?: { __typename: 'UpdateContentGoalCheckIn', message: string } | { __typename: 'UpdateContentMessage' } | { __typename: 'UpdateContentProjectContributorAdded' } | { __typename: 'UpdateContentProjectContributorRemoved' } | { __typename: 'UpdateContentProjectCreated' } | { __typename: 'UpdateContentProjectDiscussion' } | { __typename: 'UpdateContentProjectEndTimeChanged' } | { __typename: 'UpdateContentProjectMilestoneCompleted' } | { __typename: 'UpdateContentProjectMilestoneCreated' } | { __typename: 'UpdateContentProjectMilestoneDeadlineChanged' } | { __typename: 'UpdateContentProjectMilestoneDeleted' } | { __typename: 'UpdateContentProjectStartTimeChanged' } | { __typename: 'UpdateContentReview' } | { __typename: 'UpdateContentStatusUpdate' } | null } | null, targets?: Array<{ __typename?: 'Target', id: string, name: string, from: number, to: number, value: number } | null> | null } | null> | null };

export type GetMeQueryVariables = Exact<{
  includeManager?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetMeQuery = { __typename?: 'RootQueryType', me?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null, sendDailySummary: boolean, notifyOnMention: boolean, notifyAboutAssignments: boolean, theme?: string | null, companyRole?: string | null, manager?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null, timezone?: string | null} | null } | null };

export type GetPeopleQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPeopleQuery = { __typename?: 'RootQueryType', people?: Array<{ __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null, managerId?: string | null } | null> | null };

export type GetPersonQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  includeManager?: InputMaybe<Scalars['Boolean']['input']>;
  includeReports?: InputMaybe<Scalars['Boolean']['input']>;
  includePeers?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetPersonQuery = { __typename?: 'RootQueryType', person?: { __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null, email?: string | null, suspended: boolean, manager?: { __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null } | null, reports?: Array<{ __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null } | null> | null, peers?: Array<{ __typename?: 'Person', id: string, fullName: string, title?: string | null, avatarUrl?: string | null, timezone?: string | null } | null> | null } | null };

export type GetProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  includeGoal?: InputMaybe<Scalars['Boolean']['input']>;
  includeReviewer?: InputMaybe<Scalars['Boolean']['input']>;
  includeContributors?: InputMaybe<Scalars['Boolean']['input']>;
  includePermissions?: InputMaybe<Scalars['Boolean']['input']>;
  includeSpace?: InputMaybe<Scalars['Boolean']['input']>;
  includeKeyResources?: InputMaybe<Scalars['Boolean']['input']>;
  includeMilestones?: InputMaybe<Scalars['Boolean']['input']>;
  includeLastCheckIn?: InputMaybe<Scalars['Boolean']['input']>;
  includeRetrospective?: InputMaybe<Scalars['Boolean']['input']>;
  includeClosedBy?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetProjectQuery = { __typename?: 'RootQueryType', project?: { __typename?: 'Project', id: string, name: string, description?: string | null, insertedAt: any, startedAt?: any | null, deadline?: any | null, nextCheckInScheduledAt?: any | null, isArchived: boolean, isOutdated: boolean, archivedAt?: any | null, private: boolean, status?: string | null, closedAt?: any | null, retrospective?: string | null, space?: { __typename?: 'Group', id: string, name: string, color: string, icon: string }, lastCheckIn?: { __typename?: 'ProjectCheckIn', id: string, description: string, status: string, insertedAt: any, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } } | null, milestones?: Array<{ __typename?: 'Milestone', id: string, title: string, status: string, deadlineAt?: any | null, completedAt?: any | null, description?: string | null, insertedAt?: any | null } | null> | null, keyResources?: Array<{ __typename?: 'ProjectKeyResource', id: string, title: string, link: string, resourceType: string } | null> | null, permissions?: { __typename?: 'ProjectPermissions', canView: boolean, canCreateMilestone: boolean, canDeleteMilestone: boolean, canEditName: boolean, canEditMilestone: boolean, canEditDescription: boolean, canEditContributors: boolean, canEditTimeline: boolean, canEditResources: boolean, canEditGoal: boolean, canEditSpace: boolean, canPause: boolean, canCheckIn: boolean, canAcknowledgeCheckIn: boolean }, goal?: { __typename?: 'Goal', id: string, name: string, targets?: Array<{ __typename?: 'Target', id: string, name: string, from: number, to: number, value: number } | null> | null, champion?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, reviewer?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null } | null, reviewer?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, contributors?: Array<{ __typename?: 'ProjectContributor', id: string, role: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } } | null> | null, closedBy?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null } | null };

export type GetProjectsQueryVariables = Exact<{
  filters?: InputMaybe<ProjectListFilters>;
  includeSpace?: InputMaybe<Scalars['Boolean']['input']>;
  includeMilestones?: InputMaybe<Scalars['Boolean']['input']>;
  includeContributors?: InputMaybe<Scalars['Boolean']['input']>;
  includeLastCheckIn?: InputMaybe<Scalars['Boolean']['input']>;
  includeChampion?: InputMaybe<Scalars['Boolean']['input']>;
  includeGoal?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetProjectsQuery = { __typename?: 'RootQueryType', projects?: Array<{ __typename?: 'Project', id: string, name: string, private: boolean, insertedAt: any, updatedAt: any, startedAt?: any | null, closedAt?: any | null, deadline?: any | null, isArchived: boolean, isOutdated: boolean, status?: string | null, goal?: { __typename?: 'Goal', id: string, name: string } | null, champion?: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } | null, contributors?: Array<{ __typename?: 'ProjectContributor', id: string, role: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null, title?: string | null } } | null> | null, space?: { __typename?: 'Group', id: string, name: string }, nextMilestone?: { __typename?: 'Milestone', id: string, title: string, status: string, insertedAt?: any | null, deadlineAt?: any | null } | null, milestones?: Array<{ __typename?: 'Milestone', id: string, title: string, status: string, insertedAt?: any | null, deadlineAt?: any | null } | null> | null, lastCheckIn?: { __typename?: 'ProjectCheckIn', id: string, status: string, description: string, insertedAt: any, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null } } | null } | null> | null };

export type ListNotificationsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListNotificationsQuery = { __typename?: 'RootQueryType', notifications?: Array<{ __typename?: 'Notification', id: string, read: boolean, activity: { __typename?: 'Activity', id: string, insertedAt: any, author: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null }, commentThread?: { __typename?: 'CommentThread', id: string, message: string, title?: string | null, commentsCount: number, reactions: Array<{ __typename?: 'Reaction', id: string, emoji: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null } } | null> } | null, content: { __typename: 'ActivityContentCommentAdded', activity?: { __typename?: 'Activity', id: string, commentThread?: { __typename?: 'CommentThread', id: string, message: string, title?: string | null, commentsCount: number, reactions: Array<{ __typename?: 'Reaction', id: string, emoji: string, person: { __typename?: 'Person', id: string, fullName: string, avatarUrl?: string | null } } | null> } | null, content: { __typename: 'ActivityContentCommentAdded' } | { __typename: 'ActivityContentDiscussionCommentSubmitted' } | { __typename: 'ActivityContentDiscussionEditing' } | { __typename: 'ActivityContentDiscussionPosting' } | { __typename: 'ActivityContentGoalArchived' } | { __typename: 'ActivityContentGoalCheckIn' } | { __typename: 'ActivityContentGoalCheckInAcknowledgement' } | { __typename: 'ActivityContentGoalCheckInEdit' } | { __typename: 'ActivityContentGoalClosing', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalCreated' } | { __typename: 'ActivityContentGoalDiscussionCreation', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalDiscussionEditing' } | { __typename: 'ActivityContentGoalEditing' } | { __typename: 'ActivityContentGoalReopening' } | { __typename: 'ActivityContentGoalReparent' } | { __typename: 'ActivityContentGoalTimeframeEditing', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGroupEdited' } | { __typename: 'ActivityContentProjectArchived' } | { __typename: 'ActivityContentProjectCheckInAcknowledged' } | { __typename: 'ActivityContentProjectCheckInCommented' } | { __typename: 'ActivityContentProjectCheckInEdit' } | { __typename: 'ActivityContentProjectCheckInSubmitted' } | { __typename: 'ActivityContentProjectClosed' } | { __typename: 'ActivityContentProjectContributorAddition' } | { __typename: 'ActivityContentProjectCreated' } | { __typename: 'ActivityContentProjectDiscussionSubmitted' } | { __typename: 'ActivityContentProjectGoalConnection' } | { __typename: 'ActivityContentProjectGoalDisconnection' } | { __typename: 'ActivityContentProjectMilestoneCommented' } | { __typename: 'ActivityContentProjectMoved' } | { __typename: 'ActivityContentProjectPausing' } | { __typename: 'ActivityContentProjectRenamed' } | { __typename: 'ActivityContentProjectResuming' } | { __typename: 'ActivityContentProjectReviewAcknowledged' } | { __typename: 'ActivityContentProjectReviewCommented' } | { __typename: 'ActivityContentProjectReviewRequestSubmitted' } | { __typename: 'ActivityContentProjectReviewSubmitted' } | { __typename: 'ActivityContentProjectTimelineEdited' } | { __typename: 'ActivityContentSpaceJoining' } | { __typename: 'ActivityContentTaskAdding' } | { __typename: 'ActivityContentTaskAssigneeAssignment' } | { __typename: 'ActivityContentTaskClosing' } | { __typename: 'ActivityContentTaskDescriptionChange' } | { __typename: 'ActivityContentTaskNameEditing' } | { __typename: 'ActivityContentTaskPriorityChange' } | { __typename: 'ActivityContentTaskReopening' } | { __typename: 'ActivityContentTaskSizeChange' } | { __typename: 'ActivityContentTaskStatusChange' } | { __typename: 'ActivityContentTaskUpdate' } } | null } | { __typename: 'ActivityContentDiscussionCommentSubmitted', discussionId: string, title: string, space: { __typename?: 'Group', id: string, name: string } } | { __typename: 'ActivityContentDiscussionEditing' } | { __typename: 'ActivityContentDiscussionPosting', title: string, discussionId: string, space: { __typename?: 'Group', id: string, name: string, icon: string, color: string } } | { __typename: 'ActivityContentGoalArchived', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalCheckIn', goal: { __typename?: 'Goal', id: string, name: string }, update: { __typename?: 'Update', id: string } } | { __typename: 'ActivityContentGoalCheckInAcknowledgement', goal: { __typename?: 'Goal', id: string, name: string }, update: { __typename?: 'Update', id: string } } | { __typename: 'ActivityContentGoalCheckInEdit' } | { __typename: 'ActivityContentGoalClosing', success?: string | null, goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalCreated', goal: { __typename?: 'Goal', id: string, name: string, myRole?: string | null } } | { __typename: 'ActivityContentGoalDiscussionCreation', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalDiscussionEditing' } | { __typename: 'ActivityContentGoalEditing', goalId: string, oldName: string, newName: string, oldChampionId: string, newChampionId: string, oldReviewerId: string, newReviewerId: string, oldTimeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string }, newTimeframe: { __typename?: 'Timeframe', startDate: any, endDate: any, type: string }, addedTargets: Array<{ __typename?: 'Target', id: string } | null>, updatedTargets: Array<{ __typename?: 'GoalEditingUpdatedTarget', id: string } | null>, deletedTargets: Array<{ __typename?: 'Target', id: string } | null> } | { __typename: 'ActivityContentGoalReopening', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGoalReparent' } | { __typename: 'ActivityContentGoalTimeframeEditing', goal: { __typename?: 'Goal', id: string, name: string } } | { __typename: 'ActivityContentGroupEdited' } | { __typename: 'ActivityContentProjectArchived', project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectCheckInAcknowledged', projectId: string, checkInId: string, project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectCheckInCommented', projectId: string, checkInId: string, project: { __typename?: 'Project', name: string } } | { __typename: 'ActivityContentProjectCheckInEdit' } | { __typename: 'ActivityContentProjectCheckInSubmitted', project: { __typename?: 'Project', id: string, name: string }, checkIn: { __typename?: 'ProjectCheckIn', id: string, insertedAt: any, status: string, description: string } } | { __typename: 'ActivityContentProjectClosed', project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectContributorAddition', project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectCreated', project: { __typename?: 'Project', id: string, name: string, myRole?: string | null } } | { __typename: 'ActivityContentProjectDiscussionSubmitted', title: string, discussionId: string, projectId: string, project: { __typename?: 'Project', name: string } } | { __typename: 'ActivityContentProjectGoalConnection', goal: { __typename?: 'Goal', id: string, name: string }, project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectGoalDisconnection', goal: { __typename?: 'Goal', id: string, name: string }, project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectMilestoneCommented', commentAction: string, milestone: { __typename?: 'Milestone', id: string, title: string }, project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectMoved', project: { __typename?: 'Project', id: string, name: string }, oldSpace: { __typename?: 'Group', id: string, name: string }, newSpace: { __typename?: 'Group', id: string, name: string } } | { __typename: 'ActivityContentProjectPausing', project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectRenamed' } | { __typename: 'ActivityContentProjectResuming', project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectReviewAcknowledged', projectId: string, reviewId: string, project: { __typename?: 'Project', name: string } } | { __typename: 'ActivityContentProjectReviewCommented', projectId: string, reviewId: string, project: { __typename?: 'Project', name: string } } | { __typename: 'ActivityContentProjectReviewRequestSubmitted', requestId: string, project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectReviewSubmitted', reviewId: string, project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentProjectTimelineEdited', project: { __typename?: 'Project', id: string, name: string } } | { __typename: 'ActivityContentSpaceJoining' } | { __typename: 'ActivityContentTaskAdding' } | { __typename: 'ActivityContentTaskAssigneeAssignment' } | { __typename: 'ActivityContentTaskClosing' } | { __typename: 'ActivityContentTaskDescriptionChange' } | { __typename: 'ActivityContentTaskNameEditing' } | { __typename: 'ActivityContentTaskPriorityChange' } | { __typename: 'ActivityContentTaskReopening' } | { __typename: 'ActivityContentTaskSizeChange' } | { __typename: 'ActivityContentTaskStatusChange' } | { __typename: 'ActivityContentTaskUpdate' } } }> | null };

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
export const CreateGoalDiscussionDocument = gql`
    mutation CreateGoalDiscussion($input: CreateGoalDiscussionInput!) {
  createGoalDiscussion(input: $input) {
    id
  }
}
    `;
export type CreateGoalDiscussionMutationFn = Apollo.MutationFunction<CreateGoalDiscussionMutation, CreateGoalDiscussionMutationVariables>;

/**
 * __useCreateGoalDiscussionMutation__
 *
 * To run a mutation, you first call `useCreateGoalDiscussionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateGoalDiscussionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createGoalDiscussionMutation, { data, loading, error }] = useCreateGoalDiscussionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateGoalDiscussionMutation(baseOptions?: Apollo.MutationHookOptions<CreateGoalDiscussionMutation, CreateGoalDiscussionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateGoalDiscussionMutation, CreateGoalDiscussionMutationVariables>(CreateGoalDiscussionDocument, options);
      }
export type CreateGoalDiscussionMutationHookResult = ReturnType<typeof useCreateGoalDiscussionMutation>;
export type CreateGoalDiscussionMutationResult = Apollo.MutationResult<CreateGoalDiscussionMutation>;
export type CreateGoalDiscussionMutationOptions = Apollo.BaseMutationOptions<CreateGoalDiscussionMutation, CreateGoalDiscussionMutationVariables>;
export const EditGoalDiscussionDocument = gql`
    mutation EditGoalDiscussion($input: EditGoalDiscussionInput!) {
  editGoalDiscussion(input: $input) {
    id
  }
}
    `;
export type EditGoalDiscussionMutationFn = Apollo.MutationFunction<EditGoalDiscussionMutation, EditGoalDiscussionMutationVariables>;

/**
 * __useEditGoalDiscussionMutation__
 *
 * To run a mutation, you first call `useEditGoalDiscussionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEditGoalDiscussionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [editGoalDiscussionMutation, { data, loading, error }] = useEditGoalDiscussionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEditGoalDiscussionMutation(baseOptions?: Apollo.MutationHookOptions<EditGoalDiscussionMutation, EditGoalDiscussionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<EditGoalDiscussionMutation, EditGoalDiscussionMutationVariables>(EditGoalDiscussionDocument, options);
      }
export type EditGoalDiscussionMutationHookResult = ReturnType<typeof useEditGoalDiscussionMutation>;
export type EditGoalDiscussionMutationResult = Apollo.MutationResult<EditGoalDiscussionMutation>;
export type EditGoalDiscussionMutationOptions = Apollo.BaseMutationOptions<EditGoalDiscussionMutation, EditGoalDiscussionMutationVariables>;
export const EditGoalTimeframeDocument = gql`
    mutation EditGoalTimeframe($input: EditGoalTimeframeInput!) {
  editGoalTimeframe(input: $input) {
    id
  }
}
    `;
export type EditGoalTimeframeMutationFn = Apollo.MutationFunction<EditGoalTimeframeMutation, EditGoalTimeframeMutationVariables>;

/**
 * __useEditGoalTimeframeMutation__
 *
 * To run a mutation, you first call `useEditGoalTimeframeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEditGoalTimeframeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [editGoalTimeframeMutation, { data, loading, error }] = useEditGoalTimeframeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEditGoalTimeframeMutation(baseOptions?: Apollo.MutationHookOptions<EditGoalTimeframeMutation, EditGoalTimeframeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<EditGoalTimeframeMutation, EditGoalTimeframeMutationVariables>(EditGoalTimeframeDocument, options);
      }
export type EditGoalTimeframeMutationHookResult = ReturnType<typeof useEditGoalTimeframeMutation>;
export type EditGoalTimeframeMutationResult = Apollo.MutationResult<EditGoalTimeframeMutation>;
export type EditGoalTimeframeMutationOptions = Apollo.BaseMutationOptions<EditGoalTimeframeMutation, EditGoalTimeframeMutationVariables>;
export const GetActivitiesDocument = gql`
    query GetActivities($scopeType: String!, $scopeId: String!, $actions: [String!]) {
  activities(scopeType: $scopeType, scopeId: $scopeId, actions: $actions) {
    id
    insertedAt
    author {
      id
      fullName
      avatarUrl
    }
    commentThread {
      id
      message
      title
      commentsCount
      reactions {
        id
        emoji
        person {
          id
          fullName
          avatarUrl
        }
      }
      comments {
        id
        content
        insertedAt
        author {
          id
          fullName
          avatarUrl
        }
        reactions {
          id
          emoji
          person {
            id
            fullName
            avatarUrl
          }
        }
      }
    }
    content {
      __typename
      ... on ActivityContentGoalTimeframeEditing {
        goal {
          id
          name
        }
        oldTimeframe {
          startDate
          endDate
          type
        }
        newTimeframe {
          startDate
          endDate
          type
        }
      }
      ... on ActivityContentGoalClosing {
        success
        goal {
          id
          name
        }
      }
      ... on ActivityContentGoalReopening {
        goal {
          id
          name
        }
      }
      ... on ActivityContentGoalDiscussionCreation {
        goal {
          id
          name
        }
      }
      ... on ActivityContentGoalCheckIn {
        goal {
          id
          name
        }
        update {
          id
          title
          message
          messageType
          updatableId
          insertedAt
          commentsCount
          content {
            __typename
            ... on UpdateContentGoalCheckIn {
              message
              targets {
                id
                name
                value
                previousValue
                unit
                from
                to
              }
            }
          }
        }
      }
    }
  }
}
    `;

/**
 * __useGetActivitiesQuery__
 *
 * To run a query within a React component, call `useGetActivitiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActivitiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActivitiesQuery({
 *   variables: {
 *      scopeType: // value for 'scopeType'
 *      scopeId: // value for 'scopeId'
 *      actions: // value for 'actions'
 *   },
 * });
 */
export function useGetActivitiesQuery(baseOptions: Apollo.QueryHookOptions<GetActivitiesQuery, GetActivitiesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetActivitiesQuery, GetActivitiesQueryVariables>(GetActivitiesDocument, options);
      }
export function useGetActivitiesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetActivitiesQuery, GetActivitiesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetActivitiesQuery, GetActivitiesQueryVariables>(GetActivitiesDocument, options);
        }
export type GetActivitiesQueryHookResult = ReturnType<typeof useGetActivitiesQuery>;
export type GetActivitiesLazyQueryHookResult = ReturnType<typeof useGetActivitiesLazyQuery>;
export type GetActivitiesQueryResult = Apollo.QueryResult<GetActivitiesQuery, GetActivitiesQueryVariables>;
export const GetActivityDocument = gql`
    query GetActivity($id: ID!) {
  activity(id: $id) {
    id
    insertedAt
    author {
      id
      fullName
      avatarUrl
    }
    commentThread {
      id
      message
      title
      reactions {
        id
        emoji
        person {
          id
          fullName
          avatarUrl
        }
      }
      comments {
        id
        content
        insertedAt
        author {
          id
          fullName
          avatarUrl
        }
        reactions {
          id
          emoji
          person {
            id
            fullName
            avatarUrl
          }
        }
      }
    }
    content {
      __typename
      ... on ActivityContentGoalTimeframeEditing {
        goal {
          id
          name
        }
        oldTimeframe {
          startDate
          endDate
          type
        }
        newTimeframe {
          startDate
          endDate
          type
        }
      }
      ... on ActivityContentGoalClosing {
        success
        goal {
          id
          name
        }
      }
      ... on ActivityContentGoalDiscussionCreation {
        goal {
          id
          name
        }
      }
    }
  }
}
    `;

/**
 * __useGetActivityQuery__
 *
 * To run a query within a React component, call `useGetActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActivityQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetActivityQuery(baseOptions: Apollo.QueryHookOptions<GetActivityQuery, GetActivityQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetActivityQuery, GetActivityQueryVariables>(GetActivityDocument, options);
      }
export function useGetActivityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetActivityQuery, GetActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetActivityQuery, GetActivityQueryVariables>(GetActivityDocument, options);
        }
export type GetActivityQueryHookResult = ReturnType<typeof useGetActivityQuery>;
export type GetActivityLazyQueryHookResult = ReturnType<typeof useGetActivityLazyQuery>;
export type GetActivityQueryResult = Apollo.QueryResult<GetActivityQuery, GetActivityQueryVariables>;
export const GetGoalDocument = gql`
    query GetGoal($id: ID!, $includeTargets: Boolean = false, $includeProjects: Boolean = false, $includeLastCheckIn: Boolean = false, $includeParentGoal: Boolean = false) {
  goal(id: $id) {
    id
    name
    isArchived
    isClosed
    closedAt
    progressPercentage
    timeframe {
      startDate
      endDate
      type
    }
    closedBy {
      id
      fullName
      avatarUrl
      title
    }
    archivedAt
    description
    nextUpdateScheduledAt
    parentGoalId
    parentGoal @include(if: $includeParentGoal) {
      id
      name
    }
    space {
      id
      name
      icon
      color
    }
    permissions {
      canEdit
      canCheckIn
      canAcknowledgeCheckIn
      canClose
      canArchive
    }
    champion {
      id
      fullName
      avatarUrl
      title
    }
    reviewer {
      id
      fullName
      avatarUrl
      title
    }
    targets @include(if: $includeTargets) {
      id
      name
      from
      to
      unit
      value
    }
    projects @include(if: $includeProjects) {
      id
      name
      status
      closedAt
      archivedAt
      lastCheckIn {
        id
        status
      }
      contributors {
        id
        responsibility
        role
        person {
          id
          fullName
          avatarUrl
          title
        }
      }
      nextMilestone {
        id
        title
        deadlineAt
        status
      }
      milestones {
        id
        title
        deadlineAt
        status
      }
    }
    lastCheckIn @include(if: $includeLastCheckIn) {
      id
      insertedAt
      author {
        id
        fullName
        avatarUrl
        title
      }
      content {
        __typename
        ... on UpdateContentGoalCheckIn {
          message
        }
      }
      acknowledged
      acknowledgedAt
      acknowledgingPerson {
        id
        fullName
        avatarUrl
        title
      }
      reactions {
        id
        emoji
        person {
          id
          fullName
          avatarUrl
          title
        }
      }
      commentsCount
    }
  }
}
    `;

/**
 * __useGetGoalQuery__
 *
 * To run a query within a React component, call `useGetGoalQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGoalQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGoalQuery({
 *   variables: {
 *      id: // value for 'id'
 *      includeTargets: // value for 'includeTargets'
 *      includeProjects: // value for 'includeProjects'
 *      includeLastCheckIn: // value for 'includeLastCheckIn'
 *      includeParentGoal: // value for 'includeParentGoal'
 *   },
 * });
 */
export function useGetGoalQuery(baseOptions: Apollo.QueryHookOptions<GetGoalQuery, GetGoalQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGoalQuery, GetGoalQueryVariables>(GetGoalDocument, options);
      }
export function useGetGoalLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGoalQuery, GetGoalQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGoalQuery, GetGoalQueryVariables>(GetGoalDocument, options);
        }
export type GetGoalQueryHookResult = ReturnType<typeof useGetGoalQuery>;
export type GetGoalLazyQueryHookResult = ReturnType<typeof useGetGoalLazyQuery>;
export type GetGoalQueryResult = Apollo.QueryResult<GetGoalQuery, GetGoalQueryVariables>;
export const GetGoalsDocument = gql`
    query GetGoals($spaceId: ID, $includeTargets: Boolean = false, $includeSpace: Boolean = false, $includeProjects: Boolean = false, $includeLastCheckIn: Boolean = false) {
  goals(spaceId: $spaceId) {
    id
    name
    insertedAt
    updatedAt
    isArchived
    isClosed
    parentGoalId
    progressPercentage
    timeframe {
      startDate
      endDate
      type
    }
    space {
      id
      name
    }
    champion {
      id
      fullName
      avatarUrl
      title
    }
    reviewer {
      id
      fullName
      avatarUrl
      title
    }
    projects @include(if: $includeProjects) {
      id
      name
      status
      startedAt
      deadline
      closedAt
      space {
        id
        name
      }
      champion {
        id
        fullName
        avatarUrl
        title
      }
      lastCheckIn {
        id
        insertedAt
        author {
          id
          fullName
          avatarUrl
          title
        }
        status
        description
      }
      milestones {
        id
        title
        status
        deadlineAt
        completedAt
      }
    }
    lastCheckIn @include(if: $includeLastCheckIn) {
      id
      insertedAt
      author {
        id
        fullName
        avatarUrl
        title
      }
      content {
        __typename
        ... on UpdateContentGoalCheckIn {
          message
        }
      }
    }
    space @include(if: $includeSpace) {
      id
      name
      isCompanySpace
    }
    targets @include(if: $includeTargets) {
      id
      name
      from
      to
      value
    }
  }
}
    `;

/**
 * __useGetGoalsQuery__
 *
 * To run a query within a React component, call `useGetGoalsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGoalsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGoalsQuery({
 *   variables: {
 *      spaceId: // value for 'spaceId'
 *      includeTargets: // value for 'includeTargets'
 *      includeSpace: // value for 'includeSpace'
 *      includeProjects: // value for 'includeProjects'
 *      includeLastCheckIn: // value for 'includeLastCheckIn'
 *   },
 * });
 */
export function useGetGoalsQuery(baseOptions?: Apollo.QueryHookOptions<GetGoalsQuery, GetGoalsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGoalsQuery, GetGoalsQueryVariables>(GetGoalsDocument, options);
      }
export function useGetGoalsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGoalsQuery, GetGoalsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGoalsQuery, GetGoalsQueryVariables>(GetGoalsDocument, options);
        }
export type GetGoalsQueryHookResult = ReturnType<typeof useGetGoalsQuery>;
export type GetGoalsLazyQueryHookResult = ReturnType<typeof useGetGoalsLazyQuery>;
export type GetGoalsQueryResult = Apollo.QueryResult<GetGoalsQuery, GetGoalsQueryVariables>;
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
    timezone
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
    timezone
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
    suspended
    timezone
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
export const GetProjectDocument = gql`
    query GetProject($id: ID!, $includeGoal: Boolean = false, $includeReviewer: Boolean = false, $includeContributors: Boolean = false, $includePermissions: Boolean = false, $includeSpace: Boolean = false, $includeKeyResources: Boolean = false, $includeMilestones: Boolean = false, $includeLastCheckIn: Boolean = false, $includeRetrospective: Boolean = false, $includeClosedBy: Boolean = false) {
  project(id: $id) {
    id
    name
    description
    insertedAt
    startedAt
    deadline
    nextCheckInScheduledAt
    isArchived
    isOutdated
    archivedAt
    private
    status
    closedAt
    retrospective @include(if: $includeRetrospective)
    space @include(if: $includeSpace) {
      id
      name
      color
      icon
    }
    lastCheckIn @include(if: $includeLastCheckIn) {
      id
      description
      status
      insertedAt
      author {
        id
        fullName
        avatarUrl
        title
      }
    }
    milestones @include(if: $includeMilestones) {
      id
      title
      status
      deadlineAt
      completedAt
      description
      insertedAt
    }
    keyResources @include(if: $includeKeyResources) {
      id
      title
      link
      resourceType
    }
    permissions @include(if: $includePermissions) {
      canView
      canCreateMilestone
      canDeleteMilestone
      canEditName
      canEditMilestone
      canEditDescription
      canEditContributors
      canEditTimeline
      canEditResources
      canEditGoal
      canEditSpace
      canPause
      canCheckIn
      canAcknowledgeCheckIn
    }
    goal @include(if: $includeGoal) {
      id
      name
      targets {
        id
        name
        from
        to
        value
      }
      champion {
        id
        fullName
        avatarUrl
        title
      }
      reviewer {
        id
        fullName
        avatarUrl
        title
      }
    }
    reviewer @include(if: $includeReviewer) {
      id
      fullName
      avatarUrl
      title
    }
    contributors @include(if: $includeContributors) {
      id
      role
      person {
        id
        fullName
        avatarUrl
        title
      }
    }
    closedBy @include(if: $includeClosedBy) {
      id
      fullName
      avatarUrl
      title
    }
  }
}
    `;

/**
 * __useGetProjectQuery__
 *
 * To run a query within a React component, call `useGetProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectQuery({
 *   variables: {
 *      id: // value for 'id'
 *      includeGoal: // value for 'includeGoal'
 *      includeReviewer: // value for 'includeReviewer'
 *      includeContributors: // value for 'includeContributors'
 *      includePermissions: // value for 'includePermissions'
 *      includeSpace: // value for 'includeSpace'
 *      includeKeyResources: // value for 'includeKeyResources'
 *      includeMilestones: // value for 'includeMilestones'
 *      includeLastCheckIn: // value for 'includeLastCheckIn'
 *      includeRetrospective: // value for 'includeRetrospective'
 *      includeClosedBy: // value for 'includeClosedBy'
 *   },
 * });
 */
export function useGetProjectQuery(baseOptions: Apollo.QueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
      }
export function useGetProjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
        }
export type GetProjectQueryHookResult = ReturnType<typeof useGetProjectQuery>;
export type GetProjectLazyQueryHookResult = ReturnType<typeof useGetProjectLazyQuery>;
export type GetProjectQueryResult = Apollo.QueryResult<GetProjectQuery, GetProjectQueryVariables>;
export const GetProjectsDocument = gql`
    query GetProjects($filters: ProjectListFilters, $includeSpace: Boolean = false, $includeMilestones: Boolean = false, $includeContributors: Boolean = false, $includeLastCheckIn: Boolean = false, $includeChampion: Boolean = false, $includeGoal: Boolean = false) {
  projects(filters: $filters) {
    id
    name
    private
    insertedAt
    updatedAt
    startedAt
    closedAt
    deadline
    isArchived
    isOutdated
    status
    goal @include(if: $includeGoal) {
      id
      name
    }
    champion @include(if: $includeChampion) {
      id
      fullName
      avatarUrl
      title
    }
    contributors @include(if: $includeContributors) {
      id
      role
      person {
        id
        fullName
        avatarUrl
        title
      }
    }
    space @include(if: $includeSpace) {
      id
      name
    }
    nextMilestone @include(if: $includeMilestones) {
      id
      title
      status
      insertedAt
      deadlineAt
    }
    milestones @include(if: $includeMilestones) {
      id
      title
      status
      insertedAt
      deadlineAt
    }
    lastCheckIn @include(if: $includeLastCheckIn) {
      id
      status
      description
      insertedAt
      author {
        id
        fullName
        avatarUrl
      }
    }
  }
}
    `;

/**
 * __useGetProjectsQuery__
 *
 * To run a query within a React component, call `useGetProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectsQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      includeSpace: // value for 'includeSpace'
 *      includeMilestones: // value for 'includeMilestones'
 *      includeContributors: // value for 'includeContributors'
 *      includeLastCheckIn: // value for 'includeLastCheckIn'
 *      includeChampion: // value for 'includeChampion'
 *      includeGoal: // value for 'includeGoal'
 *   },
 * });
 */
export function useGetProjectsQuery(baseOptions?: Apollo.QueryHookOptions<GetProjectsQuery, GetProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProjectsQuery, GetProjectsQueryVariables>(GetProjectsDocument, options);
      }
export function useGetProjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProjectsQuery, GetProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProjectsQuery, GetProjectsQueryVariables>(GetProjectsDocument, options);
        }
export type GetProjectsQueryHookResult = ReturnType<typeof useGetProjectsQuery>;
export type GetProjectsLazyQueryHookResult = ReturnType<typeof useGetProjectsLazyQuery>;
export type GetProjectsQueryResult = Apollo.QueryResult<GetProjectsQuery, GetProjectsQueryVariables>;
export const ListNotificationsDocument = gql`
    query ListNotifications($page: Int, $perPage: Int) {
  notifications(page: $page, perPage: $perPage) {
    id
    read
    activity {
      id
      insertedAt
      author {
        id
        fullName
        avatarUrl
      }
      commentThread {
        id
        message
        title
        commentsCount
        reactions {
          id
          emoji
          person {
            id
            fullName
            avatarUrl
          }
        }
      }
      content {
        __typename
        ... on ActivityContentCommentAdded {
          activity {
            id
            commentThread {
              id
              message
              title
              commentsCount
              reactions {
                id
                emoji
                person {
                  id
                  fullName
                  avatarUrl
                }
              }
            }
            content {
              __typename
              ... on ActivityContentGoalTimeframeEditing {
                goal {
                  id
                  name
                }
              }
              ... on ActivityContentGoalClosing {
                goal {
                  id
                  name
                }
              }
              ... on ActivityContentGoalDiscussionCreation {
                goal {
                  id
                  name
                }
              }
            }
          }
        }
        ... on ActivityContentGoalEditing {
          goalId
          oldName
          newName
          oldTimeframe {
            startDate
            endDate
            type
          }
          newTimeframe {
            startDate
            endDate
            type
          }
          oldChampionId
          newChampionId
          oldReviewerId
          newReviewerId
          addedTargets {
            id
          }
          updatedTargets {
            id
          }
          deletedTargets {
            id
          }
        }
        ... on ActivityContentGoalTimeframeEditing {
          goal {
            id
            name
          }
        }
        ... on ActivityContentDiscussionPosting {
          title
          discussionId
          space {
            id
            name
            icon
            color
          }
        }
        ... on ActivityContentProjectContributorAddition {
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectGoalConnection {
          goal {
            id
            name
          }
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectGoalDisconnection {
          goal {
            id
            name
          }
          project {
            id
            name
          }
        }
        ... on ActivityContentGoalCreated {
          goal {
            id
            name
            myRole
          }
        }
        ... on ActivityContentGoalClosing {
          goal {
            id
            name
          }
          success
        }
        ... on ActivityContentGoalReopening {
          goal {
            id
            name
          }
        }
        ... on ActivityContentGoalArchived {
          goal {
            id
            name
          }
        }
        ... on ActivityContentProjectClosed {
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectMoved {
          project {
            id
            name
          }
          oldSpace {
            id
            name
          }
          newSpace {
            id
            name
          }
        }
        ... on ActivityContentProjectTimelineEdited {
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectDiscussionSubmitted {
          title
          discussionId
          projectId
          project {
            name
          }
        }
        ... on ActivityContentDiscussionCommentSubmitted {
          discussionId
          title
          space {
            id
            name
          }
        }
        ... on ActivityContentProjectCheckInSubmitted {
          project {
            id
            name
          }
          checkIn {
            id
            insertedAt
            status
            description
          }
        }
        ... on ActivityContentGoalCheckIn {
          goal {
            id
            name
          }
          update {
            id
          }
        }
        ... on ActivityContentGoalCheckInAcknowledgement {
          goal {
            id
            name
          }
          update {
            id
          }
        }
        ... on ActivityContentProjectCheckInAcknowledged {
          projectId
          checkInId
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectCheckInCommented {
          projectId
          checkInId
          project {
            name
          }
        }
        ... on ActivityContentProjectCreated {
          project {
            id
            name
            myRole
          }
        }
        ... on ActivityContentProjectArchived {
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectReviewSubmitted {
          reviewId
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectReviewRequestSubmitted {
          requestId
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectReviewAcknowledged {
          projectId
          reviewId
          project {
            name
          }
        }
        ... on ActivityContentProjectReviewCommented {
          projectId
          reviewId
          project {
            name
          }
        }
        ... on ActivityContentProjectPausing {
          project {
            id
            name
          }
        }
        ... on ActivityContentProjectResuming {
          project {
            id
            name
          }
        }
        ... on ActivityContentGoalDiscussionCreation {
          goal {
            id
            name
          }
        }
        ... on ActivityContentProjectMilestoneCommented {
          commentAction
          milestone {
            id
            title
          }
          project {
            id
            name
          }
        }
      }
    }
  }
}
    `;

/**
 * __useListNotificationsQuery__
 *
 * To run a query within a React component, call `useListNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListNotificationsQuery({
 *   variables: {
 *      page: // value for 'page'
 *      perPage: // value for 'perPage'
 *   },
 * });
 */
export function useListNotificationsQuery(baseOptions?: Apollo.QueryHookOptions<ListNotificationsQuery, ListNotificationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListNotificationsQuery, ListNotificationsQueryVariables>(ListNotificationsDocument, options);
      }
export function useListNotificationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListNotificationsQuery, ListNotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListNotificationsQuery, ListNotificationsQueryVariables>(ListNotificationsDocument, options);
        }
export type ListNotificationsQueryHookResult = ReturnType<typeof useListNotificationsQuery>;
export type ListNotificationsLazyQueryHookResult = ReturnType<typeof useListNotificationsLazyQuery>;
export type ListNotificationsQueryResult = Apollo.QueryResult<ListNotificationsQuery, ListNotificationsQueryVariables>;
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