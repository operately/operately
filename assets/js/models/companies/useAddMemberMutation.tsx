import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation AddMember($input: AddCompanyMemberInput!) {
    addCompanyMember(input: $input) {
      id
      fullName
      email
      title
    }
  }
`;

export function useAddMemberMutation(options = {}) {
  return useMutation(MUTATION, options);
}
