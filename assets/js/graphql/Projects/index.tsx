import React from "react";
import { gql, useQuery, useMutation, useApolloClient, ApolloClient, QueryResult } from "@apollo/client";

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

export function listProjects(client: ApolloClient<object>, variables: ListProjectsVariables) {
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
  role: "champion" | "reviewer" | "contributor";
  responsibility: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  author: Person;
}

interface Reaction {
  id: string;
  reactionType: string;
  person: Person;
}

interface Comment {
  id: string;
  message: string;
  insertedAt: Date;
  updatedAt: Date;

  reactions: Reaction[];
}

export interface Update {
  id: string;
  message: string;
  insertedAt: Date;
  updatedAt: Date;

  author: Person;

  acknowledgingPerson: Person;
  acknowledged: boolean;
  acknowledgedAt: Date;

  reactions: Reaction[];
  comments: Comment[];
}

type ProjectPhase = "concept" | "planning" | "execution" | "control";

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  phase: ProjectPhase;

  milestones: Milestone[];
  parents: Parent[];
  contributors: Contributor[];

  pitch: Document;
  plan: Document;
  execution_review: Document;
  retrospective: Document;

  updates: Update[];

  isPinned: boolean;
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
      isPinned

      milestones {
        id
        title
        deadlineAt
        status
        phase
      }

      contributors ${fragments.CONTRIBUTOR}

      pitch ${fragments.PROJECT_DOCUMENT}
      plan ${fragments.PROJECT_DOCUMENT}
      execution_review ${fragments.PROJECT_DOCUMENT}
      retrospective ${fragments.PROJECT_DOCUMENT}

      updates {
        id
        message

        insertedAt
        updatedAt

        author ${fragments.PERSON}

        comments {
          id
          message
          insertedAt
          author ${fragments.PERSON}

          reactions {
            id
            reactionType
            person ${fragments.PERSON}
          }
        }

        acknowledgingPerson ${fragments.PERSON}
        acknowledged
        acknowledgedAt

        reactions {
          id
          reactionType
          person ${fragments.PERSON}
        }
      }
    }
  }
`;

type UseProjectResult = QueryResult<{ project: Project }, { id: string }>;

export function useProject(id: string): UseProjectResult {
  return useQuery(GET_PROJECT, { variables: { id } });
}

export function usePostUpdate(projectId: string, options: any) {
  const [fun, status] = useMutation(
    gql`
      mutation CreateUpdate($input: CreateUpdateInput!) {
        createUpdate(input: $input) {
          id
        }
      }
    `,
    options,
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
    },
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
  return [post, status] as const;
}

export function usePostDocument(projectId: string, type: string, options?: any) {
  const [fun, status] = useMutation(
    gql`
      mutation PostProjectDocument($projectId: ID!, $content: String!, $type: String!) {
        postProjectDocument(projectId: $projectId, content: $content, type: $type) {
          id
        }
      }
    `,
    options,
  );

  const post = (content: any) => {
    return fun({
      variables: {
        projectId: projectId,
        type: type,
        content: JSON.stringify(content),
      },
    });
  };

  return [post, status] as const;
}

export function useReactMutation(entityType: string, entityID: string) {
  const [fun, status] = useMutation(
    gql`
      mutation AddReaction($entityID: ID!, $entityType: String!, $type: String!) {
        addReaction(entityID: $entityID, entityType: $entityType, type: $type) {
          id
        }
      }
    `,
  );

  const addReaction = (type: any) => {
    return fun({
      variables: {
        entityType: entityType,
        entityID: entityID,
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
    },
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

export function useAddProject(options) {
  return useMutation(
    gql`
      mutation CreateProject($name: String!, $championId: ID!) {
        createProject(name: $name, championId: $championId) {
          id
        }
      }
    `,
    options,
  );
}

export function useAddProjectContributorMutation(projectId: string) {
  const [fun, status] = useMutation(
    gql`
      mutation AddProjectContributor($projectId: ID!, $personId: ID!, $responsibility: String!, $role: String!) {
        addProjectContributor(
          projectId: $projectId
          personId: $personId
          responsibility: $responsibility
          role: $role
        ) {
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
    },
  );

  const addColab = (personId, responsibility, role = "contributor") => {
    return fun({
      variables: {
        projectId: projectId,
        personId: personId,
        responsibility: responsibility,
        role: role,
      },
    });
  };

  return [addColab, status] as const;
}

const UPDATE_PROJECT_CONTRIBUTOR = gql`
  mutation UpdateProjectContributor($contribId: ID!, $personId: ID!, $responsibility: String!) {
    updateProjectContributor(contribId: $contribId, personId: $personId, responsibility: $responsibility) {
      id
    }
  }
`;

export function useUpdateProjectContributorMutation(contribId: string) {
  const [fun, status] = useMutation(UPDATE_PROJECT_CONTRIBUTOR, {
    onCompleted: (data) => console.log(data),
  });

  const updateColab = (personId: string, responsibility: string) => {
    return fun({
      variables: {
        contribId: contribId,
        personId: personId,
        responsibility: responsibility,
      },
    });
  };

  return [updateColab, status] as const;
}

const REMOVE_PROJECT_CONTRIBUTOR = gql`
  mutation RemoveProjectContributor($contribId: ID!) {
    removeProjectContributor(contribId: $contribId) {
      id
    }
  }
`;

export function useRemoveProjectContributorMutation(contribId: string) {
  return useMutation(REMOVE_PROJECT_CONTRIBUTOR, {
    variables: { contribId: contribId },
    onCompleted: (data) => console.log(data),
  });
}

const GET_STATUS_UPDATE = gql`
  query GetStatusUpdate($id: ID!) {
    update(id: $id) {
      id
      message

      insertedAt
      updatedAt

      author ${fragments.PERSON}

      comments {
        id
        message
        insertedAt
        author ${fragments.PERSON}

        reactions {
          id
          reactionType
          person ${fragments.PERSON}
        }
      }

      acknowledgingPerson ${fragments.PERSON}
      acknowledged
      acknowledgedAt

      reactions {
        id
        reactionType
        person ${fragments.PERSON}
      }

      project {
        id
        name
        champion ${fragments.PERSON}
        reviewer ${fragments.PERSON}
      }
    }
  }
`;

export function useProjectStatusUpdate(id: string) {
  return useQuery(GET_STATUS_UPDATE, { variables: { id: id } });
}

const LIST_PROJECT_CONTRIBUTOR_CANDIDATES = gql`
  query projectContributorCandidates($projectId: ID!, $query: String!) {
    projectContributorCandidates(projectId: $projectId, query: $query) ${fragments.PERSON}
  }
`;

export function useProjectContributorCandidatesQuery(id: string) {
  const client = useApolloClient();

  return async (query: string) => {
    const res = await client.query({
      query: LIST_PROJECT_CONTRIBUTOR_CANDIDATES,
      variables: {
        projectId: id,
        query: query,
      },
    });

    if (!res.data) return [];
    if (!res.data.projectContributorCandidates) return [];

    return res.data.projectContributorCandidates;
  };
}

export function isChampionAssigned(project: Project) {
  return project.contributors.some((c) => c.role === "champion");
}

export function isReviwerAssigned(project: Project) {
  return project.contributors.some((c) => c.role === "reviewer");
}

type DocumentType = "pitch" | "plan" | "execution_review" | "retrospective";

const whatShouldBeFilledIn = {
  concept: ["pitch"],
  planning: ["pitch", "plan"],
  execution: ["pitch", "plan", "execution_review"],
  control: ["pitch", "plan", "execution_review", "retrospective"],
};

export function shouldBeFilledIn(project: Project, documentType: DocumentType): boolean {
  return whatShouldBeFilledIn[project.phase].includes(documentType);
}

export function isPhaseCompleted(project: Project, phase: string): boolean {
  const phases = ["concept", "planning", "execution", "control"];

  const phaseIndex = phases.indexOf(phase);
  const projectPhaseIndex = phases.indexOf(project.phase);

  return phaseIndex < projectPhaseIndex;
}

export function usePinProjectToHomePage(options = {}) {
  return useMutation(
    gql`
      mutation PinProjectToHomePage($projectId: ID!) {
        pinProjectToHomePage(projectId: $projectId)
      }
    `,
    options,
  );
}
