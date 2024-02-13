import client from "@/graphql/client";
import { gql } from "@apollo/client";

interface GetTaskOptions {
  includeSpace?: boolean;
  includeAssignee?: boolean;
}

export async function getTask(id: string, opts: GetTaskOptions = {}) {
  const data = await client.query({
    query: QUERY,
    variables: {
      id,
      includeSpace: !!opts.includeSpace,
      includeAssignee: !!opts.includeAssignee,
    },
    fetchPolicy: "network-only",
  });

  return data.data.task;
}

const QUERY = gql`
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
