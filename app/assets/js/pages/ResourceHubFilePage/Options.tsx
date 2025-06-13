import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Icons from "@tabler/icons-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { useDownloadFile } from "@/models/blobs";
import { useDeleteResourceHubFile } from "@/models/resourceHubs";

import { DeprecatedPaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Options() {
  const { file } = useLoadedData();
  assertPresent(file.permissions, "permissions must be present in file");

  return (
    <PageOptions.Root testId="options-button">
      {file.permissions.canView && <DownloadAction />}

      {file.permissions.canEditFile && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit"
          to={DeprecatedPaths.resourceHubEditFilePath(file.id!)}
          testId="edit-file-link"
        />
      )}

      {file.permissions.canDeleteFile && <DeleteAction />}
    </PageOptions.Root>
  );
}

function DownloadAction() {
  const { file } = useLoadedData();
  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.name, "name must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.name);

  return (
    <PageOptions.Action icon={Icons.IconDownload} title="Download" onClick={downloadFile} testId="download-file-link" />
  );
}

function DeleteAction() {
  const { file } = useLoadedData();
  const [remove] = useDeleteResourceHubFile();
  const navigate = useNavigate();

  const redirect = () => {
    if (file.parentFolder) {
      navigate(DeprecatedPaths.resourceHubFolderPath(file.parentFolder.id!));
    } else {
      assertPresent(file.resourceHub, "resourceHub must be present in file");
      navigate(DeprecatedPaths.resourceHubPath(file.resourceHub.id!));
    }
  };

  const handleDelete = async () => {
    await remove({ fileId: file.id });
    redirect();
  };

  return (
    <PageOptions.Action icon={Icons.IconTrash} title="Delete" onClick={handleDelete} testId="delete-resource-link" />
  );
}
