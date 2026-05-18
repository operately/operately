import Api, { CompanyExportRun } from "@/api";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  exportRuns: CompanyExportRun[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    exportRuns: await Api.company_transfers.listExportRuns({}).then((res) => res.exportRuns),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
