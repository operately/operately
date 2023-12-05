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
  query GetGoal($id: ID!) {
    goal(id: $id) {
      id
      name

      space {
        id
        name
        icon
      }
    }
  }
`;
