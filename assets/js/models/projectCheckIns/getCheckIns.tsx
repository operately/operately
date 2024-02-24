import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetCheckInsOptions {
  includeAuthor?: boolean;
  includeProject?: boolean;
  includeReactions?: boolean;
}

export async function getCheckIns(projectId: string, options: GetCheckInsOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      projectId: projectId,
      includeAuthor: !!options.includeAuthor,
      includeProject: !!options.includeProject,
      includeReactions: !!options.includeReactions,
    },
    fetchPolicy: "network-only",
  });

  return data.data.projectCheckIns;
}

const QUERY = gql`
  fragment ReactionsOnProjectCheckIns on ProjectCheckIn {
    reactions {
      id
      emoji

      person {
        id
        fullName
        avatarUrl
      }
    }
  }

  fragment ProjectOnProjectCheckIns on ProjectCheckIn {
    project {
      id
      name

      reviewer {
        id
        fullName
        avatarUrl
        title
      }

      permissions {
        canAcknowledgeCheckIn
      }
    }
  }

  fragment AuthorOnProjectCheckIns on ProjectCheckIn {
    author {
      id
      fullName
      avatarUrl
      title
    }
  }

  query GetProjectCheckIns(
    $projectId: ID!
    $includeAuthor: Boolean!
    $includeProject: Boolean!
    $includeReactions: Boolean!
  ) {
    projectCheckIns(projectId: $projectId) {
      id
      status
      description
      insertedAt

      ...ProjectOnProjectCheckIns @include(if: $includeProject)
      ...AuthorOnProjectCheckIns @include(if: $includeAuthor)
      ...ReactionsOnProjectCheckIns @include(if: $includeReactions)
    }
  }
`;
