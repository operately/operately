import { gql, useMutation } from "@apollo/client";

export function useAddProjectContributorMutation(projectId: string) {
  const [fun, status] = useMutation(gql`
    mutation AddProjectContributor($projectId: ID!, $personId: ID!, $responsibility: String!, $role: String!) {
      addProjectContributor(projectId: $projectId, personId: $personId, responsibility: $responsibility, role: $role) {
        id
      }
    }
  `);

  const addColab = (personId: string, responsibility: string, role = "contributor") => {
    return fun({
      variables: {
        projectId: projectId,
        personId: personId,
        responsibility: responsibility,
        role: role,
      },
    });
  };

  return [addColab, status] as const;
}
