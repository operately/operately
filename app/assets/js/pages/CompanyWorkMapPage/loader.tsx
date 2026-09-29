import Api, { type Company, type ProjectTemplate, type WorkMapItem } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";
import { useQuery } from "@tanstack/react-query";

interface LoadedData {
  data: {
    workMap: WorkMapItem[];
    company: Company | undefined;
    spacesCount: number | undefined;
    templates: ProjectTemplate[];
  };
  creationData: {
    isLoading: boolean;
    error: Error | null;
    retry: () => Promise<void>;
  };
}

export async function loader() {
  const companyInput = { includeGeneralSpace: true };
  const workMapInput = {};
  const spacesCountInput = { accessLevel: "edit_access" as const };
  const templatesInput = { archiveStatus: "active" as const };
  // Capture the company scope before navigation can change the global API headers.
  const queryKeys = {
    workMap: Api.companies.getWorkMapQueryKey(workMapInput),
    company: Api.companies.getQueryKey(companyInput),
    spacesCount: Api.spaces.countByAccessLevelQueryKey(spacesCountInput),
    templates: Api.project_templates.listQueryKey(templatesInput),
  };

  await Api.companies.getWorkMapQuery(workMapInput);

  return { companyInput, workMapInput, spacesCountInput, templatesInput, queryKeys };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { companyInput, workMapInput, spacesCountInput, templatesInput, queryKeys } =
    Pages.useLoadedData<LoaderResult>();
  const { data: workMapData } = useLoadedQuery({
    ...Api.companies.getWorkMapQueryOptions(workMapInput),
    queryKey: queryKeys.workMap,
  });

  // Generated query functions use these captured keys for request headers as well.
  const companyQuery = useQuery({
    ...Api.companies.getQueryOptions(companyInput),
    queryKey: queryKeys.company,
    retry: 2,
  });
  const spacesCountQuery = useQuery({
    ...Api.spaces.countByAccessLevelQueryOptions(spacesCountInput),
    queryKey: queryKeys.spacesCount,
    retry: 2,
  });
  const templatesQuery = useQuery({
    ...Api.project_templates.listQueryOptions(templatesInput),
    queryKey: queryKeys.templates,
    retry: 2,
  });

  assertPresent(workMapData, "Company Work Map data is unavailable");

  const missingQueries = [
    ...(!companyQuery.data?.company ? [companyQuery] : []),
    ...(spacesCountQuery.data?.count == null ? [spacesCountQuery] : []),
    ...(!templatesQuery.data ? [templatesQuery] : []),
  ];
  const failedQuery = missingQueries.find((query) => !query.isFetching && !query.isPending);
  const error = failedQuery ? (failedQuery.error ?? new Error("Work Map creation data is unavailable")) : null;

  return {
    data: {
      company: companyQuery.data?.company,
      workMap: workMapData.workMap,
      spacesCount: spacesCountQuery.data?.count,
      templates: templatesQuery.data?.templates ?? [],
    },
    creationData: {
      isLoading: missingQueries.length > 0 && !error,
      error,
      retry: async () => {
        await Promise.all(missingQueries.map((query) => query.refetch()));
      },
    },
  };
}
