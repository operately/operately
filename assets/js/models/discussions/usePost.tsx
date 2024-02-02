import { gql, useMutation } from "@apollo/client";

export function usePost(options = {}) {
  return useMutation(POST_MUTATION, options);
}

const POST_MUTATION = gql`
  mutation PostDiscussion($input: PostDiscussionInput!) {
    postDiscussion(input: $input) {
      id
    }
  }
`;
