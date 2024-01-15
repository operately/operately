import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetProjectsOptions {
  includeSpace?: boolean;
  includeContributors?: boolean;
  includeMilestones?: boolean;
  filter?: "my-projects" | "reviewed-by-me" | "all-projects";
}

export async function getProjects(options: GetProjectsOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      includeSpace: !!options.includeSpace,
      includeContributors: !!options.includeContributors,
      includeMilestones: !!options.includeMilestones,
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
    }
  }

  fragment Milestones on Project {
    milestones {
      id
      title
      status
      insertedAt
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

  query ListProjects(
    $filters: ProjectListFilters
    $includeSpace: Boolean!
    $includeMilestones: Boolean!
    $includeContributors: Boolean!
  ) {
    projects(filters: $filters) {
      id
      name
      insertedAt
      updatedAt
      private
      startedAt
      deadline
      phase
      health
      isArchived
      status

      ...Contributors @include(if: $includeContributors)
      ...Space @include(if: $includeSpace)
      ...Milestones @include(if: $includeMilestones)
      ...NextMilestone @include(if: $includeMilestones)
    }
  }
`;
