import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation EditComment($input: EditCommentInput!) {
    editComment(input: $input) {
      id
    }
  }
`;

export function useEditComment(options = {}) {
  return useMutation(MUTATION, options);
}
