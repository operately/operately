import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation RemoveCompanyMember($personId: ID!) {
    removeCompanyMember(personId: $personId) {
      id
    }
  }
`;

export function useRemoveMemberMutation(options = {}) {
  return useMutation(MUTATION, options);
}
