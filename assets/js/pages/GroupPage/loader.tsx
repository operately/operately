import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Groups from "@/graphql/Groups";

import { Group } from "@/gql/generated";

interface LoadedData {
  group: Group;
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return { group: groupData.data.group };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
