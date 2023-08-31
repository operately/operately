import { gql, useMutation } from "@apollo/client";

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
    }
  }
`;

export function useCreateProject(options = {}) {
  return useMutation(CREATE_PROJECT, options);
}
