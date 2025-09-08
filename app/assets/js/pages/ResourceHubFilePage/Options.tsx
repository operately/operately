import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { IconEdit, IconDownload, IconTrash } from "turboui";
import React from "react";

import { useDownloadFile } from "@/models/blobs";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

interface Props {
  showDeleteModal: () => void;
}

export function Options({ showDeleteModal }: Props) {
  const { file } = useLoadedData();
  const paths = usePaths();
  assertPresent(file.permissions, "permissions must be present in file");

  return (
    <PageOptions.Root testId="options-button">
      {file.permissions.canView && <DownloadAction />}

      {file.permissions.canEditFile && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={paths.resourceHubEditFilePath(file.id!)}
          testId="edit-file-link"
        />
      )}

      {file.permissions.canDeleteFile && <DeleteAction onClick={showDeleteModal} />}
    </PageOptions.Root>
  );
}

function DownloadAction() {
  const { file } = useLoadedData();
  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.name, "name must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.name);

  return <PageOptions.Action icon={IconDownload} title="Download" onClick={downloadFile} testId="download-file-link" />;
}

function DeleteAction({ onClick }: { onClick: () => void }) {
  return <PageOptions.Action icon={IconTrash} title="Delete" onClick={onClick} testId="delete-resource-link" />;
}
