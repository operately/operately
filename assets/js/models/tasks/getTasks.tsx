import client from "@/graphql/client";

import { gql } from "@apollo/client";

const QUERY = gql`
  query GetTasks($spaceId: ID!, $status: String) {
    tasks(spaceId: $spaceId, status: $status) {
      id
      name
      priority
      size
      dueDate
      status
      assignees {
        id
        avatarUrl
        title
        fullName
      }
    }
  }
`;

export async function getTasks(spaceId: string, status: string) {
  const data = await client.query({
    query: QUERY,
    variables: { spaceId, status },
    fetchPolicy: "network-only",
  });

  return data.data.tasks;
}
