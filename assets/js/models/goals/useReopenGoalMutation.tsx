export { Goal } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ReopenGoal($input: ReopenGoalInput!) {
    reopenGoal(input: $input) {
      id
    }
  }
`;

export function useReopenGoalMutation(options: any) {
  return useMutation(MUTATION, options);
}
