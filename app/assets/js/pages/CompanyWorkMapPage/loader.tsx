import Api, { type Company, type ProjectTemplate, type Space, type WorkMapItem } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQuery } from "@tanstack/react-query";

interface LoadedData {
  data: {
    workMap: WorkMapItem[];
    company: Company | undefined;
    editableSpaces: Space[];
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
  const editableSpacesInput = { query: "", accessLevel: "edit_access" as const };
  const templatesInput = { archiveStatus: "active" as const };

  await Api.companies.getWorkMapQuery(workMapInput);

  return { companyInput, workMapInput, editableSpacesInput, templatesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { companyInput, workMapInput, editableSpacesInput, templatesInput } = Pages.useLoadedData<LoaderResult>();
  const { data: workMapData } = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));

  const companyQuery = useQuery({ ...Api.companies.getQueryOptions(companyInput), retry: 2 });
  const editableSpacesQuery = useQuery({ ...Api.spaces.searchQueryOptions(editableSpacesInput), retry: 2 });
  const templatesQuery = useQuery({ ...Api.project_templates.listQueryOptions(templatesInput), retry: 2 });

  if (!workMapData) {
    throw new Error("Company Work Map data is unavailable");
  }

  const missingQueries = [
    ...(!companyQuery.data?.company ? [companyQuery] : []),
    ...(!editableSpacesQuery.data ? [editableSpacesQuery] : []),
    ...(!templatesQuery.data ? [templatesQuery] : []),
  ];
  const failedQuery = missingQueries.find((query) => !query.isFetching && !query.isPending);
  const error = failedQuery ? (failedQuery.error ?? new Error("Work Map creation data is unavailable")) : null;

  return {
    data: {
      company: companyQuery.data?.company,
      workMap: workMapData.workMap,
      editableSpaces: editableSpacesQuery.data?.spaces ?? [],
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
