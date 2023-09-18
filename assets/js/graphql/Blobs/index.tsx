import client from "@/graphql/client";
import { gql } from "@apollo/client";

import * as People from "@/graphql/People";

export interface Blob {
  author: People.Person;
  status: string;
  filename: string;

  signedUploadUrl: string;
}

export interface BlobInput {
  filename: string;
}

const CREATE_BLOB_MUTATION = gql`
  mutation CreateBlob($input: BlobInput!) {
    createBlob(input: $input) {
      id
      signedUploadUrl
    }
  }
`;

export function CreateBlob(input: BlobInput) {
  return client.mutate({
    mutation: CREATE_BLOB_MUTATION,
    variables: { input },
  });
}
