import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetProjectsOptions {
  includeSpace?: boolean;
  includeContributors?: boolean;
}

export async function getProjects(options: GetProjectsOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      includeSpace: !!options.includeSpace,
      includeContributors: !!options.includeContributors,
      filters: {},
    },
    fetchPolicy: "network-only",
  });

  return data.data.projects;
}

export const QUERY = gql`
  fragment Contributors on Project {
    contributors {
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

  query ListProjects($filters: ProjectListFilters, $includeContributors: Boolean!, $includeSpace: Boolean!) {
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
    }
  }
`;
