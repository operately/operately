import { gql } from "@apollo/client";
import client from "@/graphql/client";

export type { Group } from "@/gql/generated";
export { useEditGroupMutation } from "./useEditGroupMutation";

export async function getGroup(id: string) {
  let data = await client.query({
    query: GET_GROUP,
    variables: {
      id: id,
    },
    fetchPolicy: "network-only",
  });

  return data.data.group;
}

const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      mission
      icon
      color
      isCompanySpace
    }
  }
`;

export async function getGroups() {
  let data = await client.query({
    query: GET_GROUPS,
    fetchPolicy: "network-only",
  });

  return data.data.groups;
}

const GET_GROUPS = gql`
  query GetGroups {
    groups {
      id
      name
      mission
      icon
      color
      isCompanySpace
    }
  }
`;

export function sortGroups(groups: any[]) {
  return [...groups].sort((a, b) => {
    if (a.isCompanySpace) return -100;
    if (b.isCompanySpace) return 100;

    return a.name.localeCompare(b.name);
  });
}
