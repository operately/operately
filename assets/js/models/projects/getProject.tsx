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
    },
    fetchPolicy: "network-only",
  });

  return data.data.project;
}

const QUERY = gql`
  fragment ProjectGoal on Project {
    goal {
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
  }

  fragment ProjectReviewer on Project {
    reviewer {
      id
      fullName
      avatarUrl
      title
    }
  }

  fragment ProjectContributors on Project {
    contributors {
      id
      role

      person {
        id
        fullName
        avatarUrl
        title
      }
    }
  }

  fragment ProjectPermissions on Project {
    permissions {
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
  }

  fragment ProjectSpace on Project {
    space {
      id
      name
      icon
      color
    }
  }

  fragment ProjectKeyResources on Project {
    keyResources {
      id
      title
      link
      resourceType
    }
  }

  fragment ProjectMilestones on Project {
    milestones {
      id
      title
      status

      deadlineAt
      completedAt
      description
      insertedAt
    }
  }

  fragment ProjectLastCheckIn on Project {
    lastCheckIn {
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
  }

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
  ) {
    project(id: $id) {
      id
      name
      description
      insertedAt
      startedAt
      deadline
      nextUpdateScheduledAt
      health

      isArchived
      archivedAt

      private
      status
      closedAt

      ...ProjectGoal @include(if: $includeGoal)
      ...ProjectReviewer @include(if: $includeReviewer)
      ...ProjectContributors @include(if: $includeContributors)
      ...ProjectPermissions @include(if: $includePermissions)
      ...ProjectSpace @include(if: $includeSpace)
      ...ProjectKeyResources @include(if: $includeKeyResources)
      ...ProjectMilestones @include(if: $includeMilestones)
      ...ProjectLastCheckIn @include(if: $includeLastCheckIn)
    }
  }
`;
