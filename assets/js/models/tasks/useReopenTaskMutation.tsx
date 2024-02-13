export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ReopenTask($input: ReopenTaskInput!) {
    reopenTask(input: $input) {
      id
    }
  }
`;

export function useReopenTaskMutation(options: any) {
  return useMutation(MUTATION, options);
}
