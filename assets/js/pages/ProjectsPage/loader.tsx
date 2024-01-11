import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

import { useSearchParams } from "react-router-dom";

interface LoaderResult {
  company: Companies.Company;
  projects: Projects.Project[];
  showingAllProjects: boolean;
}

export async function loader({ request }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;

  let showAllProjects = (searchParams.get("allProjects") || "false") === "true";

  return {
    company: await Companies.getCompany(),
    projects: await Projects.getProjects({
      includeSpace: true,
      includeContributors: true,
      includeMilestones: true,
      onlyMyProjects: !showAllProjects,
    }),
    showingAllProjects: showAllProjects,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useFilters() {
  let [searchParams, setSearchParams] = useSearchParams();

  const showMyProjects = () => {
    setSearchParams(() => {
      searchParams.delete("allProjects");
      return searchParams;
    });
  };

  const showAllProjects = () => {
    setSearchParams({ allProjects: "true" });
  };

  return {
    showMyProjects,
    showAllProjects,
  };
}
