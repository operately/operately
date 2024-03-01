import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation PostCheckIn($input: PostProjectCheckInInput!) {
    postProjectCheckIn(input: $input) {
      id
    }
  }
`;

export function usePostMutation(options?: any) {
  return useMutation(MUTATION, options);
}
