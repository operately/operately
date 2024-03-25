import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
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

  return {
    company: await Companies.getCompany(),
    group: await Groups.getGroup(params.id),
    goals: await Goals.getGoals({
      includeTargets: true,
      includeSpace: true,
      timeframe: timeframe,
      includeLongerTimeframes: true,
      includeProjects: true,
      includeLastCheckIn: true,
    }),
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
