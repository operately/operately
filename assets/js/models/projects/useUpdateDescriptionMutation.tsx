import { gql, useMutation } from "@apollo/client";

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
