import React from "react";

import type { Page } from "turboui";
import { IconDownload, IconEdit, IconTrash } from "turboui";

import { useDownloadFile } from "@/models/blobs";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

interface Props {
  showDeleteModal: () => void;
}

export function useFilePageOptions({ showDeleteModal }: Props): Page.Option[] {
  const { file } = useLoadedData();
  const paths = usePaths();

  assertPresent(file.permissions, "permissions must be present in file");

  const [downloadFile] = useDownloadFile(file.blob?.url || "", file.name || "");

  return React.useMemo(
    () => [
      {
        type: "action",
        icon: IconDownload,
        label: "Download",
        onClick: downloadFile,
        hidden: !file.permissions?.canView || !file.blob?.url || !file.name,
        testId: "download-file-link",
      },
      {
        type: "link",
        icon: IconEdit,
        label: "Edit",
        link: paths.resourceHubEditFilePath(file.id!),
        hidden: !file.permissions?.canEditFile,
        testId: "edit-file-link",
      },
      {
        type: "action",
        icon: IconTrash,
        label: "Delete",
        onClick: showDeleteModal,
        hidden: !file.permissions?.canDeleteFile,
        testId: "delete-resource-link",
      },
    ],
    [
      downloadFile,
      file.blob?.url,
      file.id,
      file.name,
      file.permissions?.canDeleteFile,
      file.permissions?.canEditFile,
      file.permissions?.canView,
      paths,
      showDeleteModal,
    ],
  );
}
