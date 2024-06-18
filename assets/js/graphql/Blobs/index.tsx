import client from "@/graphql/client";
import { gql } from "@apollo/client";

interface BlobInput {
  filename: string;
}

const CREATE_BLOB_MUTATION = gql`
  mutation CreateBlob($input: BlobInput!) {
    createBlob(input: $input) {
      id
      url
      signedUploadUrl
      storageType
    }
  }
`;

export function CreateBlob(input: BlobInput) {
  return client.mutate({
    mutation: CREATE_BLOB_MUTATION,
    variables: { input },
  });
}
