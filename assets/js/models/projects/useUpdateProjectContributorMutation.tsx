import { gql, useMutation } from "@apollo/client";

const UPDATE_PROJECT_CONTRIBUTOR = gql`
  mutation UpdateProjectContributor($contribId: ID!, $personId: ID!, $responsibility: String!) {
    updateProjectContributor(contribId: $contribId, personId: $personId, responsibility: $responsibility) {
      id
    }
  }
`;

export function useUpdateProjectContributorMutation(contribId: string) {
  const [fun, status] = useMutation(UPDATE_PROJECT_CONTRIBUTOR, {});

  const updateColab = (personId: string, responsibility: string) => {
    return fun({
      variables: {
        contribId: contribId,
        personId: personId,
        responsibility: responsibility,
      },
    });
  };

  return [updateColab, status] as const;
}
