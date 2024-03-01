import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation AddReaction($input: AddReactionInput!) {
    addReaction(input: $input) {
      id
    }
  }
`;

export function useAddReaction(options?: any) {
  return useMutation(MUTATION, options);
}
