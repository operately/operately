import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation MoveProjectToSpace($input: ProjectMoveInput!) {
    moveProjectToSpace(input: $input) {
      id
    }
  }
`;

export function useMoveProjectToSpaceMutation(options = {}) {
  return useMutation(MUTATION, options);
}
