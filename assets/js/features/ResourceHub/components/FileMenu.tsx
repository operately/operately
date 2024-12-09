import React from "react";

import * as Hub from "@/models/resourceHubs";
import { Menu, MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { assertPresent } from "@/utils/assertions";
import { useDownloadFile } from "@/models/blobs";

interface FileMenuProps {
  permissions: Hub.ResourceHubPermissions;
  refetch: () => void;
  file: Hub.ResourceHubFile;
}

export function FileMenu({ file, permissions, refetch }: FileMenuProps) {
  const relevantPermissions = [permissions.canDeleteFile, permissions.canView];
  const menuId = createTestId("file-menu", file.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <Menu size="medium" testId={menuId}>
      {permissions.canView && <DownloadFileMenuItem file={file} />}
      {permissions.canDeleteFile && <DeleteFileMenuItem file={file} refetch={refetch} />}
    </Menu>
  );
}

function DownloadFileMenuItem({ file }: { file: Hub.ResourceHubFile }) {
  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.blob.filename, "blob.filename must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.blob.filename);

  return <MenuActionItem onClick={downloadFile}>Download</MenuActionItem>;
}

function DeleteFileMenuItem({ file, refetch }: { file: Hub.ResourceHubFile; refetch: () => void }) {
  const [remove] = Hub.useDeleteResourceHubFile();
  const handleDelete = async () => {
    await remove({ fileId: file.id });
    refetch();
  };
  const deleteId = createTestId("delete", file.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete file
    </MenuActionItem>
  );
}
