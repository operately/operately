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

export async function loader({ params, request }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;
  const filter = parseFilter(searchParams);

  const companyPromise = Companies.getCompany({ id: params.companyId }).then((d) => d.company!);
  const projectsPromise = Projects.getProjects({
    includeSpace: true,
    includeContributors: true,
    includeMilestones: true,
    includeLastCheckIn: true,
    includePrivacy: true,
    onlyMyProjects: filter === "my-projects",
    onlyReviewedByMe: filter === "reviewed-by-me",
  }).then((data) => data.projects!);

  return {
    company: await companyPromise,
    projects: await projectsPromise,
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
