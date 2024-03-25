import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Groups from "@/graphql/Groups";
import * as Goals from "@/models/goals";
import * as Companies from "@/models/companies";
import * as Time from "@/utils/time";

import { Company, Group } from "@/gql/generated";
import { useSearchParams } from "react-router-dom";

interface LoadedData {
  company: Company;
  group: Group;
  goals: Goals.Goal[];
}

export async function loader({ request, params }): Promise<LoadedData> {
  const timeframe = new URL(request.url).searchParams.get("timeframe") || Time.currentQuarter();

  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    company: await Companies.getCompany(),
    goals: await Goals.getGoals({
      spaceId: groupData.data.group.id,
      timeframe,
      includeTargets: true,
    }),
    group: groupData.data.group,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useTimeframeControles() {
  let [searchParams, setSearchParams] = useSearchParams();
  const timeframe = searchParams.get("timeframe") || Time.currentQuarter();

  const next = () => {
    setSearchParams({ timeframe: Time.nextQuarter(timeframe) });
  };

  const prev = () => {
    setSearchParams({ timeframe: Time.prevQuarter(timeframe) });
  };

  return [timeframe, next, prev] as const;
}
