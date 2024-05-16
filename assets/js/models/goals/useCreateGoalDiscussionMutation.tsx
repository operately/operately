export { Goal } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation CreateGoalDiscussion($input: CreateGoalDiscussionInput!) {
    createGoalDiscussion(input: $input) {
      id
    }
  }
`;

export function useCreateGoalDiscussionMutation(options: any) {
  return useMutation(MUTATION, options);
}
