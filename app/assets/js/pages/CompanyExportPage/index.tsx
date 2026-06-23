import * as React from "react";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import Api from "@/api";
import * as CompanyExports from "@/models/companyExports";

import { CompanyExportPage as TurboCompanyExportPage, showErrorToast, showSuccessToast } from "turboui";
import { useLoadedData, loader } from "./loader";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export default { name: "CompanyExportPage", loader, Page } as PageModule;

const POLL_INTERVAL_MS = 2_000;

function Page() {
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { exportRuns } = useLoadedData();

  const [runs, setRuns] = React.useState(() => CompanyExports.sortRuns(exportRuns));
  const [starting, setStarting] = React.useState(false);
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const refreshRuns = React.useCallback(async () => {
    const response = await Api.company_transfers.listExportRuns({});
    setRuns(CompanyExports.sortRuns(response.exportRuns));
  }, []);

  React.useEffect(() => {
    if (!runs.some(CompanyExports.isActiveRun)) return;

    const interval = window.setInterval(() => {
      refreshRuns().catch(() => null);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [refreshRuns, runs]);

  const handleStartExport = React.useCallback(async () => {
    if (starting) return;

    setStarting(true);

    try {
      await Api.company_transfers.startExport({});
      showSuccessToast("Export started", "You'll receive the package here when the job finishes.");
      await refreshRuns();
    } catch {
      showErrorToast("Failed to start export", "Please try again.");
    } finally {
      setStarting(false);
    }
  }, [refreshRuns, starting]);

  const handleDownload = React.useCallback(async (runId: string) => {
    setDownloading(runId);

    try {
      const response = await Api.company_transfers.getExportRun({ id: runId });
      const run = response.exportRun;
      const url = run.packageDownloadUrl;

      if (!url) {
        throw new Error("missing download url");
      }

      setRuns((current) => CompanyExports.mergeRun(current, run));
      const link = document.createElement("a");
      link.href = url;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      showErrorToast("Download failed", "The export package is not ready yet.");
    } finally {
      setDownloading(null);
    }
  }, []);

  return (
    <TurboCompanyExportPage
      runs={runs}
      starting={starting}
      downloading={downloading}
      backPath={paths.companyAdminPath()}
      onStartExport={handleStartExport}
      onDownload={handleDownload}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
