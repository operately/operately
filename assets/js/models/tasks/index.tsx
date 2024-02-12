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

interface GetTaskOptions {
  includeSpace?: boolean;
  includeAssignee?: boolean;
}

export async function getTask(id: string, opts: GetTaskOptions = {}) {
  const query = gql`
    fragment SpaceOnTask on Task {
      space {
        id
        name
        icon
        color
      }
    }

    fragment AssigneeOnTask on Task {
      assignee {
        id
        fullName
        avatarUrl
        title
      }
    }

    query GetTask($id: ID!, $includeSpace: Boolean!, $includeAssignee: Boolean!) {
      task(id: $id) {
        id
        name
        priority
        size
        dueDate
        description

        ...AssigneeOnTask @include(if: $includeAssignee)
        ...SpaceOnTask @include(if: $includeSpace)
      }
    }
  `;

  const data = await client.query({
    query,
    variables: {
      id,
      includeSpace: !!opts.includeSpace,
      includeAssignee: !!opts.includeAssignee,
    },
    fetchPolicy: "network-only",
  });

  return data.data.task;
}
