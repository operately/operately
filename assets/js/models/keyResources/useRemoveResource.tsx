import { gql, useMutation } from "@apollo/client";

const REMOVE_RESOURCE = gql`
  mutation RemoveKeyResource($id: ID!) {
    removeKeyResource(id: $id) {
      id
    }
  }
`;

export function useRemoveResource(options = {}) {
  return useMutation(REMOVE_RESOURCE, options);
}
