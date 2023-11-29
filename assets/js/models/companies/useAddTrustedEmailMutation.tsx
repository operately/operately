import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation AddCompanyTrustedEmailDomain($companyID: ID!, $domain: String!) {
    addCompanyTrustedEmailDomain(companyID: $companyID, domain: $domain) {
      id
    }
  }
`;

export function useAddTrustedEmailDomainMutation(options = {}) {
  return useMutation(MUTATION, options);
}
