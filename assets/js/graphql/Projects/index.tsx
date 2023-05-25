import React from "react";
import { gql, useQuery, ApolloClient, QueryResult } from "@apollo/client";

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

interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
}

interface Milestone {
  id: string;
  title: string;
  deadlineAt: string;
  status: string;
}

interface Parent {
  id: string;
  title: string;
  type: "objective" | "project" | "tenet" | "company";
}

interface Contributor {
  id: string;
  person: Person;
  responsibility: string;
}

interface Comment {
  id: string;
  content: string;
  insertedAt: Date;
}

interface Activity {
  id: string;
  content: string;
  insertedAt: Date;

  comments: Comment[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  phase: "draft" | "planning" | "execution" | "closing" | "closed";

  owner: Person;
  milestones: Milestone[];
  parents: Parent[];
  contributors: Contributor[];
  activities: Activity[];
}

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      deadline
      nextUpdateScheduledAt
      phase

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

      parents {
        id
        title
        type
      }

      contributors {
        id
        person {
          id
          fullName
          title
          avatarUrl
        }
        responsibility
      }

      activities {
        __typename
        id
        insertedAt

        author {
          id
          fullName
          title
          avatarUrl
        }

        ... on ActivityStatusUpdate {
          message

          acknowledged
          acknowledgedAt
          acknowledgingPerson {
            id
            fullName
            title
            avatarUrl
          }

          reactions {
            reactionType
            person {
              id
              fullName
              title
              avatarUrl
            }
          }

          comments {
            id
            message
            insertedAt
            author {
              id
              fullName
              title
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

type UseProjectResult = QueryResult<{ project: Project }, { id: string }>;

export function useProject(id: string): UseProjectResult {
  return useQuery(GET_PROJECT, { variables: { id } });
}
