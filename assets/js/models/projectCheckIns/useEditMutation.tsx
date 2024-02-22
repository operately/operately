import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation EditCheckIn($input: EditProjectCheckInInput!) {
    editProjectCheckIn(input: $input) {
      id
    }
  }
`;

export function useEditMutation(options?: any) {
  return useMutation(MUTATION, options);
}
