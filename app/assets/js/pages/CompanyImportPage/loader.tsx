import Api from "@/api";
import * as Pages from "@/components/Pages";
import * as CompanyExports from "@/models/companyExports";
import * as Socket from "@/api/socket";

export function onNavigate() {
  Api.default.setHeaders({});
  Socket.setHeaders({});
}

export async function loader() {
  const queryInput = {};

  await Api.company_transfers.listImportRunsQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data: importRuns } = CompanyExports.useImportRuns(queryInput);

  return { importRuns: importRuns ?? [] };
}
