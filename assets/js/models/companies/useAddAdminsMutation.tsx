import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation AddAdminsMutation($peopleIds: [ID!]!) {
    addCompanyAdmins(peopleIds: $peopleIds)
  }
`;

export function useAddAdminsMutation(options: any) {
  return useMutation(MUTATION, options);
}
