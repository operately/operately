import { getSpace, Space } from "@/models/spaces";
import { getWorkMap, WorkMapItem } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import Api, { Company, type ProjectTemplate } from "@/api";

interface LoaderResult {
  data: {
    workMap: WorkMapItem[];
    space: Space;
    company: Company;
    templates: ProjectTemplate[];
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return PageCache.fetch({
    cacheKey: `v7-SpaceWorkMap.space-${params.id}`,
    refreshCache,
    fetchFn: async () => {
      const company = await Api.companies.get({}).then((d) => d.company!);

      const { workMap, space, templates } = await fetchAll({
        workMap: getWorkMap({ spaceId: params.id }).then((d) => d.workMap),
        space: getSpace({ id: params.id, includeAccessLevels: true, includePermissions: true }),
        templates: Api.project_templates.list({ archiveStatus: "active" }).then((data) => data.templates ?? []),
      });

      return {
        workMap,
        space,
        company,
        templates,
      };
    },
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
