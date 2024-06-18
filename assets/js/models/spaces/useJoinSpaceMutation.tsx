export { Group } from "@/gql";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation JoinSpace($input: JoinSpaceInput!) {
    joinSpace(input: $input) {
      id
    }
  }
`;

export function useJoinSpaceMutation(options: any) {
  return useMutation(MUTATION, options);
}
