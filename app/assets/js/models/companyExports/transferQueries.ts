import Api, {
  type CompanyTransfersListExportRunsInput,
  type CompanyTransfersListExportRunsResult,
  type CompanyTransfersListImportRunsInput,
  type CompanyTransfersListImportRunsResult,
} from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { invalidateCompanyListQueries } from "@/models/companies/companyLifecycle";
import { isActiveRun, mergeRun, sortRuns } from "./index";

const POLL_INTERVAL_MS = 2_000;
const selectExportRuns = (data: CompanyTransfersListExportRunsResult) => sortRuns(data.exportRuns);
const selectImportRuns = (data: CompanyTransfersListImportRunsResult) => sortRuns(data.importRuns);

export function useExportRuns(input: CompanyTransfersListExportRunsInput) {
  return useLoadedQuery({
    ...Api.company_transfers.listExportRunsQueryOptions(input),
    select: selectExportRuns,
    refetchInterval: (query) => (query.state.data?.exportRuns.some(isActiveRun) ? POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: true,
  });
}

/** Read cached imports and poll every two seconds while any run is pending or running. */
export function useImportRuns(input: CompanyTransfersListImportRunsInput) {
  const client = useQueryClient();
  const query = useLoadedQuery({
    ...Api.company_transfers.listImportRunsQueryOptions(input),
    select: selectImportRuns,
    refetchInterval: (query) => (query.state.data?.importRuns.some(isActiveRun) ? POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: true,
  });

  const completedIds =
    query.data
      ?.filter((run) => run.status === "completed")
      .map((run) => run.id)
      .join(",") ?? "";

  useEffect(() => {
    if (completedIds) void invalidateCompanyListQueries(client);
  }, [client, completedIds]);

  return query;
}

export function useLoadExportDownload() {
  const client = useQueryClient();

  return useCallback(
    async (id: string) => {
      const listPrefix = Api.company_transfers.listExportRunsQueryKeyPrefix();

      // Signed download URLs can expire, so each click requests a fresh one.
      const { exportRun } = await client.fetchQuery({
        ...Api.company_transfers.getExportRunQueryOptions({ id }),
        staleTime: 0,
      });

      client.setQueriesData<CompanyTransfersListExportRunsResult>({ queryKey: listPrefix }, (current) =>
        current ? { ...current, exportRuns: mergeRun(current.exportRuns, exportRun) } : current,
      );
      return exportRun;
    },
    [client],
  );
}
