import React from "react";
import { gql, useQuery, ApolloClient } from "@apollo/client";

const LIST_PROJECTS = gql`
  query ListProjects($groupId: ID, $objectiveId: ID) {
    projects(groupId: $groupId, objectiveId: $objectiveId) {
      id
      name
      updatedAt

      startedAt
      deadline

      owner {
        fullName
        title
      }
    }
  }
`;

const PROJECT_SUBSCRIPTION = gql`
  subscription OnProjectAdded {
    projectAdded {
      id
    }
  }
`;

interface ListProjectsVariables {
  groupId?: string;
  objectiveId?: string;
}

export function useProjects(variables: ListProjectsVariables) {
  const query = useQuery(LIST_PROJECTS, { variables });

  React.useEffect(() => {
    query.subscribeToMore({
      document: PROJECT_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        query.refetch();
        return prev;
      },
    });
  }, []);

  return query;
}

export function listProjects(
  client: ApolloClient<object>,
  variables: ListProjectsVariables
) {
  return client.query({
    query: LIST_PROJECTS,
    variables,
    fetchPolicy: "network-only",
  });
}

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      deadline

      owner {
        id
        fullName
        title
        avatarUrl
      }

      milestones {
        id
        title
        deadlineAt
        status
      }
    }
  }
`;

export function useProject(id: string) {
  return useQuery(GET_PROJECT, { variables: { id } });
}
