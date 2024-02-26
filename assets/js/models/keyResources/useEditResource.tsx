import { gql, useMutation } from "@apollo/client";

const EDIT_RESOURCE = gql`
  mutation AddKeyResource($input: EditKeyResourceInput!) {
    editKeyResource(input: $input) {
      id
      title
      link
    }
  }
`;

export function useEditResource(options = {}) {
  return useMutation(EDIT_RESOURCE, options);
}
