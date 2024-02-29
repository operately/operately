export { Project } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation PauseProject($input: PauseProjectInput!) {
    pauseProject(input: $input) {
      id
    }
  }
`;

export function usePauseProjectMutation(options: any) {
  return useMutation(MUTATION, options);
}
