import * as Groups from "@/graphql/Groups";
import * as Pages from "@/components/Pages";

import client from "@/graphql/client";

interface LoaderData {
  groups: Groups.Group[];
}

export async function loader(): Promise<LoaderData> {
  const groupData = await client.query({
    query: Groups.LIST_GROUPS,
    fetchPolicy: "network-only",
  });

  return {
    groups: groupData.data.groups,
  };
}

export function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}
