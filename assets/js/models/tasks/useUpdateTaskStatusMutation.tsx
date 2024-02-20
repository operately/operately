export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation UpdateTaskStatus($input: UpdateTaskStatusInput!) {
    updateTaskStatus(input: $input) {
      id
    }
  }
`;

export function useUpdateTaskStatusMutation(options: any) {
  return useMutation(MUTATION, options);
}
