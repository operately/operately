export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ChangeTaskDescription($input: ChangeTaskDescriptionInput!) {
    changeTaskDescription(input: $input) {
      id
    }
  }
`;

export function useChangeTaskDescriptionMutation(options: any) {
  return useMutation(MUTATION, options);
}
