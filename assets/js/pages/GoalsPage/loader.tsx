import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Companies from "@/models/companies";

import * as Time from "@/utils/time";

import { useSearchParams } from "react-router-dom";

interface LoaderResult {
  company: Companies.Company;
  goals: Goals.Goal[];
}

export async function loader({ request }): Promise<LoaderResult> {
  const timeframe = new URL(request.url).searchParams.get("timeframe") || Time.currentQuarter();

  return {
    company: await Companies.getCompany(),
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

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
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
