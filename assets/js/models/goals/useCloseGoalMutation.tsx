export { Goal } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation CloseGoal($input: CloseGoalInput!) {
    closeGoal(input: $input) {
      id
    }
  }
`;

export function useCloseGoalMutation(options: any) {
  return useMutation(MUTATION, options);
}
