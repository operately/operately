export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation AssignPersonToTask($input: AssignPersonToTaskInput!) {
    assignPersonToTask(input: $input) {
      id
    }
  }
`;

export function useAssignPersonToTaskMutation(options: any) {
  return useMutation(MUTATION, options);
}
