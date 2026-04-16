import Api, { Company, CompanyImportRun } from "@/api";
import * as Pages from "@/components/Pages";

export interface LoaderResult {
  importRuns: CompanyImportRun[];
  companies: Company[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    importRuns: await Api.company_transfers.listImportRuns({}).then((res) => res.importRuns),
    companies: await Api.companies.list({}).then((res) => res.companies),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
