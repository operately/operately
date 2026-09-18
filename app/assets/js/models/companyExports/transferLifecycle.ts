import Api, { type CompanyTransfersListExportRunsResult, type CompanyTransfersListImportRunsResult } from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mergeRun } from "./index";

export function useStartExport() {
  const client = useQueryClient();
  const key = Api.company_transfers.listExportRunsQueryKey({});
  const prefix = Api.company_transfers.listExportRunsQueryKeyPrefix();

  return useMutation({
    ...Api.company_transfers.startExportMutationOptions(),
    onSuccess: ({ exportRun }) => {
      // Preserve the new run even if the refresh fails, so polling can continue.
      client.setQueryData<CompanyTransfersListExportRunsResult>(key, (current) => ({
        exportRuns: mergeRun(current?.exportRuns ?? [], exportRun),
      }));
      return client.invalidateQueries({ queryKey: prefix });
    },
  });
}

export function useStartImport() {
  const client = useQueryClient();
  const key = Api.company_transfers.listImportRunsQueryKey({});
  const prefix = Api.company_transfers.listImportRunsQueryKeyPrefix();

  return useMutation({
    ...Api.company_transfers.startImportMutationOptions(),
    onSuccess: ({ importRun }) => {
      client.setQueryData<CompanyTransfersListImportRunsResult>(key, (current) => ({
        importRuns: mergeRun(current?.importRuns ?? [], importRun),
      }));
      return client.invalidateQueries({ queryKey: prefix });
    },
  });
}
