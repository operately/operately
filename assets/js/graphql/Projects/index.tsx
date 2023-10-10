import React from "react";
import { gql, useQuery, useMutation, useApolloClient, ApolloClient, QueryResult } from "@apollo/client";

import * as fragments from "@/graphql/Fragments";
import * as KeyResources from "./key_resources";
import * as Milestones from "./milestones";
import * as PhaseHistory from "./phase_history";
import * as Permissions from "./permissions";
import * as Updates from "./updates";
import * as ReviewRequests from "@/graphql/ProjectReviewRequests";
import * as People from "@/graphql/People";

export { CREATE_PROJECT, useCreateProject } from "./mutations/create";
export { EDIT_PROJECT_TIMELINE, useEditProjectTimeline } from "./mutations/edit_timeline";
export { EDIT_PROJECT_NAME, useEditProjectName } from "./mutations/edit_name";
export { ARCHIVE_PROJECT, useArchiveProject, useArchiveForm } from "./mutations/archive";

export const LIST_PROJECTS = gql`
  query ListProjects($filters: ProjectListFilters) {
    projects(filters: $filters) {
      id
      name
      insertedAt
      updatedAt
      private
      startedAt
      deadline
      phase
      health
      permissions ${Permissions.FRAGMENT}
      contributors ${fragments.CONTRIBUTOR}
      keyResources ${KeyResources.GQL_FRAGMENT}
      nextMilestone ${Milestones.FRAGMENT}
      reviewRequests ${ReviewRequests.FRAGMENT}
      champion ${People.FRAGMENT}
      reviewer ${People.FRAGMENT}
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

interface ListProjectsFilters {
  groupId?: string;
  groupMemberRoles?: string[];
  limitContributorsToGroupMembers?: boolean;
  objectiveId?: string;
}

export function useProjects(filters: ListProjectsFilters) {
  const query = useQuery(LIST_PROJECTS, { variables: { filters } });

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

export type ProjectPhase = "planning" | "execution" | "control" | "completed" | "canceled" | "paused";
export type ProjectHealth = "unknown" | "on_track" | "at_risk" | "off_track";

export interface Project {
  id: string;
  name: string;
  description: string;
  startedAt: Date;
  deadline: Date;
  phase: ProjectPhase;
  health: ProjectHealth;
  private: boolean;

  permissions: Permissions.Permissions;
  phaseHistory: PhaseHistory.PhaseHistory[];
  milestones: Milestones.Milestone[];
  keyResources: KeyResources.KeyResource[];

  parents: Parent[];
  contributors: Contributor[];
  champion?: Person;
  reviewer?: Person;

  isPinned: boolean;

  reviewRequests: ReviewRequests.ReviewRequest[];
}

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      insertedAt
      startedAt
      deadline
      nextUpdateScheduledAt
      phase
      health
      isPinned
      private

      permissions ${Permissions.FRAGMENT}

      phaseHistory ${PhaseHistory.GQL_FRAGMENT}
      keyResources ${KeyResources.GQL_FRAGMENT}
      milestones ${Milestones.FRAGMENT}

      contributors ${fragments.CONTRIBUTOR}
      champion ${People.FRAGMENT}
      reviewer ${People.FRAGMENT}

      nextMilestone ${Milestones.FRAGMENT}
      reviewRequests ${ReviewRequests.FRAGMENT}
    }
  }
`;

type UseProjectResult = QueryResult<{ project: Project }, { id: string }>;

export function useProject(id: string): UseProjectResult {
  return useQuery(GET_PROJECT, { variables: { id } });
}

export function usePostUpdate(options: any) {
  return useMutation(
    gql`
      mutation CreateUpdate($input: CreateUpdateInput!) {
        createUpdate(input: $input) {
          id
        }
      }
    `,
    options,
  );
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
          query: Updates.GET_STATUS_UPDATE,
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
  const [fun, status] = useMutation(gql`
    mutation AddReaction($entityID: ID!, $entityType: String!, $type: String!) {
      addReaction(entityID: $entityID, entityType: $entityType, type: $type) {
        id
      }
    }
  `);

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
  const [fun, status] = useMutation(UPDATE_PROJECT_CONTRIBUTOR, {});

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
  });
}

export function useProjectStatusUpdate(id: string) {
  return useQuery(Updates.GET_STATUS_UPDATE, { variables: { id: id } });
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

export function useSetProjectStartDateMutation(options = {}) {
  return useMutation(
    gql`
      mutation SetProjectStartDate($projectId: ID!, $startDate: Date) {
        setProjectStartDate(projectId: $projectId, startDate: $startDate) {
          id
        }
      }
    `,
    options,
  );
}

export function useSetProjectDueDateMutation(options = {}) {
  return useMutation(
    gql`
      mutation SetProjectDueDate($projectId: ID!, $dueDate: Date) {
        setProjectDueDate(projectId: $projectId, dueDate: $dueDate) {
          id
        }
      }
    `,
    options,
  );
}

export function useUpdateDescriptionMutation(options = {}) {
  return useMutation(
    gql`
      mutation UpdateProjectDescription($projectId: ID!, $description: String) {
        updateProjectDescription(projectId: $projectId, description: $description) {
          id
        }
      }
    `,
    options,
  );
}

export function hasReviewRequest(project: Project): boolean {
  return project.reviewRequests.length > 0;
}

export function getReviewRequest(project: Project): ReviewRequests.ReviewRequest | null {
  if (project.reviewRequests[0]) {
    return project.reviewRequests[0];
  } else {
    return null;
  }
}
