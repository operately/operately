import { gql, useMutation } from "@apollo/client";


const CHANGE_PASSWORD = gql`
  mutation ChangePasswordFirstTime($input: ChangePasswordInput!) {
    changePasswordFirstTime(input: $input)
  }
`

export function useChangePasswordMutation(options = {}) {
  return useMutation(CHANGE_PASSWORD, options);
}