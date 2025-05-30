import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { getCompany, Company } from "@/models/companies";

interface LoaderResult {
  workMap: ReturnType<typeof convertToWorkMapItem>[];
  company: Company;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "work_map_page",
    path: Paths.goalsPath(),
  });

  return await PageCache.fetch({
    cacheKey: `v2-CompanyWorkMap.company-${params.companyId}`,
    refreshCache,
    fetchFn: async () => {
      const [workMapData, companyData] = await Promise.all([getWorkMap({}), getCompany({ id: params.companyId })]);

      return {
        workMap: workMapData.workMap ? workMapData.workMap.map(convertToWorkMapItem) : [],
        company: companyData.company!,
      };
    },
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
