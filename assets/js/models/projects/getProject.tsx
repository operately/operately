import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetProjectOptions {
  includeGoal?: boolean;
  includeReviewer?: boolean;
  includeContributors?: boolean;
  includePermissions?: boolean;
  includeSpace?: boolean;
  includeKeyResources?: boolean;
  includeMilestones?: boolean;
  includeLastCheckIn?: boolean;
  includeRetrospective?: boolean;
  includeClosedBy?: boolean;
}

export async function getProject(id: string, options: GetProjectOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeGoal: !!options.includeGoal,
      includeReviewer: !!options.includeReviewer,
      includeContributors: !!options.includeContributors,
      includePermissions: !!options.includePermissions,
      includeSpace: !!options.includeSpace,
      includeKeyResources: !!options.includeKeyResources,
      includeMilestones: !!options.includeMilestones,
      includeLastCheckIn: !!options.includeLastCheckIn,
      includeRetrospective: !!options.includeRetrospective,
      includeClosedBy: !!options.includeClosedBy,
    },
    fetchPolicy: "network-only",
  });

  return data.data.project;
}

const QUERY = gql`
  query GetProject(
    $id: ID!
    $includeGoal: Boolean!
    $includeReviewer: Boolean!
    $includeContributors: Boolean!
    $includePermissions: Boolean!
    $includeSpace: Boolean!
    $includeKeyResources: Boolean!
    $includeMilestones: Boolean!
    $includeLastCheckIn: Boolean!
    $includeRetrospective: Boolean!
    $includeClosedBy: Boolean!
  ) {
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

        canEditMilestone
        canEditDescription
        canEditContributors
        canEditTimeline
        canEditResources
        canEditGoal

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
