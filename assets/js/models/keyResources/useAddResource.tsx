import { gql, useMutation } from "@apollo/client";

const ADD_RESOURCE = gql`
  mutation AddKeyResource($input: AddKeyResourceInput!) {
    addKeyResource(input: $input) {
      id
      title
      link
    }
  }
`;

export function useAddResource(options = {}) {
  return useMutation(ADD_RESOURCE, options);
}
