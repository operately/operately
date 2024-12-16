import React from "react";

import * as Hub from "@/models/resourceHubs";
import { Menu, MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { assertPresent } from "@/utils/assertions";
import { useDownloadFile } from "@/models/blobs";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";
import { useNodesContext } from "../contexts/NodesContext";

interface Props {
  file: Hub.ResourceHubFile;
}

export function FileMenu({ file }: Props) {
  const { permissions } = useNodesContext();

  const relevantPermissions = [permissions.canView, permissions.canEditParentFolder, permissions.canDeleteFile];
  const menuId = createTestId("file-menu", file.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canView && <DownloadFileMenuItem file={file} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={file} />}
        {permissions.canDeleteFile && <DeleteFileMenuItem file={file} />}
      </Menu>

      <MoveResourceModal resource={file} resourceType="file" />
    </>
  );
}

function DownloadFileMenuItem({ file }: Props) {
  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.blob.filename, "blob.filename must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.blob.filename);

  return <MenuActionItem onClick={downloadFile}>Download</MenuActionItem>;
}

function DeleteFileMenuItem({ file }: Props) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubFile();

  const handleDelete = async () => {
    await remove({ fileId: file.id });
    refetch();
  };
  const deleteId = createTestId("delete", file.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}
