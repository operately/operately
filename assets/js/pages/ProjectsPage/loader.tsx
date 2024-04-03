import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

import { useSearchParams } from "react-router-dom";

type Filter = "my-projects" | "reviewed-by-me" | "all-projects";

interface LoaderResult {
  company: Companies.Company;
  projects: Projects.Project[];
  activeFilter: Filter;
}

export async function loader({ request }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;
  const filter = parseFilter(searchParams);

  return {
    company: await Companies.getCompany(),
    projects: await Projects.getProjects({
      includeSpace: true,
      includeContributors: true,
      includeMilestones: true,
      includeLastCheckIn: true,
      filters: {
        filter: filter,
      },
    }),
    activeFilter: filter,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useFilters() {
  let [_searchParams, setSearchParams] = useSearchParams();

  const setFilter = (filter: Filter) => {
    setSearchParams({ filter });
  };

  return {
    setFilter,
  };
}

function parseFilter(searchParams: URLSearchParams): Filter {
  const fitler = searchParams.get("filter");

  switch (fitler) {
    case "my-projects":
      return "my-projects";
    case "reviewed-by-me":
      return "reviewed-by-me";
    case "all-projects":
      return "all-projects";
    default:
      return "my-projects";
  }
}
