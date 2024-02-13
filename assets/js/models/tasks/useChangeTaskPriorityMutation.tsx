export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ChangeTaskPriority($input: ChangeTaskPriorityInput!) {
    changeTaskPriority(input: $input) {
      id
    }
  }
`;

export function useChangeTaskPriorityMutation(options: any) {
  return useMutation(MUTATION, options);
}
