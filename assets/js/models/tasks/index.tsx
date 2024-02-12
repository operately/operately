import client from "@/graphql/client";

export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

export function useCreateTaskMutation(options?: any) {
  return useMutation(
    gql`
      mutation CreateTask($input: CreateTaskInput!) {
        createTask(input: $input) {
          id
        }
      }
    `,
    options,
  );
}

export async function getTasks(spaceId: string) {
  const query = gql`
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

  const data = await client.query({
    query,
    variables: { spaceId },
    fetchPolicy: "network-only",
  });

  return data.data.tasks;
}
