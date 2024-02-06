import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetProjectOptions {
  includeGoal?: boolean;
}

export async function getProject(id: string, options: GetProjectOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeGoal: !!options.includeGoal,
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

  query GetProject($id: ID!, $includeGoal: Boolean!) {
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
    }
  }
`;
