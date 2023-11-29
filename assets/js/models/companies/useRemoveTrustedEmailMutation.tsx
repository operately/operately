import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation RemoveCompanyTrustedEmailDomain($companyID: ID!, $domain: String!) {
    removeCompanyTrustedEmailDomain(companyID: $companyID, domain: $domain) {
      id
    }
  }
`;

export function useRemoveTrustedEmailDomainMutation(options = {}) {
  return useMutation(MUTATION, options);
}
