import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation CreateGoal($input: EditGoalInput!) {
    editGoal(input: $input) {
      id
    }
  }
`;

export function useEditGoalMutation(options?: any) {
  return useMutation(MUTATION, options);
}
