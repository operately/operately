import client from "@/graphql/client";
import { gql, useMutation } from "@apollo/client";

export type { Discussion } from "@/gql";

export function usePost(options = {}) {
  return useMutation(MUTATION, options);
}

const MUTATION = gql`
  mutation PostDiscussion($input: PostDiscussionInput!) {
    postDiscussion(input: $input) {
      id
    }
  }
`;

export async function getDiscussion(id: string) {
  let res = await client.query({
    query: QUERY,
    variables: {
      id: id,
    },
    fetchPolicy: "network-only",
  });

  return res.data.discussion;
}

const QUERY = gql`
  query GetDiscussion($id: ID!) {
    discussion(id: $id) {
      id
      title
      body
      insertedAt
      updatedAt

      space {
        id
        name
        icon
        color
      }

      author {
        id
        fullName
        avatarUrl
      }

      reactions {
        id
        reactionType
        person {
          id
          fullName
          avatarUrl
        }
      }

      comments {
        id
        message
        insertedAt

        author {
          id
          fullName
          avatarUrl
        }

        reactions {
          id
          reaction_type
          person {
            id
            fullName
            avatarUrl
          }
        }
      }
    }
  }
`;

interface GetDiscussionsOptions {
  spaceId: string;
}

export async function getDiscussions(options: GetDiscussionsOptions) {
  let res = await client.query({
    query: LIST_QUERY,
    variables: {
      spaceId: options.spaceId,
    },
    fetchPolicy: "network-only",
  });

  return res.data.discussions;
}

const LIST_QUERY = gql`
  query GetDiscussions($spaceId: ID!) {
    discussions(spaceId: $spaceId) {
      id
      title
      body
      insertedAt
      updatedAt

      author {
        id
        fullName
        avatarUrl
      }
    }
  }
`;
