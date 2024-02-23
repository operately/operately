import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetCheckInOptions {
  includeAuthor?: boolean;
  includeProject?: boolean;
  includeReactions?: boolean;
}

export async function getCheckIn(id: string, options: GetCheckInOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeAuthor: !!options.includeAuthor,
      includeProject: !!options.includeProject,
      includeReactions: !!options.includeReactions,
    },
    fetchPolicy: "network-only",
  });

  return data.data.projectCheckIn;
}

const QUERY = gql`
  fragment ReactionsOnProjectCheckIn on ProjectCheckIn {
    reactions {
      id
      reactionType

      person {
        id
        fullName
        avatarUrl
      }
    }
  }

  fragment ProjectOnProjectCheckIn on ProjectCheckIn {
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

  fragment AuthorOnProjectCheckIn on ProjectCheckIn {
    author {
      id
      fullName
      avatarUrl
      title
    }
  }

  query GetProjectCheckIn($id: ID!, $includeAuthor: Boolean!, $includeProject: Boolean!, $includeReactions: Boolean!) {
    projectCheckIn(id: $id) {
      id
      status
      description
      insertedAt

      ...ProjectOnProjectCheckIn @include(if: $includeProject)
      ...AuthorOnProjectCheckIn @include(if: $includeAuthor)
      ...ReactionsOnProjectCheckIn @include(if: $includeReactions)
    }
  }
`;
