import Api, { CompanyExportRun } from "@/api";
import * as Pages from "@/components/Pages";
import * as CompanyExports from "@/models/companyExports";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";

export interface LoaderResult {
  exportRuns: CompanyExportRun[];
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: CompanyExports.FEATURE_NAME,
    path: new Paths({ companyId: params.companyId! }).homePath(),
  });

  return {
    exportRuns: await Api.company_transfers.listExportRuns({}).then((res) => res.exportRuns),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
