import React from "react";
import {
  gql,
  useQuery,
  useMutation,
  ApolloClient,
  QueryResult,
} from "@apollo/client";

import { Milestone } from "./milestones";
import * as fragments from "@/graphql/Fragments";

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

      contributors ${fragments.CONTRIBUTOR}

      phase
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

export interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
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
  insertedAt: Date;
  author: Person;
  message: string;
  comments: Comment[];
}

export interface Project {
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
      startedAt
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

            reactions {
              reactionType
              person {
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
  }
`;

type UseProjectResult = QueryResult<{ project: Project }, { id: string }>;

export function useProject(id: string): UseProjectResult {
  return useQuery(GET_PROJECT, { variables: { id } });
}

export function usePostUpdateMutation(projectId: string) {
  const [fun, status] = useMutation(
    gql`
      mutation CreateUpdate($input: CreateUpdateInput!) {
        createUpdate(input: $input) {
          id
        }
      }
    `,
    {
      refetchQueries: [
        {
          query: GET_PROJECT,
          variables: { id: projectId },
        },
      ],
    }
  );

  const createUpdate = (content: any) => {
    return fun({
      variables: {
        input: {
          updatableId: projectId,
          updatableType: "project",
          content: JSON.stringify(content),
        },
      },
    });
  };

  return [createUpdate, status] as const;
}

export function usePostCommentMutation(updateId: string) {
  const [fun, status] = useMutation(
    gql`
      mutation CreateComment($input: CreateCommentInput!) {
        createComment(input: $input) {
          id
        }
      }
    `,
    {
      refetchQueries: [
        {
          query: GET_STATUS_UPDATE,
          variables: { id: updateId },
        },
      ],
    }
  );

  const createComment = (content: any) => {
    return fun({
      variables: {
        input: {
          updateId: updateId,
          content: JSON.stringify(content),
        },
      },
    });
  };

  return [createComment, status] as const;
}

export function useReactMutation(updateId: string) {
  const [fun, status] = useMutation(
    gql`
      mutation AddReaction($id: ID!, $type: String!) {
        addReaction(id: $id, type: $type) {
          id
        }
      }
    `,
    {
      refetchQueries: [
        {
          query: GET_STATUS_UPDATE,
          variables: { id: updateId },
        },
      ],
    }
  );

  const addReaction = (type: any) => {
    return fun({
      variables: {
        id: updateId,
        type: type,
      },
    });
  };

  return [addReaction, status] as const;
}

export function useAckMutation(updateId: string) {
  const [fun, status] = useMutation(
    gql`
      mutation Acknowledge($id: ID!) {
        acknowledge(id: $id) {
          id
        }
      }
    `,
    {
      refetchQueries: [
        {
          query: GET_STATUS_UPDATE,
          variables: { id: updateId },
        },
      ],
    }
  );

  const ack = () => {
    return fun({
      variables: {
        id: updateId,
      },
    });
  };

  return [ack, status] as const;
}

const GET_STATUS_UPDATE = gql`
  query GetStatusUpdate($id: ID!) {
    update(id: $id) {
      ${fragments.ACTIVITY_FIELDS}

      project {
        id
        name
        owner ${fragments.PERSON}
        reviewer ${fragments.PERSON}
      }
    }
  }
`;

export function useProjectStatusUpdate(id: string) {
  return useQuery(GET_STATUS_UPDATE, { variables: { id: id } });
}
