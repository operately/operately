import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetProjectsOptions {
  spaceId?: string;
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
        spaceId: options.spaceId,
      },
    },
    fetchPolicy: "network-only",
  });

  return data.data.projects;
}

const QUERY = gql`
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
      isArchived
      isOutdated
      status

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
