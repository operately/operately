import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation EditProjectName($input: EditProjectNameInput!) {
    editProjectName(input: $input) {
      id
    }
  }
`;

export function useEditNameMutation(options = {}) {
  return useMutation(MUTATION, options);
}
