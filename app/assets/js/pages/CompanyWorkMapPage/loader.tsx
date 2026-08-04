import Api from "@/api";
import { Company, getCompany } from "@/models/companies";
import { getWorkMap, WorkMapItem } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "../../utils/async";

interface LoaderResult {
  data: {
    workMap: WorkMapItem[];
    company: Company;
    spacesCount: number;
  };
  cacheVersion: number;
}

export function companyWorkMapCacheKey(companyId: string): string {
  return `v12-CompanyWorkMap.company-${companyId}`;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: companyWorkMapCacheKey(params.companyId),
    refreshCache,
    fetchFn: async () =>
      await fetchAll({
        workMap: getWorkMap({}).then((d) => d.workMap),
        company: getCompany({ includeGeneralSpace: true }).then((d) => d.company!),
        spacesCount: Api.spaces.countByAccessLevel({ accessLevel: "edit_access" }).then((d) => d.count),
      }),
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
