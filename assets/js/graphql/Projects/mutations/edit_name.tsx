import { gql, useMutation } from "@apollo/client";

const EDIT_PROJECT_NAME = gql`
  mutation EditProjectName($input: EditProjectNameInput!) {
    editProjectName(input: $input) {
      id
    }
  }
`;

export function useEditProjectName(options = {}) {
  return useMutation(EDIT_PROJECT_NAME, options);
}
