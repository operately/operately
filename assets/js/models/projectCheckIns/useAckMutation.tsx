import { useMutation, gql } from "@apollo/client";

const MUTATION = gql`
  mutation Acknowledge($id: ID!) {
    acknowledgeProjectCheckIn(id: $id) {
      id
    }
  }
`;

export function useAckMutation(options?: any) {
  return useMutation(MUTATION, options);
}
