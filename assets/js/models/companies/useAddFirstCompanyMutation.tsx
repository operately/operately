import { gql, useMutation } from "@apollo/client";


const MUTATION = gql`
mutation AddFirstCompany($input: AddFirstCompanyInput!) {
  addFirstCompany(input: $input) {
    id
  }
}
`

export function useAddFirstCompanyMutation(options: any) {
  return useMutation(MUTATION, options);
}
