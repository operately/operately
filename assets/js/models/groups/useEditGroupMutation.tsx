import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation EditGroup($input: EditGroupInput!) {
    editGroup(input: $input) {
      id
    }
  }
`;

export function useEditGroupMutation(options?: any) {
  return useMutation(MUTATION, options);
}
