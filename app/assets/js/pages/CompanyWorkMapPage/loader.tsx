import { Company, getCompany } from "@/models/companies";
import { getWorkMap, WorkMapItem } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "../../utils/async";

interface LoaderResult {
  data: {
    workMap: WorkMapItem[];
    company: Company;
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: `v12-CompanyWorkMap.company-${params.companyId}`,
    refreshCache,
    fetchFn: async () =>
      await fetchAll({
        workMap: getWorkMap({}).then((d) => d.workMap),
        company: getCompany({ id: params.companyId, includeGeneralSpace: true }).then((d) => d.company!),
      }),
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
