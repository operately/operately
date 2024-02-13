import client from "@/graphql/client";
import { gql } from "@apollo/client";

interface GetTaskOptions {
  includeSpace?: boolean;
  includeAssignedPeople?: boolean;
}

export async function getTask(id: string, opts: GetTaskOptions = {}) {
  const data = await client.query({
    query: QUERY,
    variables: {
      id,
      includeSpace: !!opts.includeSpace,
      includeAssignedPeople: !!opts.includeAssignedPeople,
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

  fragment AssignedPeopleOnTask on Task {
    assignedPeople {
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
      status

      ...AssignedPeopleOnTask @include(if: $includeAssignedPeople)
      ...SpaceOnTask @include(if: $includeSpace)
    }
  }
`;
