export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation EditTaskName($input: EditTaskNameInput!) {
    editTaskName(input: $input) {
      id
    }
  }
`;

export function useEditTaskNameMutation(options: any) {
  return useMutation(MUTATION, options);
}
