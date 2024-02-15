import client from "@/graphql/client";

import { gql, useQuery } from "@apollo/client";

const QUERY = gql`
  query GetTasks($milestoneId: String!, $status: String) {
    tasks(milestoneId: $milestoneId, status: $status) {
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

export async function getTasks(minestoneId: string, status?: string) {
  const data = await client.query({
    query: QUERY,
    variables: { minestoneId, status },
    fetchPolicy: "network-only",
  });

  return data.data.tasks;
}

export function useTasks(milestoneId: string, status?: string) {
  console.log("milestoneId", milestoneId);

  return useQuery(QUERY, {
    variables: { milestoneId, status },
    fetchPolicy: "network-only",
  });
}
