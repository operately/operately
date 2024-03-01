import { gql, useMutation } from "@apollo/client";

const REMOVE_PROJECT_CONTRIBUTOR = gql`
  mutation RemoveProjectContributor($contribId: ID!) {
    removeProjectContributor(contribId: $contribId) {
      id
    }
  }
`;

export function useRemoveProjectContributorMutation(contribId: string) {
  return useMutation(REMOVE_PROJECT_CONTRIBUTOR, {
    variables: { contribId: contribId },
  });
}
