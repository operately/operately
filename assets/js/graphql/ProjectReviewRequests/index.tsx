import { gql, useMutation } from "@apollo/client";

import * as People from "@/graphql/People";

export const FRAGMENT = `
  {
    id
    content
    insertedAt
    updatedAt
    status
    reviewId
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

export interface ReviewRequest {
  id: string;
  content: string;
  insertedAt: string;
  updatedAt: string;
  author: People.Person;
  status: "pending" | "completed";
  reviewId: string | null;
}

export const GET_REQUEST = gql`
  query GetProjectReviewRequest($id: ID!) {
    projectReviewRequest(id: $id) ${FRAGMENT}
  }
`;
