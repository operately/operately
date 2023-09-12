import { gql, useMutation } from "@apollo/client";

export const ARCHIVE_PROJECT = gql`
  mutation ArchiveProject($projectId: ID!) {
    archiveProject(projectId: $projectId) {
      id
    }
  }
`;

export function useArchiveProject(options = {}) {
  return useMutation(ARCHIVE_PROJECT, options);
}

export function useArchiveForm({ variables, onSuccess }) {
  const [archiveProject, { loading }] = useArchiveProject({
    variables,
    onCompleted: onSuccess,
  });

  const submit = () => archiveProject();
  const valid = true;

  return {
    submit,
    valid,
    loading,
  };
}
