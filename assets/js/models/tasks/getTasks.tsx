import client from "@/graphql/client";

import { gql } from "@apollo/client";

const QUERY = gql`
  query GetTasks($spaceId: ID!) {
    tasks(spaceId: $spaceId) {
      id
      name
      priority
      size
      dueDate
      assignee {
        id
        fullName
      }
    }
  }
`;

export async function getTasks(spaceId: string) {
  const data = await client.query({
    query: QUERY,
    variables: { spaceId },
    fetchPolicy: "network-only",
  });

  return data.data.tasks;
}
