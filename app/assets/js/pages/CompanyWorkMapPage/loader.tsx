import Api, { type ProjectTemplate } from "@/api";
import * as Companies from "@/models/companies";
import { Company, getCompany } from "@/models/companies";
import { getWorkMap, WorkMapItem } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "../../utils/async";

interface LoaderResult {
  data: {
    workMap: WorkMapItem[];
    company: Company;
    spacesCount: number;
    projectTemplatesEnabled: boolean;
    templates: ProjectTemplate[];
  };
  cacheVersion: number;
}

export function companyWorkMapCacheKey(companyId: string): string {
  return `v13-CompanyWorkMap.company-${companyId}`;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: companyWorkMapCacheKey(params.companyId),
    refreshCache,
    fetchFn: async () => {
      const company = await getCompany({ includeGeneralSpace: true }).then((d) => d.company!);
      const projectTemplatesEnabled = Companies.hasFeature(company, "project_templates");

      const { workMap, spacesCount, templates } = await fetchAll({
        workMap: getWorkMap({}).then((d) => d.workMap),
        spacesCount: Api.spaces.countByAccessLevel({ accessLevel: "edit_access" }).then((d) => d.count),
        templates: projectTemplatesEnabled
          ? Api.project_templates.list({ archiveStatus: "active" }).then((data) => data.templates ?? [])
          : Promise.resolve([] as ProjectTemplate[]),
      });

      return {
        workMap,
        company,
        spacesCount,
        projectTemplatesEnabled,
        templates,
      };
    },
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
