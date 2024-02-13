export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation CloseTask($input: CloseTaskInput!) {
    closeTask(input: $input) {
      id
    }
  }
`;

export function useCloseTaskMutation(options: any) {
  return useMutation(MUTATION, options);
}
