import { gql } from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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

export type ActivityContent = ActivityContentProjectArchived | ActivityContentProjectClosed | ActivityContentProjectCreated | ActivityContentProjectDiscussionCommentSubmitted | ActivityContentProjectDiscussionSubmitted | ActivityContentProjectMilestoneCommented | ActivityContentProjectMoved | ActivityContentProjectRenamed | ActivityContentProjectReviewAcknowledged | ActivityContentProjectReviewCommented | ActivityContentProjectReviewRequestSubmitted | ActivityContentProjectReviewSubmitted | ActivityContentProjectStatusUpdateAcknowledged | ActivityContentProjectStatusUpdateCommented | ActivityContentProjectStatusUpdateSubmitted | ActivityContentProjectTimelineEdited;

export type ActivityContentProjectArchived = {
  __typename?: 'ActivityContentProjectArchived';
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectClosed = {
  __typename?: 'ActivityContentProjectClosed';
  project: Project;
};

export type ActivityContentProjectCreated = {
  __typename?: 'ActivityContentProjectCreated';
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ActivityContentProjectDiscussionCommentSubmitted = {
  __typename?: 'ActivityContentProjectDiscussionCommentSubmitted';
  discussionId: Scalars['String']['output'];
  discussionTitle: Scalars['String']['output'];
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

export type ActivityContentProjectRenamed = {
  __typename?: 'ActivityContentProjectRenamed';
  newName: Scalars['String']['output'];
  oldName: Scalars['String']['output'];
  project: Project;
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

export type ActivityContentProjectStatusUpdateAcknowledged = {
  __typename?: 'ActivityContentProjectStatusUpdateAcknowledged';
  project: Project;
  projectId: Scalars['String']['output'];
  statusUpdateId: Scalars['String']['output'];
  update: Update;
};

export type ActivityContentProjectStatusUpdateCommented = {
  __typename?: 'ActivityContentProjectStatusUpdateCommented';
  comment: Comment;
  project: Project;
  projectId: Scalars['String']['output'];
  statusUpdateId: Scalars['String']['output'];
  update: Update;
};

export type ActivityContentProjectStatusUpdateSubmitted = {
  __typename?: 'ActivityContentProjectStatusUpdateSubmitted';
  project: Project;
  projectId: Scalars['String']['output'];
  statusUpdateId: Scalars['String']['output'];
  update: Update;
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

export type AddKeyResourceInput = {
  link: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  resourceType: Scalars['String']['input'];
  title: Scalars['String']['input'];
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

export type CloseProjectInput = {
  projectId: Scalars['ID']['input'];
  retrospective: Scalars['String']['input'];
};

export type Comment = {
  __typename?: 'Comment';
  author?: Maybe<Person>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['NaiveDateTime']['output'];
  message: Scalars['String']['output'];
  reactions?: Maybe<Array<Maybe<Reaction>>>;
};

export type Company = {
  __typename?: 'Company';
  id: Scalars['ID']['output'];
  mission: Scalars['String']['output'];
  name: Scalars['String']['output'];
  tenets?: Maybe<Array<Maybe<Tenet>>>;
};

export type ContactInput = {
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type CreateCommentInput = {
  content: Scalars['String']['input'];
  updateId: Scalars['ID']['input'];
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
  creatorRole?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  spaceId: Scalars['ID']['input'];
  visibility: Scalars['String']['input'];
};

export type CreateProjectReviewRequestInput = {
  content: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type CreateUpdateInput = {
  content: Scalars['String']['input'];
  health?: InputMaybe<Scalars['String']['input']>;
  messageType?: InputMaybe<Scalars['String']['input']>;
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

export type EditKeyResourceInput = {
  id: Scalars['ID']['input'];
  link: Scalars['String']['input'];
  title: Scalars['String']['input'];
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

export type Group = {
  __typename?: 'Group';
  color: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  members?: Maybe<Array<Person>>;
  mission?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  pointsOfContact?: Maybe<Array<GroupContact>>;
  privateSpace: Scalars['String']['output'];
};

export type GroupContact = {
  __typename?: 'GroupContact';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  value: Scalars['String']['output'];
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
  title: Scalars['String']['output'];
};

export type MilestoneComment = {
  __typename?: 'MilestoneComment';
  action: Scalars['String']['output'];
  comment: Comment;
  id: Scalars['ID']['output'];
};

export type MilestoneUpdateInput = {
  dueTime: Scalars['Date']['input'];
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type NewMilestoneInput = {
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
  projects?: Maybe<Array<Maybe<Project>>>;
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

export type Person = {
  __typename?: 'Person';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  company: Company;
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notifyAboutAssignments: Scalars['Boolean']['output'];
  notifyOnMention: Scalars['Boolean']['output'];
  sendDailySummary: Scalars['Boolean']['output'];
  theme?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type PostMilestoneCommentInput = {
  action: Scalars['String']['input'];
  content?: InputMaybe<Scalars['String']['input']>;
  milestoneId: Scalars['ID']['input'];
};

export type Project = {
  __typename?: 'Project';
  archivedAt?: Maybe<Scalars['Date']['output']>;
  champion?: Maybe<Person>;
  closedAt?: Maybe<Scalars['Date']['output']>;
  contributors?: Maybe<Array<Maybe<ProjectContributor>>>;
  deadline?: Maybe<Scalars['Date']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  health: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  isArchived: Scalars['Boolean']['output'];
  isPinned: Scalars['Boolean']['output'];
  keyResources?: Maybe<Array<Maybe<ProjectKeyResource>>>;
  lastCheckIn?: Maybe<Update>;
  milestones?: Maybe<Array<Maybe<Milestone>>>;
  myRole?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nextMilestone?: Maybe<Milestone>;
  nextUpdateScheduledAt?: Maybe<Scalars['Date']['output']>;
  parents?: Maybe<Array<Maybe<ProjectParent>>>;
  permissions: ProjectPermissions;
  phase: Scalars['String']['output'];
  phaseHistory?: Maybe<Array<Maybe<ProjectPhaseHistory>>>;
  private: Scalars['Boolean']['output'];
  retrospective?: Maybe<Scalars['String']['output']>;
  reviewRequests?: Maybe<Array<Maybe<ProjectReviewRequest>>>;
  reviewer?: Maybe<Person>;
  space: Group;
  spaceId: Scalars['ID']['output'];
  startedAt?: Maybe<Scalars['Date']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
  updates?: Maybe<Array<Maybe<Update>>>;
};

export type ProjectContributor = {
  __typename?: 'ProjectContributor';
  id: Scalars['ID']['output'];
  person: Person;
  responsibility?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
};

export type ProjectDocument = {
  __typename?: 'ProjectDocument';
  author: Person;
  content: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Date']['output'];
  title: Scalars['String']['output'];
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
  groupId?: InputMaybe<Scalars['ID']['input']>;
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
  objectiveId?: InputMaybe<Scalars['ID']['input']>;
};

export type ProjectMoveInput = {
  projectId: Scalars['ID']['input'];
  spaceId: Scalars['ID']['input'];
};

export type ProjectParent = {
  __typename?: 'ProjectParent';
  id?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ProjectPermissions = {
  __typename?: 'ProjectPermissions';
  canAcknowledgeCheckIn: Scalars['Boolean']['output'];
  canCheckIn: Scalars['Boolean']['output'];
  canCreateMilestone: Scalars['Boolean']['output'];
  canDeleteMilestone: Scalars['Boolean']['output'];
  canEditContributors: Scalars['Boolean']['output'];
  canEditDescription: Scalars['Boolean']['output'];
  canEditMilestone: Scalars['Boolean']['output'];
  canEditResources: Scalars['Boolean']['output'];
  canEditTimeline: Scalars['Boolean']['output'];
  canView: Scalars['Boolean']['output'];
};

export type ProjectPhaseHistory = {
  __typename?: 'ProjectPhaseHistory';
  dueTime?: Maybe<Scalars['Date']['output']>;
  endTime?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  phase: Scalars['String']['output'];
  startTime?: Maybe<Scalars['Date']['output']>;
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
  id: Scalars['ID']['output'];
  person: Person;
  reactionType: Scalars['String']['output'];
};

export type RootMutationType = {
  __typename?: 'RootMutationType';
  acknowledge?: Maybe<Update>;
  addGroupContact?: Maybe<Group>;
  addGroupMembers?: Maybe<Group>;
  addKeyResource: ProjectKeyResource;
  addProjectContributor: ProjectContributor;
  addProjectMilestone: Milestone;
  addReaction?: Maybe<Reaction>;
  archiveProject: Project;
  closeProject: Project;
  createBlob: Blob;
  createComment?: Maybe<Comment>;
  createGroup?: Maybe<Group>;
  createKeyResult?: Maybe<KeyResult>;
  createKpi?: Maybe<Kpi>;
  createObjective?: Maybe<Objective>;
  createProfile?: Maybe<Person>;
  createProject: Project;
  createProjectReviewRequest?: Maybe<ProjectReviewRequest>;
  createTenet?: Maybe<Tenet>;
  createUpdate: Update;
  editKeyResource: ProjectKeyResource;
  editProjectName: Project;
  editProjectTimeline: Project;
  markNotificationAsRead: Notification;
  moveProjectToSpace: Project;
  pinProjectToHomePage: Scalars['Boolean']['output'];
  postMilestoneComment: MilestoneComment;
  postProjectDocument: ProjectDocument;
  removeGroupMember?: Maybe<Group>;
  removeKeyResource: ProjectKeyResource;
  removeProjectContributor: ProjectContributor;
  removeProjectMilestone: Milestone;
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
  updateMilestoneDescription: Milestone;
  updateMilestoneTitle: Milestone;
  updateNotificationSettings?: Maybe<Person>;
  updateProfile?: Maybe<Person>;
  updateProjectContributor: ProjectContributor;
  updateProjectDescription: Project;
  updateProjectMilestone: Milestone;
};


export type RootMutationTypeAcknowledgeArgs = {
  id: Scalars['ID']['input'];
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
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type RootMutationTypeArchiveProjectArgs = {
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypeCloseProjectArgs = {
  input: CloseProjectInput;
};


export type RootMutationTypeCreateBlobArgs = {
  input: BlobInput;
};


export type RootMutationTypeCreateCommentArgs = {
  input: CreateCommentInput;
};


export type RootMutationTypeCreateGroupArgs = {
  mission: Scalars['String']['input'];
  name: Scalars['String']['input'];
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


export type RootMutationTypeCreateTenetArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type RootMutationTypeCreateUpdateArgs = {
  input: CreateUpdateInput;
};


export type RootMutationTypeEditKeyResourceArgs = {
  input: EditKeyResourceInput;
};


export type RootMutationTypeEditProjectNameArgs = {
  input: EditProjectNameInput;
};


export type RootMutationTypeEditProjectTimelineArgs = {
  input: EditProjectTimelineInput;
};


export type RootMutationTypeMarkNotificationAsReadArgs = {
  id: Scalars['ID']['input'];
};


export type RootMutationTypeMoveProjectToSpaceArgs = {
  input: ProjectMoveInput;
};


export type RootMutationTypePinProjectToHomePageArgs = {
  projectId: Scalars['ID']['input'];
};


export type RootMutationTypePostMilestoneCommentArgs = {
  input: PostMilestoneCommentInput;
};


export type RootMutationTypePostProjectDocumentArgs = {
  content: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  type: Scalars['String']['input'];
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


export type RootMutationTypeUpdateProjectMilestoneArgs = {
  deadlineAt?: InputMaybe<Scalars['Date']['input']>;
  milestoneId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type RootQueryType = {
  __typename?: 'RootQueryType';
  activities?: Maybe<Array<Maybe<Activity>>>;
  assignments: Assignments;
  company: Company;
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
  person?: Maybe<Person>;
  potentialGroupMembers?: Maybe<Array<Maybe<Person>>>;
  project?: Maybe<Project>;
  projectContributorCandidates?: Maybe<Array<Maybe<Person>>>;
  projectReviewRequest: ProjectReviewRequest;
  projects?: Maybe<Array<Maybe<Project>>>;
  searchPeople?: Maybe<Array<Maybe<Person>>>;
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


export type RootQueryTypeCompanyArgs = {
  id: Scalars['ID']['input'];
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
  query: Scalars['String']['input'];
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

export type UpdateContent = UpdateContentMessage | UpdateContentProjectContributorAdded | UpdateContentProjectContributorRemoved | UpdateContentProjectCreated | UpdateContentProjectDiscussion | UpdateContentProjectEndTimeChanged | UpdateContentProjectMilestoneCompleted | UpdateContentProjectMilestoneCreated | UpdateContentProjectMilestoneDeadlineChanged | UpdateContentProjectMilestoneDeleted | UpdateContentProjectStartTimeChanged | UpdateContentReview | UpdateContentStatusUpdate;

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
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatesFilter = {
  projectId?: InputMaybe<Scalars['ID']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};
