import { gql } from "@apollo/client";
import client from "@/graphql/client";

export async function getGoal(id: string) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
    },
    fetchPolicy: "network-only",
  });

  return data.data.goal;
}

const QUERY = gql`
  fragment PersonFields on Person {
    id
    fullName
    avatarUrl
    title
  }

  query GetGoal($id: ID!) {
    goal(id: $id) {
      id
      name
      timeframe

      space {
        id
        name
        icon
        color
      }

      champion {
        ...PersonFields
      }

      reviewer {
        ...PersonFields
      }
    }
  }
`;
