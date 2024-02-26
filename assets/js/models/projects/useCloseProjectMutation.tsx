import { gql, useMutation } from "@apollo/client";

const CLOSE_PROJECT = gql`
  mutation CloseProject($input: CloseProjectInput!) {
    closeProject(input: $input) {
      id
    }
  }
`;

export function useCloseProjectMutation(options = {}) {
  return useMutation(CLOSE_PROJECT, options);
}
