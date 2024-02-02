import client from "@/graphql/client";
import { gql } from "@apollo/client";

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
