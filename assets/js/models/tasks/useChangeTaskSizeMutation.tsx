export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ChangeTaskSize($input: ChangeTaskSizeInput!) {
    changeTaskSize(input: $input) {
      id
    }
  }
`;

export function useChangeTaskSizeMutation(options: any) {
  return useMutation(MUTATION, options);
}
