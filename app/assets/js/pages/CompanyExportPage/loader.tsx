import Api from "@/api";
import * as Pages from "@/components/Pages";
import * as CompanyExports from "@/models/companyExports";

export async function loader() {
  const queryInput = {};
  await Api.company_transfers.listExportRunsQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data: exportRuns } = CompanyExports.useExportRuns(queryInput);

  return { exportRuns: exportRuns ?? [] };
}
