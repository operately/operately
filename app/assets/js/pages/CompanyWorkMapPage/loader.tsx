import Api, { type Company, type ProjectTemplate, type WorkMapItem } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

interface LoadedData {
  data: {
    workMap: WorkMapItem[];
    company: Company;
    spacesCount: number;
    templates: ProjectTemplate[];
  };
}

export async function loader() {
  const companyInput = { includeGeneralSpace: true };
  const workMapInput = {};
  const spacesCountInput = { accessLevel: "edit_access" as const };
  const templatesInput = { archiveStatus: "active" as const };

  await Promise.all([
    Api.companies.getQuery(companyInput),
    Api.companies.getWorkMapQuery(workMapInput),
    Api.spaces.countByAccessLevelQuery(spacesCountInput),
    Api.project_templates.listQuery(templatesInput),
  ]);

  return { companyInput, workMapInput, spacesCountInput, templatesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { companyInput, workMapInput, spacesCountInput, templatesInput } = Pages.useLoadedData<LoaderResult>();
  const { data: companyData } = useLoadedQuery(Api.companies.getQueryOptions(companyInput));
  const { data: workMapData } = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const { data: spacesCountData } = useLoadedQuery(Api.spaces.countByAccessLevelQueryOptions(spacesCountInput));
  const { data: templatesData } = useLoadedQuery(Api.project_templates.listQueryOptions(templatesInput));

  if (!companyData?.company || !workMapData || !spacesCountData || !templatesData) {
    throw new Error("Company Work Map data is unavailable");
  }

  return {
    data: {
      company: companyData.company,
      workMap: workMapData.workMap,
      spacesCount: spacesCountData.count,
      templates: templatesData.templates ?? [],
    },
  };
}
