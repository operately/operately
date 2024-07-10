import * as Pages from "@/components/Pages";

import { getCompany, getProject } from "@/api";
import { Company } from "@/models/companies";
import { Project } from "@/models/projects";


interface LoaderResult {
  project: Project;
  company: Company;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await getProject({
      id: params.projectID,
      includeSpace: true,
      includeAccessLevels: true,
    }).then((data) => data.project!),
    company: await getCompany({ 
      id: params.companyId,
    }).then((data) => data.company!)
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
