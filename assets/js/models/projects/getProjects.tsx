import { gql } from "@apollo/client";
import client from "@/graphql/client";
import * as Updates from "@/graphql/Projects/updates";

interface GetProjectsOptions {
  includeSpace?: boolean;
  includeContributors?: boolean;
  includeMilestones?: boolean;
  includeLastCheckIn?: boolean;
  filter?: "my-projects" | "reviewed-by-me" | "all-projects";
}

export async function getProjects(options: GetProjectsOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      includeSpace: !!options.includeSpace,
      includeContributors: !!options.includeContributors,
      includeMilestones: !!options.includeMilestones,
      includeLastCheckIn: !!options.includeLastCheckIn,
      filters: {
        filter: options.filter || "all-projects",
      },
    },
    fetchPolicy: "network-only",
  });

  return data.data.projects;
}

const QUERY = gql`
  fragment NextMilestone on Project {
    nextMilestone {
      id
      title
      status
      insertedAt
      deadlineAt
    }
  }

  fragment Milestones on Project {
    milestones {
      id
      title
      status
      insertedAt
      deadlineAt
    }
  }

  fragment Contributors on Project {
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

  fragment Space on Project {
    space {
      id
      name
    }
  }

  fragment LastCheckIn on Project {
    lastCheckIn ${Updates.UPDATE_FRAGMENT}
  }

  query ListProjects(
    $filters: ProjectListFilters
    $includeSpace: Boolean!
    $includeMilestones: Boolean!
    $includeContributors: Boolean!
    $includeLastCheckIn: Boolean!
  ) {
    projects(filters: $filters) {
      id
      name
      private

      insertedAt
      updatedAt
      startedAt
      closedAt

      deadline
      phase
      health
      isArchived
      isOutdated
      status

      ...Contributors @include(if: $includeContributors)
      ...Space @include(if: $includeSpace)
      ...Milestones @include(if: $includeMilestones)
      ...NextMilestone @include(if: $includeMilestones)
      ...LastCheckIn @include(if: $includeLastCheckIn)
    }
  }
`;
