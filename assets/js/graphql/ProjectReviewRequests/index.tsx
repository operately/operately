import { gql, useMutation } from "@apollo/client";

import * as People from "@/graphql/People";

export const FRAGMENT = `
  {
    id
    content
    insertedAt
    updatedAt
    author ${People.FRAGMENT}
  }
`;

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
