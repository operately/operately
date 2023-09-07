import { gql, useMutation } from "@apollo/client";

export const EDIT_PROJECT_TIMELINE = gql`
  mutation EditProjectTimeline($input: EditProjectTimelineInput!) {
    editProjectTimeline(input: $input) {
      id
    }
  }
`;

export function useEditProjectTimeline(options = {}) {
  return useMutation(EDIT_PROJECT_TIMELINE, options);
}
