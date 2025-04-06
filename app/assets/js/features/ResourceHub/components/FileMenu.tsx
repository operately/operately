import React from "react";

import * as Hub from "@/models/resourceHubs";

import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuActionItem, MenuLinkItem } from "turboui";
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
  const menuId = createTestId("menu", file.id!);

  const relevantPermissions = [permissions.canView, permissions.canEditParentFolder, permissions.canDeleteFile];

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canView && <DownloadFileMenuItem file={file} />}
        {permissions.canEditFile && <EditFileMenuItem file={file} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={file} showModal={toggleMoveForm} />}
        {permissions.canDeleteFile && <DeleteFileMenuItem file={file} />}
      </Menu>

      <MoveResourceModal resource={file} resourceType="file" isOpen={showMoveForm} hideModal={toggleMoveForm} />
    </>
  );
}

function DownloadFileMenuItem({ file }: Props) {
  assertPresent(file.blob?.url, "blob.url must be present in file");
  assertPresent(file.name, "name must be present in file");

  const [downloadFile] = useDownloadFile(file.blob.url, file.name);

  return <MenuActionItem onClick={downloadFile}>Download</MenuActionItem>;
}

function EditFileMenuItem({ file }: Props) {
  const editPath = Paths.resourceHubEditFilePath(file.id!);
  const editId = createTestId("edit", file.id!);

  return (
    <MenuLinkItem testId={editId} to={editPath}>
      Edit
    </MenuLinkItem>
  );
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
