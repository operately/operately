import { Company, getCompany } from "@/models/companies";
import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";

interface LoaderResult {
  data: {
    workMap: ReturnType<typeof convertToWorkMapItem>[];
    company: Company;
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId! });

  return await PageCache.fetch({
    cacheKey: `v4-CompanyWorkMap.company-${params.companyId}`,
    refreshCache,
    fetchFn: async () => {
      const [workMapData, companyData] = await Promise.all([getWorkMap({}), getCompany({ id: params.companyId })]);

      return {
        workMap: workMapData.workMap ? workMapData.workMap.map((i) => convertToWorkMapItem(paths, i)) : [],
        company: companyData.company!,
      };
    },
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
