import { gql, useMutation } from "@apollo/client";

export function usePost(options = {}) {
  return useMutation(MUTATION, options);
}

const MUTATION = gql`
  mutation PostDiscussion($input: CreateDiscussionInput!) {
    postDiscussion(input: $input) {
      id
    }
  }
`;
