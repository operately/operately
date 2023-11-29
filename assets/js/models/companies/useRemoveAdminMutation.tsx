import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation RemoveCompanyAdmin($personId: ID!) {
    removeCompanyAdmin(personId: $personId) {
      id
    }
  }
`;

export function useRemoveAdminMutation(options = {}) {
  return useMutation(MUTATION, options);
}
