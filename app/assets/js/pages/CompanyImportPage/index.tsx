import * as React from "react";

import { PageModule } from "@/routes/types";
import * as Blobs from "@/models/blobs";
import * as CompanyExports from "@/models/companyExports";
import { Paths } from "@/routes/paths";
import { CompanyImportPage, showErrorToast, showSuccessToast } from "turboui";
import { useTranslation } from "react-i18next";

import { useLoadedData, loader, onNavigate } from "./loader";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export default { name: "CompanyImportPage", loader, onNavigate, Page } as PageModule;

const EMPTY_UPLOAD_STATE: CompanyImportPage.UploadedFileState = {
  blobId: null,
  fileName: null,
  progress: 0,
  uploading: false,
};

function Page() {
  const { t } = useTranslation();
  const { importRuns: runs } = useLoadedData();
  const formattedTimePreferences = useFormattedTimePreferences();
  const [packageFile, setPackageFile] = React.useState<CompanyImportPage.UploadedFileState>(EMPTY_UPLOAD_STATE);
  const { mutateAsync: startImport, isPending: starting } = CompanyExports.useStartImport();

  const uploadArtifact = React.useCallback(async (file: File) => {
    setPackageFile({
      blobId: null,
      fileName: file.name,
      progress: 0,
      uploading: true,
    });

    try {
      const uploaded = await Blobs.uploadImportArtifactFile(file, (progress) => {
        setPackageFile((current) => ({ ...current, progress }));
      });

      setPackageFile({
        blobId: uploaded.id,
        fileName: file.name,
        progress: 100,
        uploading: false,
      });
    } catch {
      setPackageFile({
        blobId: null,
        fileName: file.name,
        progress: 0,
        uploading: false,
      });

      showErrorToast(t("Upload failed"), t("Failed to upload {{name}}. Please try again.", { name: file.name }));
    }
  }, [t]);

  const handleStartImport = React.useCallback(async () => {
    if (starting || !packageFile.blobId) return;

    try {
      await startImport({
        packageBlobId: packageFile.blobId,
      });

      setPackageFile(EMPTY_UPLOAD_STATE);
      showSuccessToast(t("Import started"), t("The company is being imported in the background."));
    } catch {
      showErrorToast(t("Failed to start import"), t("Please confirm the package finished uploading and try again."));
    }
  }, [packageFile.blobId, startImport, starting, t]);

  const handleClearPackageFile = React.useCallback(() => {
    if (starting) return;
    setPackageFile(EMPTY_UPLOAD_STATE);
  }, [starting]);

  const canUpload = true;
  const canStartImport = !!packageFile.blobId && !packageFile.uploading;

  return (
    <CompanyImportPage
      runs={runs.map(CompanyExports.toImportPageRun)}
      packageFile={packageFile}
      starting={starting}
      canUpload={canUpload}
      canStartImport={canStartImport}
      backPath={Paths.lobbyPath()}
      uploadsUnavailableMessage={t("Uploads are unavailable for this account.")}
      onSelectPackageFile={uploadArtifact}
      onClearPackageFile={handleClearPackageFile}
      onStartImport={handleStartImport}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
