import * as React from "react";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import * as CompanyExports from "@/models/companyExports";

import { CompanyExportPage as TurboCompanyExportPage, showErrorToast, showSuccessToast } from "turboui";
import { useLoadedData, loader } from "./loader";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useTranslation } from "react-i18next";

export default { name: "CompanyExportPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { exportRuns: runs } = useLoadedData();

  const { mutateAsync: startExport, isPending: starting } = CompanyExports.useStartExport();
  const loadExportDownload = CompanyExports.useLoadExportDownload();
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const handleStartExport = React.useCallback(async () => {
    if (starting) return;

    try {
      await startExport({});
      showSuccessToast(t("Export started"), t("You'll receive the package here when the job finishes."));
    } catch {
      showErrorToast(t("Failed to start export"), t("Please try again."));
    }
  }, [startExport, starting, t]);

  const handleDownload = React.useCallback(
    async (runId: string) => {
      setDownloading(runId);

      try {
        const run = await loadExportDownload(runId);
        const url = run.packageDownloadUrl;

        if (!url) {
          throw new Error("missing download url");
        }

        const link = document.createElement("a");
        link.href = url;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        showErrorToast(t("Download failed"), t("The export package is not ready yet."));
      } finally {
        setDownloading(null);
      }
    },
    [loadExportDownload, t],
  );

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
