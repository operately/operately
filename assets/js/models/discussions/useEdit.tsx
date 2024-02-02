import { gql, useMutation } from "@apollo/client";

export function useEdit(options = {}) {
  return useMutation(EDIT_MUTATION, options);
}

const EDIT_MUTATION = gql`
  mutation EditDiscussion($input: EditDiscussionInput!) {
    editDiscussion(input: $input) {
      id
    }
  }
`;
