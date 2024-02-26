import { gql, useMutation } from "@apollo/client";

const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
    }
  }
`;

export function useCreateMutation(options = {}) {
  return useMutation(CREATE_PROJECT, options);
}
