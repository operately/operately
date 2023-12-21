import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation DisconnectGoalFromProject($goalId: ID!, $projectId: ID!) {
    disconnectGoalFromProject(goalId: $goalId, projectId: $projectId) {
      id
    }
  }
`;

export function useDisconnectGoalFromProjectMutation(options = {}) {
  return useMutation(MUTATION, options);
}
