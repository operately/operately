import client from "@/graphql/client";
import { gql } from "@apollo/client";

interface GetTaskOptions {
  includeSpace?: boolean;
  includeAssignees?: boolean;
}

export async function getTask(id: string, opts: GetTaskOptions = {}) {
  const data = await client.query({
    query: QUERY,
    variables: {
      id,
      includeSpace: !!opts.includeSpace,
      includeAssignees: !!opts.includeAssignees,
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

  fragment AssigneesOnTask on Task {
    assignees {
      id
      fullName
      avatarUrl
      title
    }
  }

  query GetTask($id: ID!, $includeSpace: Boolean!, $includeAssignees: Boolean!) {
    task(id: $id) {
      id
      name
      priority
      size
      dueDate
      description
      status

      ...AssigneesOnTask @include(if: $includeAssignees)
      ...SpaceOnTask @include(if: $includeSpace)
    }
  }
`;
