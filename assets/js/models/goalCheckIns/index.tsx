import { gql, useMutation } from "@apollo/client";

export function usePostUpdate(options: any) {
  return useMutation(
    gql`
      mutation CreateUpdate($input: CreateUpdateInput!) {
        createUpdate(input: $input) {
          id
        }
      }
    `,
    options,
  );
}

export function useEditUpdate(options: any) {
  return useMutation(
    gql`
      mutation EditUpdate($input: EditUpdateInput!) {
        editUpdate(input: $input) {
          id
        }
      }
    `,
    options,
  );
}
