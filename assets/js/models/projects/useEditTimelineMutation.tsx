import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation EditProjectTimeline($input: EditProjectTimelineInput!) {
    editProjectTimeline(input: $input) {
      id
    }
  }
`;

export function useEditTimelineMutation(options = {}) {
  return useMutation(MUTATION, options);
}
