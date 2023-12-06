import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) {
      id
    }
  }
`;

export function useCreateGoalMutation(options?: any) {
  return useMutation(MUTATION, options);
}
