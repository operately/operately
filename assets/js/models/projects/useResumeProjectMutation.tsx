export { Project } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation ResumeProject($input: ResumeProjectInput!) {
    resumeProject(input: $input) {
      id
    }
  }
`;

export function useResumeProjectMutation(options: any) {
  return useMutation(MUTATION, options);
}
