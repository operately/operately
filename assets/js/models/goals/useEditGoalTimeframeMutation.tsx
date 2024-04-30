export { Goal } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation EditGoalTimeframe($input: EditGoalTimeframeInput!) {
    editGoalTimeframe(input: $input) {
      id
    }
  }
`;

export function useEditGoalTimeframeMutation(options: any) {
  return useMutation(MUTATION, options);
}
