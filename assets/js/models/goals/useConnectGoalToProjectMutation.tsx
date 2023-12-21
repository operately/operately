import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ConnectGoalToProject($goalId: ID!, $projectId: ID!) {
    connectGoalToProject(goalId: $goalId, projectId: $projectId) {
      id
    }
  }
`;

export function useConnectGoalToProjectMutation(options = {}) {
  return useMutation(MUTATION, options);
}
