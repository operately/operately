import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Companies from "@/models/companies";

import * as Time from "@/utils/time";

import { useSearchParams } from "react-router-dom";

interface LoaderResult {
  company: Companies.Company;
  goals: Goals.Goal[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany(),
    goals: await Goals.getGoals({
      includeTargets: true,
      includeSpace: true,
      timeframe: getTimeframe(),
      includeLongerTimeframes: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}

export function useTimeframeControles() {
  const timeframe = getTimeframe();

  let [_searchParams, setSearchParams] = useSearchParams();

  const next = () => {
    setSearchParams({ timeframe: "Q2 2021" });
  };

  const prev = () => {
    setSearchParams({ timeframe: "Q1 2021" });
  };

  return [timeframe, next, prev] as const;
}

function getTimeframe(): string {
  const query = new URLSearchParams(window.location.search);

  const timeframe = query.get("timeframe");
  if (timeframe) {
    return timeframe;
  } else {
    return Time.currentQuarter();
  }
}
