import { gql, useMutation } from "@apollo/client";

const CREATE_REVIEW_REQUEST = gql`
  mutation CreateProjectReviewRequest($input: CreateProjectReviewRequestInput!) {
    createProjectReviewRequest(input: $input) {
      id
    }
  }
`;

export function useCreateRequest(options = {}) {
  return useMutation(CREATE_REVIEW_REQUEST, options);
}
