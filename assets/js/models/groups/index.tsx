import { gql } from "@apollo/client";
import client from "@/graphql/client";

export type { Group } from "@/gql/generated";

export { getGroup } from "./getGroup";
export { useJoinSpaceMutation } from "./useJoinSpaceMutation";
export { useEditGroupMutation } from "./useEditGroupMutation";

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
