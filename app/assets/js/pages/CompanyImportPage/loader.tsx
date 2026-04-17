import Api, { CompanyImportRun } from "@/api";
import * as Socket from "@/api/socket";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  importRuns: CompanyImportRun[];
}

export async function loader(): Promise<LoaderResult> {
  Api.default.setHeaders({});
  Socket.setHeaders({});

  return {
    importRuns: await Api.company_transfers.listImportRuns({}).then((res) => res.importRuns),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
