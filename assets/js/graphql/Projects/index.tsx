import { gql, useMutation } from "@apollo/client";

// import * as fragments from "@/graphql/Fragments";
// import * as KeyResources from "./key_resources";
// import * as Milestones from "./milestones";
// import * as Permissions from "./permissions";
// import * as Updates from "./updates";
// import * as ReviewRequests from "@/graphql/ProjectReviewRequests";
// import * as People from "@/graphql/People";

// export { Project } from "@/gql";

export { useCreateProject } from "./mutations/create";
export { useEditProjectTimeline } from "./mutations/edit_timeline";
export { useEditProjectName } from "./mutations/edit_name";
export { useArchiveForm } from "./mutations/archive";

// export const LIST_PROJECTS = gql`
//   query ListProjects($filters: ProjectListFilters) {
//     projects(filters: $filters) {
//       id
//       name
//       private

//       insertedAt
//       updatedAt
//       startedAt
//       closedAt

//       deadline
//       health
//       isArchived
//       isOutdated
//       status
//       permissions ${Permissions.FRAGMENT}
//       contributors ${fragments.CONTRIBUTOR}
//       keyResources ${KeyResources.GQL_FRAGMENT}
//       nextMilestone ${Milestones.FRAGMENT}
//       reviewRequests ${ReviewRequests.FRAGMENT}
//       champion ${People.FRAGMENT}
//       reviewer ${People.FRAGMENT}
//       lastCheckIn ${Updates.UPDATE_FRAGMENT}

//       milestones {
//         id
//         status
//       }
//     }
//   }
// `;

// export const GET_PROJECT = gql`
//   query GetProject($id: ID!) {
//     project(id: $id) {
//       id
//       name
//       description
//       insertedAt
//       startedAt
//       deadline
//       nextUpdateScheduledAt
//       health
//       isPinned
//       isArchived
//       archivedAt
//       private
//       spaceId
//       status
//       closedAt
//       retrospective

//       lastCheckIn ${Updates.UPDATE_FRAGMENT}
//       permissions ${Permissions.FRAGMENT}

//       keyResources ${KeyResources.GQL_FRAGMENT}
//       milestones ${Milestones.FRAGMENT}

//       contributors ${fragments.CONTRIBUTOR}
//       champion ${People.FRAGMENT}
//       reviewer ${People.FRAGMENT}

//       nextMilestone ${Milestones.FRAGMENT}
//       reviewRequests ${ReviewRequests.FRAGMENT}
//     }
//   }
// `;

// export function useEditUpdate(options: any) {
//   return useMutation(
//     gql`
//       mutation EditUpdate($input: EditUpdateInput!) {
//         editUpdate(input: $input) {
//           id
//         }
//       }
//     `,
//     options,
//   );
// }

// export function usePostUpdate(options: any) {
//   return useMutation(
//     gql`
//       mutation CreateUpdate($input: CreateUpdateInput!) {
//         createUpdate(input: $input) {
//           id
//         }
//       }
//     `,
//     options,
//   );
// }

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
