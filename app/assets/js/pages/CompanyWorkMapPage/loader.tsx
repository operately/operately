import { Company, getCompany } from "@/models/companies";
import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  data: {
    workMap: ReturnType<typeof convertToWorkMapItem>[];
    company: Company;
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId! });

  await redirectIfFeatureNotEnabled(params, {
    feature: "work_map_page",
    path: paths.goalsPath(),
  });

  return await PageCache.fetch({
    cacheKey: `v3-CompanyWorkMap.company-${params.companyId}`,
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
