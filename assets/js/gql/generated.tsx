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
   * The `Naive DateTime` scalar type represents a naive date and time without
   * timezone. The DateTime appears in a JSON response as an ISO8601 formatted
   * string.
   */
  NaiveDateTime: { input: any; output: any; }
};

export type ChangeGoalParentInput = {
  goalId: Scalars['String']['input'];
  parentGoalId?: InputMaybe<Scalars['String']['input']>;
};

export type ChangePasswordInput = {
  password: Scalars['String']['input'];
  passwordConfirmation: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type CloseGoalInput = {
  goalId: Scalars['String']['input'];
  retrospective: Scalars['String']['input'];
  success: Scalars['String']['input'];
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
  mission?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  people?: Maybe<Array<Maybe<Person>>>;
  trustedEmailDomains?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type CreateUpdateInput = {
  content: Scalars['String']['input'];
  messageType?: InputMaybe<Scalars['String']['input']>;
  newTargetValues?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updatableId: Scalars['ID']['input'];
  updatableType: Scalars['String']['input'];
};

export type EditGoalDiscussionInput = {
  activityId: Scalars['String']['input'];
  message: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type EditGoalTimeframeInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  timeframe: TimeframeInput;
};

export type EditUpdateInput = {
  content: Scalars['String']['input'];
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
  privateSpace: Scalars['Boolean']['output'];
};

export type Invitation = {
  __typename?: 'Invitation';
  admin: Person;
  adminName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  member: Person;
  token: Scalars['String']['output'];
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

export type Person = {
  __typename?: 'Person';
  avatarBlobId?: Maybe<Scalars['ID']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  company: Company;
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
  suspended: Scalars['Boolean']['output'];
  theme?: Maybe<Scalars['String']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
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

export type RootMutationType = {
  __typename?: 'RootMutationType';
  acknowledge?: Maybe<Update>;
  archiveGoal?: Maybe<Goal>;
  changeGoalParent: Goal;
  changePasswordFirstTime?: Maybe<Scalars['String']['output']>;
  closeGoal: Goal;
  createUpdate: Update;
  editGoalDiscussion: Goal;
  editGoalTimeframe: Goal;
  editUpdate: Update;
  reopenGoal: Goal;
};


export type RootMutationTypeAcknowledgeArgs = {
  id: Scalars['ID']['input'];
};


export type RootMutationTypeArchiveGoalArgs = {
  goalId: Scalars['ID']['input'];
};


export type RootMutationTypeChangeGoalParentArgs = {
  input: ChangeGoalParentInput;
};


export type RootMutationTypeChangePasswordFirstTimeArgs = {
  input: ChangePasswordInput;
};


export type RootMutationTypeCloseGoalArgs = {
  input: CloseGoalInput;
};


export type RootMutationTypeCreateUpdateArgs = {
  input: CreateUpdateInput;
};


export type RootMutationTypeEditGoalDiscussionArgs = {
  input: EditGoalDiscussionInput;
};


export type RootMutationTypeEditGoalTimeframeArgs = {
  input: EditGoalTimeframeInput;
};


export type RootMutationTypeEditUpdateArgs = {
  input: EditUpdateInput;
};


export type RootMutationTypeReopenGoalArgs = {
  input: ReopenGoalInput;
};

export type RootQueryType = {
  __typename?: 'RootQueryType';
  invitation: Invitation;
  update: Update;
  updates: Array<Maybe<Update>>;
};


export type RootQueryTypeInvitationArgs = {
  token: Scalars['String']['input'];
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

export type UpdatesFilter = {
  goalId?: InputMaybe<Scalars['ID']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type EditGoalDiscussionMutationVariables = Exact<{
  input: EditGoalDiscussionInput;
}>;


export type EditGoalDiscussionMutation = { __typename?: 'RootMutationType', editGoalDiscussion: { __typename?: 'Goal', id: string } };

export type EditGoalTimeframeMutationVariables = Exact<{
  input: EditGoalTimeframeInput;
}>;


export type EditGoalTimeframeMutation = { __typename?: 'RootMutationType', editGoalTimeframe: { __typename?: 'Goal', id: string } };

export type GetInvitationQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type GetInvitationQuery = { __typename?: 'RootQueryType', invitation: { __typename?: 'Invitation', admin: { __typename?: 'Person', fullName: string, company: { __typename?: 'Company', name: string } }, member: { __typename?: 'Person', fullName: string, email?: string | null } } };


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
export const GetInvitationDocument = gql`
    query GetInvitation($token: String!) {
  invitation(token: $token) {
    admin {
      fullName
      company {
        name
      }
    }
    member {
      fullName
      email
    }
  }
}
    `;

/**
 * __useGetInvitationQuery__
 *
 * To run a query within a React component, call `useGetInvitationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInvitationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInvitationQuery({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useGetInvitationQuery(baseOptions: Apollo.QueryHookOptions<GetInvitationQuery, GetInvitationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetInvitationQuery, GetInvitationQueryVariables>(GetInvitationDocument, options);
      }
export function useGetInvitationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetInvitationQuery, GetInvitationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetInvitationQuery, GetInvitationQueryVariables>(GetInvitationDocument, options);
        }
export type GetInvitationQueryHookResult = ReturnType<typeof useGetInvitationQuery>;
export type GetInvitationLazyQueryHookResult = ReturnType<typeof useGetInvitationLazyQuery>;
export type GetInvitationQueryResult = Apollo.QueryResult<GetInvitationQuery, GetInvitationQueryVariables>;