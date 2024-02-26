import client from "@/graphql/client";
import { gql } from "@apollo/client";

const GET_KEY_RESOURCE = gql`
  query GetKeyResource($id: ID!) {
    keyResource(id: $id) {
      id
      title
      resourceType
      link
    }
  }
`;

export async function getKeyResource(id: string): Promise<any> {
  return client.query({
    query: GET_KEY_RESOURCE,
    variables: { id: id },
    fetchPolicy: "network-only",
  });
}
