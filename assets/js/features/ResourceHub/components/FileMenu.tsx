import React from "react";

import * as Hub from "@/models/resourceHubs";

import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuActionItem, MenuLinkItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { assertPresent } from "@/utils/assertions";
import { useDownloadFile } from "@/models/blobs";
import { useNodesContext } from "@/features/ResourceHub";
import { Paths } from "@/routes/paths";

interface Props {
  file: Hub.ResourceHubFile;
}

export function FileMenu({ file }: Props) {
  const { permissions } = useNodesContext();
  const [showMoveForm, toggleMoveForm] = useBoolState(false);

  const relevantPermissions = [permissions.canView, permissions.canEditParentFolder, permissions.canDeleteFile];

  const editPath = Paths.resourceHubEditFilePath(file.id!);
  const menuId = createTestId("file-menu", file.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canView && <DownloadFileMenuItem file={file} />}
        {permissions.canEditFile && <MenuLinkItem to={editPath}>Edit</MenuLinkItem>}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={file} showModal={toggleMoveForm} />}
        {permissions.canDeleteFile && <DeleteFileMenuItem file={file} />}
      </Menu>

      <MoveResourceModal resource={file} resourceType="file" isOpen={showMoveForm} hideModal={toggleMoveForm} />
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
