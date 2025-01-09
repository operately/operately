import React from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useDeleteResourceHubFile } from "@/models/resourceHubs";
import { useDownloadFile } from "@/models/blobs";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

export function Options() {
  const { file } = useLoadedData();
  assertPresent(file.permissions, "permissions must be present in file");

  return (
    <PageOptions.Root testId="project-options-button">
      {file.permissions.canView && <DownloadAction />}

      {file.permissions.canEditFile && (
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit"
          to={Paths.resourceHubEditFilePath(file.id!)}
          testId="edit-file-link"
        />
      )}

      {file.permissions.canDeleteFile && <DeleteAction />}
    </PageOptions.Root>
  );
}

function DownloadAction() {
  const { file } = useLoadedData();
  assertPresent(file.blob, "blob must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url!, file.blob.filename!);

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
      navigate(Paths.resourceHubFolderPath(file.parentFolder.id!));
    } else {
      assertPresent(file.resourceHub, "resourceHub must be present in file");
      navigate(Paths.resourceHubPath(file.resourceHub.id!));
    }
  };

  const handleDelete = async () => {
    await remove({ fileId: file.id });
    redirect();
  };

  return <PageOptions.Action icon={Icons.IconTrash} title="Delete" onClick={handleDelete} testId="delete-file-link" />;
}
