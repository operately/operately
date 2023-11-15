import { gql, useMutation } from "@apollo/client";

export const MOVE_PROJECT_TO_SPACE = gql`
  mutation MoveProjectToSpace($input: ProjectMoveInput!) {
    moveProjectToSpace(input: $input) {
      id
    }
  }
`;

export function useMoveProjectToSpaceMutation(options = {}) {
  return useMutation(MOVE_PROJECT_TO_SPACE, options);
}
