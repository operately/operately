export { Goal } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ChangeGoalParent($input: ChangeGoalParentInput!) {
    changeGoalParent(input: $input) {
      id
    }
  }
`;

export function useChangeGoalParentMutation(options: any) {
  return useMutation(MUTATION, options);
}
