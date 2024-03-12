import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetGroupParams {
  includeMembers?: boolean;
}

export async function getGroup(id: string, params: GetGroupParams = {}) {
  let data = await client.query({
    query: GET_GROUP,
    variables: {
      id: id,
      includeMembers: !!params.includeMembers,
    },
    fetchPolicy: "network-only",
  });

  return data.data.group;
}

const GET_GROUP = gql`
  query GetGroup($id: ID!, $includeMembers: Boolean!) {
    group(id: $id) {
      id
      name
      mission
      icon
      color
      isCompanySpace
      isMember

      members @include(if: $includeMembers) {
        id
        fullName
        avatarUrl
        title
      }
    }
  }
`;
