import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ArchiveGoal($goalId: ID!) {
    archiveGoal(goalId: $goalId) {
      id
    }
  }
`;

export function useArchiveGoalMutation(options = {}) {
  return useMutation(MUTATION, options);
}
