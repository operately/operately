import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetProjectOptions {
  includeGoal?: boolean;
  includeReviewer?: boolean;
  includeContributors?: boolean;
}

export async function getProject(id: string, options: GetProjectOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeGoal: !!options.includeGoal,
      includeReviewer: !!options.includeReviewer,
      includeContributors: !!options.includeContributors,
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

  query GetProject($id: ID!, $includeGoal: Boolean!, $includeReviewer: Boolean!, $includeContributors: Boolean!) {
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
    }
  }
`;
