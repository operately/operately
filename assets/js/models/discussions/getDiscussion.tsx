import client from "@/graphql/client";
import { gql } from "@apollo/client";

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
          reactionType
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
