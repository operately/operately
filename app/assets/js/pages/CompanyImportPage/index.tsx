import * as React from "react";

import { PageModule } from "@/routes/types";
import Api from "@/api";
import * as Blobs from "@/models/blobs";
import * as CompanyExports from "@/models/companyExports";
import { Paths } from "@/routes/paths";
import { CompanyImportPage, showErrorToast, showSuccessToast } from "turboui";

import { useLoadedData, loader } from "./loader";

export default { name: "CompanyImportPage", loader, Page } as PageModule;

const POLL_INTERVAL_MS = 2_000;

const EMPTY_UPLOAD_STATE: CompanyImportPage.UploadedFileState = {
  blobId: null,
  fileName: null,
  progress: 0,
  uploading: false,
};


function Page() {
  const { importRuns } = useLoadedData();
  const [runs, setRuns] = React.useState(() => CompanyExports.sortRuns(importRuns));
  const [jsonFile, setJsonFile] = React.useState<CompanyImportPage.UploadedFileState>(EMPTY_UPLOAD_STATE);
  const [zipFile, setZipFile] = React.useState<CompanyImportPage.UploadedFileState>(EMPTY_UPLOAD_STATE);
  const [starting, setStarting] = React.useState(false);

  const refreshRuns = React.useCallback(async () => {
    const response = await Api.company_transfers.listImportRuns({});
    setRuns(CompanyExports.sortRuns(response.importRuns));
  }, []);

  React.useEffect(() => {
    if (!runs.some(CompanyExports.isActiveRun)) return;

    const interval = window.setInterval(() => {
      refreshRuns().catch(() => null);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [refreshRuns, runs]);

  const uploadArtifact = React.useCallback(
    async (file: File, kind: "json" | "zip") => {
      const setState = kind === "json" ? setJsonFile : setZipFile;

      setState({
        blobId: null,
        fileName: file.name,
        progress: 0,
        uploading: true,
      });

      try {
        const uploaded = await Blobs.uploadImportArtifactFile(file, (progress) => {
          setState((current) => ({ ...current, progress }));
        });

        setState({
          blobId: uploaded.id,
          fileName: file.name,
          progress: 100,
          uploading: false,
        });
      } catch {
        setState({
          blobId: null,
          fileName: file.name,
          progress: 0,
          uploading: false,
        });

        showErrorToast("Upload failed", `Failed to upload ${file.name}. Please try again.`);
      }
    },
    [],
  );

  const handleStartImport = React.useCallback(async () => {
    if (starting || !jsonFile.blobId || !zipFile.blobId) return;

    setStarting(true);

    try {
      await Api.company_transfers.startImport({
        jsonBlobId: jsonFile.blobId,
        zipBlobId: zipFile.blobId,
      });

      setJsonFile(EMPTY_UPLOAD_STATE);
      setZipFile(EMPTY_UPLOAD_STATE);
      showSuccessToast("Import started", "The company is being imported in the background.");
      await refreshRuns();
    } catch {
      showErrorToast("Failed to start import", "Please confirm both artifacts finished uploading and try again.");
    } finally {
      setStarting(false);
    }
  }, [jsonFile.blobId, refreshRuns, starting, zipFile.blobId]);

  const canUpload = true;
  const canStartImport = !!jsonFile.blobId && !!zipFile.blobId && !jsonFile.uploading && !zipFile.uploading;

  return (
    <CompanyImportPage
      runs={runs.map(CompanyExports.toImportPageRun)}
      jsonFile={jsonFile}
      zipFile={zipFile}
      starting={starting}
      canUpload={canUpload}
      canStartImport={canStartImport}
      backPath={Paths.lobbyPath()}
      uploadsUnavailableMessage="Uploads are unavailable for this account."
      onSelectJsonFile={(file) => uploadArtifact(file, "json")}
      onSelectZipFile={(file) => uploadArtifact(file, "zip")}
      onStartImport={handleStartImport}
    />
  );
}
