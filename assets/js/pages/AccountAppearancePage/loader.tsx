import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Me from "@/graphql/Me";
import * as People from "@/graphql/People";

interface LoadedData {
  me: People.Person;
}

export async function loader(): Promise<LoadedData> {
  let meData = await client.query({
    query: Me.GET_ME,
  });

  return {
    me: meData.data.me,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
