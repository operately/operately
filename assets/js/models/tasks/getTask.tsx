import client from "@/graphql/client";
import { gql } from "@apollo/client";

interface GetTaskOptions {
  includeAssignees?: boolean;
  includeMilestone?: boolean;
  includeProject?: boolean;
}

export async function getTask(id: string, opts: GetTaskOptions = {}) {
  const data = await client.query({
    query: QUERY,
    variables: {
      id,
      includeAssignees: !!opts.includeAssignees,
      includeMilestone: !!opts.includeMilestone,
      includeProject: !!opts.includeProject,
    },
    fetchPolicy: "network-only",
  });

  return data.data.task;
}

const QUERY = gql`
  fragment AssigneesOnTask on Task {
    assignees {
      id
      fullName
      avatarUrl
      title
    }
  }

  fragment MilestoneOnTask on Task {
    milestone {
      id
      title
    }
  }

  fragment ProjectOnTask on Task {
    project {
      id
      name
    }
  }

  query GetTask($id: ID!, $includeAssignees: Boolean!, $includeMilestone: Boolean!, $includeProject: Boolean!) {
    task(id: $id) {
      id
      name
      priority
      size
      dueDate
      description
      status

      ...AssigneesOnTask @include(if: $includeAssignees)
      ...MilestoneOnTask @include(if: $includeMilestone)
      ...ProjectOnTask @include(if: $includeProject)
    }
  }
`;
